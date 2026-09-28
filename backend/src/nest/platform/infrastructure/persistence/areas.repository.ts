import { AreasRepositoryPort } from '../../domain/ports/areas.repository.port';
import { Injectable } from '@nestjs/common';
import { SharedDepsService } from '../../../shared/deps/shared-deps.service';

@Injectable()
export class AreasRepository extends AreasRepositoryPort {
  constructor(private readonly sharedDeps: SharedDepsService) {
    super();
  }

  private get db() {
    return this.sharedDeps.db;
  }

  async list(farmId: number) {
    const { rows } = await this.db.query(
      `SELECT a.*,
              (SELECT COUNT(*)::int FROM recintos j WHERE j.id_area = a.id AND j.activa) AS jaulas,
              (SELECT COUNT(*)::int FROM animales an
                 JOIN recintos j ON j.id = an.id_jaula
                WHERE j.id_area = a.id AND an.estado = 'activo') AS animales
       FROM areas a
       WHERE a.id_granja = $1
       ORDER BY a.nombre`,
      [farmId],
    );
    return rows;
  }

  async summary(farmId: number) {
    const { rows } = await this.db.query(
      `SELECT a.id, a.nombre, a.proposito,
              COALESCE(json_agg(
                json_build_object(
                  'id', j.id,
                  'codigo', j.codigo,
                  'capacidad_maxima', j.capacidad_maxima,
                  'ocupacion', (
                    SELECT COUNT(*)::int FROM animales an
                    WHERE an.id_jaula = j.id AND an.estado = 'activo'
                  )
                )
              ) FILTER (WHERE j.id IS NOT NULL), '[]') AS jaulas
       FROM areas a
       LEFT JOIN recintos j ON j.id_area = a.id AND j.activa = true
       WHERE a.id_granja = $1 AND a.activa = true
       GROUP BY a.id
       ORDER BY a.nombre`,
      [farmId],
    );
    return rows;
  }

  async createWithCages(params: {
    farmId: number;
    nombre: string;
    proposito: string;
    jaulaIds: number[];
  }) {
    const { farmId, nombre, proposito, jaulaIds } = params;
    const client = await this.db.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query(
        `INSERT INTO areas (id_granja, nombre, proposito)
         VALUES ($1, $2, $3) RETURNING *`,
        [farmId, nombre, proposito],
      );
      const area = rows[0];
      for (const jid of jaulaIds) {
        await client.query(
          `UPDATE recintos j SET id_area = $1
           FROM areas a WHERE j.id_area = a.id AND a.id_granja = $2 AND j.id = $3`,
          [area.id, farmId, jid],
        );
      }
      await client.query('COMMIT');
      return area;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async findById(farmId: number, id: number) {
    const { rows } = await this.db.query(
      `SELECT * FROM areas WHERE id=$1 AND id_granja=$2`,
      [id, farmId],
    );
    return rows[0] || null;
  }

  async countActiveCages(areaId: number) {
    const { rows } = await this.db.query(
      `SELECT id FROM recintos WHERE id_area=$1 AND activa=true`,
      [areaId],
    );
    return rows;
  }

  async deactivate(params: {
    farmId: number;
    id: number;
    idAreaDestino?: number;
  }) {
    const { farmId, id, idAreaDestino } = params;
    const client = await this.db.connect();
    try {
      await client.query('BEGIN');
      if (idAreaDestino) {
        const dest = await client.query(
          `SELECT id FROM areas WHERE id=$1 AND id_granja=$2 AND activa=true`,
          [idAreaDestino, farmId],
        );
        if (!dest.rows[0]) {
          await client.query('ROLLBACK');
          return { error: 'Invalid destination area' };
        }
        await client.query(`UPDATE recintos SET id_area=$1 WHERE id_area=$2`, [
          idAreaDestino,
          id,
        ]);
      }
      const { rows } = await client.query(
        `UPDATE areas SET activa=false, updated_at=NOW() WHERE id=$1 RETURNING *`,
        [id],
      );
      await client.query('COMMIT');
      return { area: rows[0] };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}
