import { MovementsRepositoryPort } from '../../domain/ports/movements.repository.port';
import { Injectable } from '@nestjs/common';
import { CuyesDepsService } from '../../application/cuyes-deps.service';

@Injectable()
export class MovementsRepository extends MovementsRepositoryPort {
  constructor(private readonly cuyesDeps: CuyesDepsService) { super(); }

  private get db() {
    return this.cuyesDeps.toDeps().db;
  }

  async getCage(client, idJaula, farmId) {
      const q = client || this.db;
      const { rows } = await q.query(
        `SELECT j.id, j.codigo, j.capacidad_maxima, j.id_area, a.nombre AS area,
                a.proposito, a.id_granja,
                (SELECT COUNT(*)::int FROM animales an
                  WHERE an.id_jaula = j.id AND an.estado = 'activo') AS ocupacion
         FROM recintos j
         JOIN areas a ON a.id = j.id_area
         WHERE j.id = $1 AND a.id_granja = $2 AND j.activa = true`,
        [idJaula, farmId]
      );
      return rows[0] || null;
    }
  async getAnimalsFromCage(client, jaulaId, farmId) {
      const q = client || this.db;
      const { rows } = await q.query(
        `SELECT an.id FROM animales an
         JOIN recintos j ON j.id = an.id_jaula
         JOIN areas a ON a.id = j.id_area
         WHERE j.id = $1 AND a.id_granja = $2 AND an.estado = 'activo'`,
        [jaulaId, farmId]
      );
      return rows.map((r) => r.id);
    }
  async getActiveAnimals(client, animalIds, farmId) {
      const q = client || this.db;
      const { rows } = await q.query(
        `SELECT an.*, c.nombre AS categoria, c.proposito_area
         FROM animales an
         LEFT JOIN categorias c ON c.id = an.id_categoria
         WHERE an.id = ANY($1::int[]) AND an.id_granja = $2 AND an.estado = 'activo'`,
        [animalIds, farmId]
      );
      return rows;
    }
  async executeRelocation({ farmId, userId, fecha, idJaulaDestino, motivo, animales, excedio, avisosArea }) {
      const client = await this.db.connect();
      try {
        await client.query('BEGIN');
        const creados = [];
        for (const a of animales) {
          const { rows } = await client.query(
            `INSERT INTO movimientos
              (tipo, id_animal, id_granja_origen, id_granja_destino,
               id_jaula_origen, id_jaula_destino, fecha, motivo,
               excedio_capacidad, aviso_area, created_by)
             VALUES ('relocate',$1,$2,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
            [
              a.id,
              farmId,
              a.id_jaula,
              idJaulaDestino,
              fecha,
              motivo || null,
              excedio,
              avisosArea.some((x) => x.id === a.id),
              userId,
            ]
          );
          await client.query(`UPDATE animales SET id_jaula = $1, updated_at = NOW() WHERE id = $2`, [
            idJaulaDestino,
            a.id,
          ]);
          creados.push(rows[0]);
        }
        await client.query('COMMIT');
        return creados;
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    }
  async getFarmSpecies(farmId) {
      const { rows } = await this.db.query(`SELECT id, id_especie FROM granjas WHERE id = $1`, [farmId]);
      return rows[0] || null;
    }
  async getActiveFarm(farmId) {
      const { rows } = await this.db.query(
        `SELECT id, id_especie FROM granjas WHERE id = $1 AND activa = true`,
        [farmId]
      );
      return rows[0] || null;
    }
  async listDestinationCages(farmId) {
      const { rows } = await this.db.query(
        `SELECT j.id, j.codigo, j.capacidad_maxima, a.nombre AS area, a.proposito,
                (SELECT COUNT(*)::int FROM animales an
                  WHERE an.id_jaula = j.id AND an.estado = 'activo') AS ocupacion
         FROM recintos j
         JOIN areas a ON a.id = j.id_area
         WHERE a.id_granja = $1 AND j.activa = true
         ORDER BY a.nombre, j.codigo`,
        [farmId]
      );
      return rows;
    }
  async getTransferAnimals(client, animalIds, farmId) {
      const q = client || this.db;
      const { rows } = await q.query(
        `SELECT * FROM animales WHERE id = ANY($1::int[]) AND id_granja = $2 AND estado = 'activo'`,
        [animalIds, farmId]
      );
      return rows;
    }
  async codeExistsInFarm(client, granjaDestino, codigoNorm, excludeId) {
      const q = client || this.db;
      const { rows } = await q.query(
        `SELECT id FROM animales WHERE id_granja = $1 AND codigo_norm = $2 AND id <> $3`,
        [granjaDestino, codigoNorm, excludeId]
      );
      return rows[0] || null;
    }
  async executeTransfer({
      granjaOrigen,
      granjaDestino,
      userId,
      fecha,
      idJaulaDestino,
      motivo,
      animales,
      excedio
    }) {
      const client = await this.db.connect();
      try {
        await client.query('BEGIN');
        const creados = [];
        for (const a of animales) {
          const { rows } = await client.query(
            `INSERT INTO movimientos
              (tipo, id_animal, id_granja_origen, id_granja_destino,
               id_jaula_origen, id_jaula_destino, fecha, motivo,
               excedio_capacidad, created_by)
             VALUES ('transfer',$1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
            [
              a.id,
              granjaOrigen,
              granjaDestino,
              a.id_jaula,
              idJaulaDestino,
              fecha,
              motivo.trim(),
              excedio,
              userId,
            ]
          );
          await client.query(
            `UPDATE animales SET id_granja = $1, id_jaula = $2, updated_at = NOW() WHERE id = $3`,
            [granjaDestino, idJaulaDestino, a.id]
          );
          creados.push(rows[0]);
        }
        await client.query('COMMIT');
        return creados;
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    }
  async animalHistory(animalId, farmId) {
      const { rows } = await this.db.query(
        `SELECT m.*,
                jo.codigo AS jaula_origen, ao.nombre AS area_origen,
                jd.codigo AS jaula_destino, ad.nombre AS area_destino,
                go.nombre AS granja_origen, gd.nombre AS granja_destino
         FROM movimientos m
         LEFT JOIN recintos jo ON jo.id = m.id_jaula_origen
         LEFT JOIN areas ao ON ao.id = jo.id_area
         LEFT JOIN recintos jd ON jd.id = m.id_jaula_destino
         LEFT JOIN areas ad ON ad.id = jd.id_area
         LEFT JOIN granjas go ON go.id = m.id_granja_origen
         LEFT JOIN granjas gd ON gd.id = m.id_granja_destino
         WHERE m.id_animal = $1
           AND (m.id_granja_origen = $2 OR m.id_granja_destino = $2)
         ORDER BY m.fecha DESC, m.id DESC`,
        [animalId, farmId]
      );
      return rows;
    }
  async findCageInFarm(jaulaId, farmId) {
      const { rows } = await this.db.query(
        `SELECT j.id, j.codigo, a.nombre AS area
         FROM recintos j JOIN areas a ON a.id = j.id_area
         WHERE j.id = $1 AND a.id_granja = $2`,
        [jaulaId, farmId]
      );
      return rows[0] || null;
    }
  async currentAnimalsInCage(jaulaId, farmId) {
      const { rows } = await this.db.query(
        `SELECT an.id, an.codigo, an.sexo, an.estado, c.nombre AS categoria
         FROM animales an
         LEFT JOIN categorias c ON c.id = an.id_categoria
         WHERE an.id_jaula = $1 AND an.id_granja = $2 AND an.estado = 'activo'
         ORDER BY an.codigo`,
        [jaulaId, farmId]
      );
      return rows;
    }
  async animalsOnDate(jaulaId, fecha, farmId) {
      const { rows } = await this.db.query(
        `WITH ultimos AS (
           SELECT DISTINCT ON (m.id_animal)
                  m.id_animal, m.id_jaula_destino
           FROM movimientos m
           WHERE m.fecha <= $2::date
             AND (m.id_granja_origen = $3 OR m.id_granja_destino = $3)
           ORDER BY m.id_animal, m.fecha DESC, m.id DESC
         )
         SELECT an.id, an.codigo, an.sexo, an.estado, c.nombre AS categoria
         FROM animales an
         LEFT JOIN categorias c ON c.id = an.id_categoria
         LEFT JOIN ultimos u ON u.id_animal = an.id
         WHERE (
             u.id_jaula_destino = $1
             OR (
               u.id_animal IS NULL
               AND an.id_jaula = $1
               AND an.id_granja = $3
               AND COALESCE(an.fecha_nacimiento, an.created_at::date) <= $2::date
             )
           )
           AND (an.estado = 'activo' OR COALESCE(an.fecha_baja, '9999-12-31'::date) > $2::date)
         ORDER BY an.codigo`,
        [jaulaId, fecha, farmId]
      );
      return rows;
    }
  async cageHistory(jaulaId, fecha, farmId) {
      const { rows } = await this.db.query(
        `SELECT m.*, an.codigo,
                jo.codigo AS jaula_origen, ao.nombre AS area_origen,
                jd.codigo AS jaula_destino, ad.nombre AS area_destino
         FROM movimientos m
         JOIN animales an ON an.id = m.id_animal
         LEFT JOIN recintos jo ON jo.id = m.id_jaula_origen
         LEFT JOIN areas ao ON ao.id = jo.id_area
         LEFT JOIN recintos jd ON jd.id = m.id_jaula_destino
         LEFT JOIN areas ad ON ad.id = jd.id_area
         WHERE (m.id_jaula_origen = $1 OR m.id_jaula_destino = $1)
           AND m.fecha <= $2
           AND (m.id_granja_origen = $3 OR m.id_granja_destino = $3)
         ORDER BY m.fecha DESC, m.id DESC
         LIMIT 100`,
        [jaulaId, fecha, farmId]
      );
      return rows;
    }
  async listRecent(farmId) {
      const { rows } = await this.db.query(
        `SELECT m.*, an.codigo,
                jo.codigo AS jaula_origen, jd.codigo AS jaula_destino
         FROM movimientos m
         JOIN animales an ON an.id = m.id_animal
         LEFT JOIN recintos jo ON jo.id = m.id_jaula_origen
         LEFT JOIN recintos jd ON jd.id = m.id_jaula_destino
         WHERE m.id_granja_origen = $1 OR m.id_granja_destino = $1
         ORDER BY m.fecha DESC, m.id DESC
         LIMIT 200`,
        [farmId]
      );
      return rows;
    }
  async listOvercapacity(farmId) {
      const { rows } = await this.db.query(
        `SELECT j.id, j.codigo, j.capacidad_maxima, a.nombre AS area,
                COUNT(an.id)::int AS ocupacion
         FROM recintos j
         JOIN areas a ON a.id = j.id_area
         LEFT JOIN animales an ON an.id_jaula = j.id AND an.estado = 'activo'
         WHERE a.id_granja = $1 AND j.activa = true AND j.capacidad_maxima IS NOT NULL
         GROUP BY j.id, j.codigo, j.capacidad_maxima, a.nombre
         HAVING COUNT(an.id) > j.capacidad_maxima
         ORDER BY a.nombre, j.codigo`,
        [farmId]
      );
      return rows;
    }
  async listAnimalsWithArea(farmId) {
      const { rows } = await this.db.query(
        `SELECT an.id, an.codigo, an.sexo, c.nombre AS categoria, c.proposito_area,
                a.nombre AS area, a.proposito AS proposito_actual, j.codigo AS jaula
         FROM animales an
         LEFT JOIN categorias c ON c.id = an.id_categoria
         JOIN recintos j ON j.id = an.id_jaula
         JOIN areas a ON a.id = j.id_area
         WHERE an.id_granja = $1 AND an.estado = 'activo'
         ORDER BY a.nombre, an.codigo`,
        [farmId]
      );
      return rows;
  }
}
