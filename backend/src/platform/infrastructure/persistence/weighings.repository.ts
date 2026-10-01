import { WeighingsRepositoryPort } from '../../domain/ports/weighings.repository.port';
import {
  CATEGORIAS_RANGO,
  RANGOS_DEFAULT,
} from '../../domain/weighings.constants';
import { Injectable } from '@nestjs/common';
import { SharedDepsService } from '../../../shared/deps/shared-deps.service';

@Injectable()
export class WeighingsRepository extends WeighingsRepositoryPort {
  constructor(private readonly sharedDeps: SharedDepsService) { super(); }

  private get db() {
    return this.sharedDeps.db;
  }

  async getRangeRows(farmId: number) {
    const { rows } = await this.db.query(
      `SELECT categoria, min_gramos AS min, max_gramos AS max FROM peso_rangos WHERE id_granja = $1`,
      [farmId],
    );
    return rows;
  }

  async seedRanges(farmId: number) {
    for (const cat of CATEGORIAS_RANGO) {
      const r = RANGOS_DEFAULT[cat];
      await this.db.query(
        `INSERT INTO peso_rangos (id_granja, categoria, min_gramos, max_gramos)
           VALUES ($1,$2,$3,$4) ON CONFLICT (id_granja, categoria) DO NOTHING`,
        [farmId, cat, r.min, r.max],
      );
    }
  }

  async saveRanges(
    farmId: number,
    next: Record<string, { min: number; max: number }>,
    userId: number,
  ) {
    const client = await this.db.connect();
    try {
      await client.query('BEGIN');
      for (const cat of CATEGORIAS_RANGO) {
        if (!next[cat]) continue;
        await client.query(
          `INSERT INTO peso_rangos (id_granja, categoria, min_gramos, max_gramos, updated_by, updated_at)
             VALUES ($1,$2,$3,$4,$5,NOW())
             ON CONFLICT (id_granja, categoria) DO UPDATE SET
               min_gramos = EXCLUDED.min_gramos, max_gramos = EXCLUDED.max_gramos,
               updated_by = EXCLUDED.updated_by, updated_at = NOW()`,
          [farmId, cat, next[cat].min, next[cat].max, userId || null],
        );
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async findAnimal(farmId: number, animalId: number) {
    const { rows } = await this.db.query(
      `SELECT an.*, c.nombre AS categoria
         FROM animales an LEFT JOIN categorias c ON c.id = an.id_categoria
         WHERE an.id = $1 AND an.id_granja = $2`,
      [animalId, farmId],
    );
    return rows[0] || null;
  }

  async insertWeighing(
    client: { query: (...args: unknown[]) => Promise<{ rows: unknown[] }> } | null,
    data: {
      farmId: number;
      animalId: number;
      fecha: string;
      pesoNum: number;
      fuera: boolean;
      userId: number;
    },
  ) {
    const q = client || this.db;
    const { rows } = await q.query(
      `INSERT INTO pesajes (id_granja, id_animal, fecha, peso_gramos, fuera_rango, created_by)
         VALUES ($1,$2,$3::date,$4,$5,$6) RETURNING *`,
      [data.farmId, data.animalId, data.fecha, data.pesoNum, data.fuera, data.userId],
    );
    return rows[0];
  }

  async listByAnimal(animalId: number, farmId: number) {
    const { rows } = await this.db.query(
      `SELECT * FROM pesajes WHERE id_animal = $1 AND id_granja = $2
         ORDER BY fecha ASC, id ASC`,
      [animalId, farmId],
    );
    return rows;
  }

  async average(farmId: number, filters: Record<string, unknown>) {
    const params: unknown[] = [farmId];
    let sql = `
        SELECT p.fecha, AVG(p.peso_gramos)::numeric(10,2) AS average, COUNT(*)::int AS n
        FROM pesajes p JOIN animales a ON a.id = p.id_animal
        WHERE p.id_granja = $1`;
    if (filters.id_jaula) {
      params.push(Number(filters.id_jaula));
      sql += ` AND a.id_jaula = $${params.length}`;
    }
    if (filters.id_area) {
      params.push(Number(filters.id_area));
      sql += ` AND EXISTS (
          SELECT 1 FROM recintos j WHERE j.id = a.id_jaula AND j.id_area = $${params.length}
        )`;
    }
    sql += ' GROUP BY p.fecha ORDER BY p.fecha';
    const { rows } = await this.db.query(sql, params);
    return rows;
  }
}
