import {
  AnimalsRepositoryPort,
  InsertNewAnimalParams,
  ReuseDischargedCodeParams,
} from '../../domain/ports/animals.repository.port';
import { Injectable } from '@nestjs/common';
import { CuyesDepsService } from '../../application/cuyes-deps.service';

const ANIMAL_SELECT = `
  SELECT a.*, r.nombre AS raza, c.nombre AS categoria, j.codigo AS jaula, ar.nombre AS area
  FROM animales a
  LEFT JOIN razas r ON r.id = a.id_raza
  LEFT JOIN categorias c ON c.id = a.id_categoria
  LEFT JOIN recintos j ON j.id = a.id_jaula
  LEFT JOIN areas ar ON ar.id = j.id_area
`;

const ORDER_MAP = {
  codigo: 'a.codigo',
  fecha_nacimiento: 'a.fecha_nacimiento NULLS LAST, a.codigo',
  ubicacion: 'ar.nombre NULLS LAST, j.codigo NULLS LAST, a.codigo',
};

const HISTORIAL_SQL = `
  SELECT 'particularidad' AS tipo, fecha::text AS fecha, texto AS detalle, created_at
  FROM animal_particularidades WHERE id_animal = $1
  UNION ALL
  SELECT 'empadre', e.fecha_empadre::text, 'Empadre #' || e.id::text, e.created_at
  FROM empadre_hembras eh JOIN empadres e ON e.id = eh.id_empadre WHERE eh.id_hembra = $1
  UNION ALL
  SELECT 'parto', p.fecha_parto::text, 'Camada M:'||p.vivos_m||' H:'||p.vivos_h, p.created_at
  FROM partos p WHERE p.id_hembra = $1
  UNION ALL
  SELECT 'destete', d.fecha_destete::text,
         'Destete M:'||d.destetados_m||' H:'||d.destetados_h, d.created_at
  FROM destetes d JOIN partos p ON p.id = d.id_parto WHERE p.id_hembra = $1
  UNION ALL
  SELECT 'mortalidad', m.fecha::text, COALESCE(m.causa,'Mortalidad'), m.created_at
  FROM mortalidad m WHERE m.id_animal = $1
  UNION ALL
  SELECT 'venta', v.fecha::text, 'Venta', v.created_at
  FROM ventas v WHERE v.id_animal = $1
  UNION ALL
  SELECT m.tipo,
         m.fecha::text,
         COALESCE(jo.codigo,'—') || ' (' || COALESCE(ao.nombre,'') || ') → ' ||
         COALESCE(jd.codigo,'—') || ' (' || COALESCE(ad.nombre,'') || ')' ||
         CASE WHEN m.id_granja_origen IS DISTINCT FROM m.id_granja_destino
              THEN ' [' || COALESCE(go.nombre,'') || ' → ' || COALESCE(gd.nombre,'') || ']'
              ELSE '' END,
         m.created_at
  FROM movimientos m
  LEFT JOIN recintos jo ON jo.id = m.id_jaula_origen
  LEFT JOIN areas ao ON ao.id = jo.id_area
  LEFT JOIN recintos jd ON jd.id = m.id_jaula_destino
  LEFT JOIN areas ad ON ad.id = jd.id_area
  LEFT JOIN granjas go ON go.id = m.id_granja_origen
  LEFT JOIN granjas gd ON gd.id = m.id_granja_destino
  WHERE m.id_animal = $1
  UNION ALL
  SELECT 'tratamiento', t.fecha_inicio::text,
         t.tipo || ': ' || t.producto || ' (' || t.estado || ') hasta ' || t.fecha_termino::text,
         t.created_at
  FROM tratamientos t WHERE t.id_animal = $1
  UNION ALL
  SELECT 'pesaje', p.fecha::text, p.peso_gramos::text || ' g', p.created_at
  FROM pesajes p WHERE p.id_animal = $1
  ORDER BY created_at DESC
`;

@Injectable()
export class AnimalsRepository extends AnimalsRepositoryPort {
  constructor(private readonly cuyesDeps: CuyesDepsService) { super(); }

  private get db() {
    return this.cuyesDeps.toDeps().db;
  }

