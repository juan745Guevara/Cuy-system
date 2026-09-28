import { MortalityRepositoryPort } from '../../domain/ports/mortality.repository.port';
import { Injectable } from '@nestjs/common';
import { CuyesDepsService } from '../../application/cuyes-deps.service';

@Injectable()
export class MortalityRepository extends MortalityRepositoryPort {
  constructor(private readonly cuyesDeps: CuyesDepsService) { super(); }

  private get db() {
    return this.cuyesDeps.toDeps().db;
  }

  async countPoblacion(farmId: number, categoria?: string) {
    if (!categoria) {
      const { rows } = await this.db.query(
        `SELECT COUNT(*)::int AS n FROM animales WHERE id_granja=$1 AND estado='activo'`,
        [farmId],
      );
      return rows[0].n as number;
    }
    const { rows } = await this.db.query(
      `SELECT COUNT(*)::int AS n FROM animales a
       LEFT JOIN categorias c ON c.id = a.id_categoria
       WHERE a.id_granja=$1 AND a.estado='activo'
         AND LOWER(COALESCE(c.nombre,'')) = LOWER($2)`,
      [farmId, categoria],
    );
    return rows[0].n as number;
  }

  async create(params: {
    farmId: number;
    userId: number;
    data: Record<string, unknown>;
  }) {
    const { farmId, userId, data } = params;
    const client = await this.db.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query(
        `INSERT INTO mortalidad
          (id_granja, id_animal, fecha, clasificacion, categoria, cantidad, causa, id_jaula, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
        [
          farmId,
          data.id_animal || null,
          data.fecha,
          data.clasificacion || null,
          data.categoria || null,
          data.cantidad,
          data.causa || null,
          data.id_jaula || null,
          userId,
        ],
      );
      if (data.id_animal) {
        await client.query(
          `UPDATE animales SET estado = 'baja_muerte', fecha_baja = $1,
             motivo_baja = COALESCE($2, 'Mortalidad'), updated_at = NOW()
           WHERE id = $3 AND id_granja = $4`,
          [data.fecha, data.causa || null, data.id_animal, farmId],
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

  async list(farmId: number) {
    const { rows } = await this.db.query(
      `SELECT * FROM mortalidad WHERE id_granja = $1 ORDER BY fecha DESC`,
      [farmId],
    );
    return rows;
  }
}
