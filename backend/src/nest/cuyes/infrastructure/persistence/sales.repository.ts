import { SalesRepositoryPort } from '../../domain/ports/sales.repository.port';
import { Injectable } from '@nestjs/common';
import { CuyesDepsService } from '../../application/cuyes-deps.service';

@Injectable()
export class SalesRepository extends SalesRepositoryPort {
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
        `INSERT INTO ventas
          (id_granja, id_animal, fecha, clasificacion, categoria, cantidad, comprador, precio, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
        [
          farmId,
          data.id_animal || null,
          data.fecha,
          data.clasificacion || null,
          data.categoria || null,
          data.cantidad,
          data.comprador || null,
          data.precio || null,
          userId,
        ],
      );
      if (data.id_animal) {
        await client.query(
          `UPDATE animales SET estado = 'baja_venta', fecha_baja = $1,
             motivo_baja = 'Venta', updated_at = NOW()
           WHERE id = $2 AND id_granja = $3`,
          [data.fecha, data.id_animal, farmId],
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

  async listDiscards(farmId: number) {
    const { rows } = await this.db.query(
      `SELECT c.nombre AS categoria,
              COUNT(*)::int AS cantidad,
              COALESCE(json_agg(an.id ORDER BY an.codigo), '[]') AS id_animales
       FROM animales an
       LEFT JOIN categorias c ON c.id = an.id_categoria
       WHERE an.id_granja = $1 AND an.estado = 'descarte'
       GROUP BY c.nombre
       ORDER BY c.nombre`,
      [farmId],
    );
    return rows;
  }

  async sellDiscards(params: {
    farmId: number;
    userId: number;
    fecha: string;
    comprador?: string;
    precio?: number;
    ids: number[];
  }) {
    const { farmId, userId, fecha, comprador, precio, ids } = params;
    const client = await this.db.connect();
    try {
      await client.query('BEGIN');
      const { rows: animales } = await client.query(
        `SELECT id, codigo, estado FROM animales
         WHERE id_granja = $1 AND id = ANY($2::int[])`,
        [farmId, ids],
      );
      const noDescarte = (animales as any[]).filter(
        (a) => a.estado !== 'descarte',
      );
      if (noDescarte.length) {
        await client.query('ROLLBACK');
        return {
          error: 'Some animals are not marked as discards',
          animales: noDescarte.map((a) => a.codigo),
        };
      }
      const creados: unknown[] = [];
      for (const a of animales as any[]) {
        const { rows } = await client.query(
          `INSERT INTO ventas
            (id_granja, id_animal, fecha, clasificacion, cantidad, comprador, precio, created_by)
           VALUES ($1,$2,$3,'descarte',1,$4,$5,$6) RETURNING *`,
          [farmId, a.id, fecha, comprador || null, precio || null, userId],
        );
        await client.query(
          `UPDATE animales SET estado='baja_venta', fecha_baja=$2,
               motivo_baja='Venta de descarte agrupado', updated_at=NOW()
           WHERE id=$1`,
          [a.id, fecha],
        );
        creados.push(rows[0]);
      }
      await client.query('COMMIT');
      return { ventas: creados };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async list(farmId: number) {
    const { rows } = await this.db.query(
      `SELECT * FROM ventas WHERE id_granja = $1 ORDER BY fecha DESC`,
      [farmId],
    );
    return rows;
  }
}
