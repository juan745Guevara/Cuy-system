import { SalesRepositoryPort } from '../../domain/ports/sales.repository.port';
import { Injectable } from '@nestjs/common';
import { CuyesDepsService } from '../../application/cuyes-deps.service';

@Injectable()
export class SalesRepository extends SalesRepositoryPort {
  constructor(private readonly cuyesDeps: CuyesDepsService) { super(); }

  private get db() {
    return this.cuyesDeps.toDeps().db;
  }

  async countPopulation(farmId: number, categoria?: string) {
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

  /**
   * CU-03 (FA-3.3): un comprobante de la caja UNAS solo respalda una operación de venta.
   * Bloquea el comprobante durante la transacción (evita que dos ventas simultáneas lo usen)
   * y devuelve la venta previa no anulada que ya lo utilizó, si existe.
   * Los comprobantes son únicos en toda la institución, por eso no se filtra por granja.
   */
  private async comprobanteEnUso(
    client: { query: (sql: string, params?: unknown[]) => Promise<{ rows: any[] }> },
    c: { tipo: string; serie: string; numero: string },
  ) {
    await client.query(`SELECT pg_advisory_xact_lock(hashtext($1))`, [
      `venta|${c.tipo}|${c.serie}|${c.numero}`.toUpperCase(),
    ]);
    const { rows } = await client.query(
      `SELECT v.id, v.fecha, g.nombre AS granja
         FROM ventas v JOIN granjas g ON g.id = v.id_granja
        WHERE UPPER(TRIM(v.tipo_comprobante)) = UPPER($1)
          AND UPPER(TRIM(v.serie)) = UPPER($2)
          AND UPPER(TRIM(v.numero)) = UPPER($3)
          AND v.anulado IS NOT TRUE
        LIMIT 1`,
      [c.tipo, c.serie, c.numero],
    );
    return rows[0] || null;
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
      const previa = await this.comprobanteEnUso(client, {
        tipo: String(data.tipo_comprobante),
        serie: String(data.serie),
        numero: String(data.numero),
      });
      if (previa) {
        await client.query('ROLLBACK');
        return { error: 'COMPROBANTE_DUPLICADO', venta_previa: previa };
      }
      const { rows } = await client.query(
        `INSERT INTO ventas
          (id_granja, id_animal, fecha, clasificacion, categoria, cantidad, comprador, precio,
           tipo_comprobante, serie, numero, observaciones, created_by)
         VALUES ($1,$2,$3::date,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
        [
          farmId,
          data.id_animal || null,
          data.fecha,
          data.clasificacion || null,
          data.categoria || null,
          data.cantidad,
          data.comprador || null,
          data.precio || null,
          data.tipo_comprobante || null,
          data.serie || null,
          data.numero || null,
          data.observaciones || null,
          userId,
        ],
      );
      if (data.id_animal) {
        // CU-03 (FA-3.4): solo se vende un animal que sigue activo; si otro usuario
        // lo dio de baja o lo vendió mientras tanto, la venta completa se revierte.
        const baja = await client.query(
          `UPDATE animales SET estado = 'baja_venta', fecha_baja = $1::date,
             motivo_baja = 'Venta', updated_at = NOW()
           WHERE id = $2 AND id_granja = $3 AND estado = 'activo'
           RETURNING id`,
          [data.fecha, data.id_animal, farmId],
        );
        if (!baja.rows.length) {
          await client.query('ROLLBACK');
          return { error: 'ANIMAL_NO_DISPONIBLE' };
        }
      }
      await client.query('COMMIT');
      return { venta: rows[0] };
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
    comprobante: { tipo: string; serie: string; numero: string };
  }) {
    const { farmId, userId, fecha, comprador, precio, ids, comprobante } = params;
    const client = await this.db.connect();
    try {
      await client.query('BEGIN');
      const previa = await this.comprobanteEnUso(client, comprobante);
      if (previa) {
        await client.query('ROLLBACK');
        return { error: 'COMPROBANTE_DUPLICADO', venta_previa: previa };
      }
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
            (id_granja, id_animal, fecha, clasificacion, cantidad, comprador, precio,
             tipo_comprobante, serie, numero, created_by)
           VALUES ($1,$2,$3::date,'descarte',1,$4,$5,$6,$7,$8,$9) RETURNING *`,
          [
            farmId, a.id, fecha, comprador || null, precio || null,
            comprobante.tipo, comprobante.serie, comprobante.numero, userId,
          ],
        );
        await client.query(
          `UPDATE animales SET estado='baja_venta', fecha_baja=$2::date,
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