  async list(farmId, filters) {
      const {
        sexo,
        id_categoria,
        id_raza,
        id_area,
        id_jaula,
        estado = 'activo',
        q,
        sort = 'codigo'
      } = filters;

      const params = [farmId];
      let where = 'WHERE a.id_granja = $1';
      const add = (val, sql) => {
        params.push(val);
        where += ` AND ${sql.replace('?', `$${params.length}`)}`;
      };
      if (estado && estado !== 'todos') add(estado, 'a.estado = ?');
      if (sexo) add(sexo, 'a.sexo = ?');
      if (id_categoria) add(Number(id_categoria), 'a.id_categoria = ?');
      if (id_raza) add(Number(id_raza), 'a.id_raza = ?');
      if (id_jaula) add(Number(id_jaula), 'a.id_jaula = ?');
      if (id_area) add(Number(id_area), 'j.id_area = ?');
      if (q) add(`%${q}%`, 'a.codigo_norm LIKE ?');

      const orderBy = ORDER_MAP[sort] || ORDER_MAP.codigo;
      const { rows } = await this.db.query(`${ANIMAL_SELECT} ${where} ORDER BY ${orderBy}`, params);
      return rows;
    }
  async findByNormalizedCode(farmId, codigoNorm) {
      const { rows } = await this.db.query(
        `${ANIMAL_SELECT} WHERE a.id_granja = $1 AND a.codigo_norm = $2`,
        [farmId, codigoNorm]
      );
      return rows[0] || null;
    }
  async getHistory(animalId) {
      const { rows } = await this.db.query(HISTORIAL_SQL, [animalId]);
      return rows;
    }
  async getTreatments(animalId) {
      const { rows } = await this.db.query(
        `SELECT * FROM tratamientos WHERE id_animal = $1 ORDER BY fecha_inicio DESC`,
        [animalId]
      );
      return rows;
    }
  async findActiveCage(farmId, idJaula) {
      const { rows } = await this.db.query(
        `SELECT j.id, j.capacidad_maxima,
                (SELECT COUNT(*)::int FROM animales an
                  WHERE an.id_jaula = j.id AND an.estado = 'activo') AS ocupacion
         FROM recintos j
         WHERE j.id = $1 AND j.id_granja = $2 AND j.activa = true`,
        [idJaula, farmId]
      );
      return rows[0] || null;
    }
  async findByNormalizedCodeRaw(farmId, codigoNorm) {
      const { rows } = await this.db.query(
        `SELECT id, codigo, estado FROM animales WHERE id_granja=$1 AND codigo_norm=$2`,
        [farmId, codigoNorm]
      );
      return rows[0] || null;
    }
  async insertNew({ farmId, userId, animal }: InsertNewAnimalParams) {
      const client = await this.db.connect();
      try {
        await client.query('BEGIN');
        const { rows } = await client.query(
          `INSERT INTO animales
            (id_granja, codigo, codigo_norm, sexo, id_raza, id_categoria, id_jaula, fecha_nacimiento, created_by)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8::date,$9) RETURNING *`,
          [
            farmId,
            animal.code.original,
            animal.code.normalized,
            animal.sex,
            animal.breedId,
            animal.categoryId,
            animal.cageId,
            animal.birthDate?.isoDate ?? null,
            userId,
          ]
        );
        if (animal.note) {
          await client.query(
            `INSERT INTO animal_particularidades (id_animal, texto, created_by) VALUES ($1,$2,$3)`,
            [rows[0].id, animal.note, userId]
          );
        }
        await client.query('COMMIT');
        return rows[0];
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    }
  async reuseDischargedCode({ userId, existente, animal }: ReuseDischargedCodeParams) {
      const { rows } = await this.db.query(
        `UPDATE animales SET
           sexo=$1, id_raza=$2, id_categoria=$3, id_jaula=$4, fecha_nacimiento=$5::date,
           estado='activo', fecha_baja=NULL, motivo_baja=NULL, codigo=$6, updated_at=NOW()
         WHERE id=$7 RETURNING *`,
        [
          animal.sex,
          animal.breedId,
          animal.categoryId,
          animal.cageId,
          animal.birthDate?.isoDate ?? null,
          animal.code.original,
          existente.id,
        ]
      );
      if (animal.note) {
        await this.db.query(
          `INSERT INTO animal_particularidades (id_animal, texto, created_by) VALUES ($1,$2,$3)`,
          [rows[0].id, animal.note, userId]
        );
      }
      return rows[0];
    }
  async findById(farmId, id) {
      const { rows } = await this.db.query(`SELECT * FROM animales WHERE id=$1 AND id_granja=$2`, [
        id,
        farmId,
      ]);
      return rows[0] || null;
    }
  async update({ id, data }) {
      const { rows } = await this.db.query(
        `UPDATE animales SET
           estado = COALESCE($1, estado),
           motivo_baja = COALESCE($2, motivo_baja),
           fecha_baja = COALESCE($3::date, fecha_baja),
           id_categoria = COALESCE($4, id_categoria),
           id_jaula = COALESCE($5, id_jaula),
           updated_at = NOW()
         WHERE id = $6 RETURNING *`,
        [
          data.estado || null,
          data.motivo_baja || null,
          data.fecha_baja || null,
          data.id_categoria || null,
          data.id_jaula || null,
          id,
        ]
      );
      return rows[0] || null;
    }
  async insertNote({ id, texto, fecha, userId }) {
      await this.db.query(
        `INSERT INTO animal_particularidades (id_animal, texto, fecha, created_by) VALUES ($1,$2,COALESCE($3,CURRENT_DATE),$4)`,
        [id, texto, fecha || null, userId]
      );
  }
}
