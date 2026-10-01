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
       WHERE a.id_granja = $1 AND a.activa = true
       ORDER BY a.nombre`,
      [farmId],
    );
    return rows;
  }

  async findByName(farmId: number, nombre: string) {
    const { rows } = await this.db.query(
      `SELECT * FROM areas WHERE id_granja = $1 AND nombre = $2`,
      [farmId, nombre],
    );
    return rows[0] || null;
  }

  /** Jaulas de la lista que ya pertenecen a otra área activa. */
  async findTakenCages(farmId: number, areaId: number | null, jaulaIds: number[]) {
    if (!jaulaIds.length) return [];
    const { rows } = await this.db.query(
      `SELECT j.id, j.codigo, a.nombre AS area
         FROM recintos j
         JOIN areas a ON a.id = j.id_area AND a.activa = true
        WHERE j.id_granja = $1 AND j.id = ANY($2::int[])
          AND ($3::int IS NULL OR j.id_area <> $3::int)`,
      [farmId, jaulaIds, areaId],
    );
    return rows;
  }

  /** Deja en el área exactamente `jaulaIds`: libera las que no estén y toma las libres de la lista. */
  private async setCages(client: any, areaId: number, farmId: number, jaulaIds: number[]) {
    await client.query(
      `UPDATE recintos SET id_area = NULL, updated_at = NOW()
        WHERE id_area = $1 AND NOT (id = ANY($2::int[]))`,
      [areaId, jaulaIds],
    );
    if (!jaulaIds.length) return;
    await client.query(
      `UPDATE recintos j SET id_area = $1, updated_at = NOW()
        WHERE j.id_granja = $2 AND j.id = ANY($3::int[]) AND j.activa = true
          AND (j.id_area IS NULL OR j.id_area = $1
               OR EXISTS (SELECT 1 FROM areas a WHERE a.id = j.id_area AND a.activa = false))`,
      [areaId, farmId, jaulaIds],
    );
  }

  async updateWithCages(params: {
    farmId: number;
    id: number;
    nombre: string;
    proposito: string;
    activa?: boolean;
    jaulaIds: number[];
  }) {
    const { farmId, id, nombre, proposito, activa, jaulaIds } = params;
    const client = await this.db.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query(
        `UPDATE areas SET nombre = $1, proposito = $2, activa = COALESCE($3, activa), updated_at = NOW()
         WHERE id = $4 AND id_granja = $5 RETURNING *`,
        [nombre, proposito, activa ?? null, id, farmId],
      );
      await this.setCages(client, id, farmId, jaulaIds);
      await client.query('COMMIT');
      return rows[0] || null;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
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
      await this.setCages(client, area.id, farmId, jaulaIds);
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

  async deactivate(params: { farmId: number; id: number }) {
    const { farmId, id } = params;
    const client = await this.db.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        `UPDATE recintos SET id_area = NULL, updated_at = NOW() WHERE id_area = $1`,
        [id],
      );
      const { rows } = await client.query(
        `UPDATE areas SET activa=false, updated_at=NOW() WHERE id=$1 AND id_granja=$2 RETURNING *`,
        [id, farmId],
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
