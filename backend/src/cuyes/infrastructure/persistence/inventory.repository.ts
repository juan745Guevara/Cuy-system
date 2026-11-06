import {
  InventoryRepositoryPort,
  NewInventoryCount,
} from '../../domain/ports/inventory.repository.port';
import { Injectable } from '@nestjs/common';
import { CuyesDepsService } from '../../application/cuyes-deps.service';

@Injectable()
export class InventoryRepository extends InventoryRepositoryPort {
  constructor(private readonly cuyesDeps: CuyesDepsService) { super(); }

  private get db() {
    return this.cuyesDeps.toDeps().db;
  }

  async populationAt(farmId: number, fechaHasta: string) {
    const { rows } = await this.db.query(
      `SELECT COALESCE(r.nombre, 'sin_raza') AS raza,
              COALESCE(c.nombre, 'sin_categoria') AS categoria,
              a.sexo,
              COUNT(*)::int AS cantidad
       FROM animales a
       LEFT JOIN razas r ON r.id = a.id_raza
       LEFT JOIN categorias c ON c.id = a.id_categoria
       WHERE a.id_granja = $1
         AND a.created_at::date <= $2::date
         AND (
           a.estado = 'activo'
           OR (a.fecha_baja IS NOT NULL AND a.fecha_baja > $2::date)
         )
       GROUP BY r.nombre, c.nombre, a.sexo
       ORDER BY r.nombre, c.nombre, a.sexo`,
      [farmId, fechaHasta],
    );
    return rows;
  }

  async activeDetail(farmId: number) {
    const { rows } = await this.db.query(
      `SELECT a.id, a.codigo, a.sexo, a.estado,
              r.nombre AS raza, c.nombre AS categoria, j.codigo AS jaula
       FROM animales a
       LEFT JOIN razas r ON r.id = a.id_raza
       LEFT JOIN categorias c ON c.id = a.id_categoria
       LEFT JOIN recintos j ON j.id = a.id_jaula
       WHERE a.id_granja = $1 AND a.estado = 'activo'
       ORDER BY r.nombre, c.nombre, a.codigo
       LIMIT 500`,
      [farmId],
    );
    return rows;
  }

  async birthsInPeriod(farmId: number, ini: string, fin: string) {
    const { rows } = await this.db.query(
      `SELECT COALESCE(SUM(vivos_m + vivos_h),0)::int AS nacimientos,
              COALESCE(SUM(vivos_m),0)::int AS nac_m,
              COALESCE(SUM(vivos_h),0)::int AS nac_h
       FROM partos
       WHERE id_granja = $1 AND fecha_parto BETWEEN $2::date AND $3::date`,
      [farmId, ini, fin],
    );
    return rows[0];
  }

  async mortalityInPeriod(farmId: number, ini: string, fin: string) {
    const { rows } = await this.db.query(
      `SELECT COALESCE(SUM(cantidad),0)::int AS mortalidad,
              COALESCE(categoria,'sin_categoria') AS categoria
       FROM mortalidad
       WHERE id_granja = $1 AND fecha BETWEEN $2::date AND $3::date
       GROUP BY COALESCE(categoria,'sin_categoria')`,
      [farmId, ini, fin],
    );
    return rows;
  }

  async salesInPeriod(farmId: number, ini: string, fin: string) {
    const { rows } = await this.db.query(
      `SELECT COALESCE(SUM(cantidad),0)::int AS ventas,
              COALESCE(categoria,'sin_categoria') AS categoria
       FROM ventas
       WHERE id_granja = $1 AND fecha BETWEEN $2::date AND $3::date
       GROUP BY COALESCE(categoria,'sin_categoria')`,
      [farmId, ini, fin],
    );
    return rows;
  }

  async transfersInPeriod(farmId: number, ini: string, fin: string) {
    const { rows } = await this.db.query(
      `SELECT
         COALESCE(SUM(CASE WHEN tipo = 'transfer' AND id_granja_destino = $1 THEN 1 ELSE 0 END),0)::int AS tin,
         COALESCE(SUM(CASE WHEN tipo = 'transfer' AND id_granja_origen = $1 THEN 1 ELSE 0 END),0)::int AS tout
       FROM movimientos
       WHERE tipo = 'transfer'
         AND fecha BETWEEN $2::date AND $3::date
         AND (id_granja_origen = $1 OR id_granja_destino = $1)`,
      [farmId, ini, fin],
    );
    return rows[0];
  }

  async byArea(farmId: number) {
    const { rows } = await this.db.query(
      `SELECT a.id AS id_area, a.nombre AS area, a.proposito,
              j.id AS id_jaula, j.codigo AS jaula, j.capacidad_maxima,
              COUNT(an.id) FILTER (WHERE an.estado = 'activo')::int AS ocupacion,
              COUNT(an.id) FILTER (WHERE an.estado = 'activo' AND an.sexo = 'H')::int AS hembras,
              COUNT(an.id) FILTER (WHERE an.estado = 'activo' AND an.sexo = 'M')::int AS machos
       FROM areas a
       LEFT JOIN recintos j ON j.id_area = a.id AND j.activa = true
       LEFT JOIN animales an ON an.id_jaula = j.id
       WHERE a.id_granja = $1 AND a.activa = true
       GROUP BY a.id, a.nombre, a.proposito, j.id, j.codigo, j.capacidad_maxima
       ORDER BY a.nombre, j.codigo`,
      [farmId],
    );
    return rows;
  }

  async byCategoryArea(farmId: number) {
    const { rows } = await this.db.query(
      `SELECT COALESCE(c.nombre, 'sin_categoria') AS categoria,
              ar.nombre AS area, a.sexo, COUNT(*)::int AS cantidad
       FROM animales a
       LEFT JOIN categorias c ON c.id = a.id_categoria
       LEFT JOIN recintos j ON j.id = a.id_jaula
       LEFT JOIN areas ar ON ar.id = j.id_area
       WHERE a.id_granja = $1 AND a.estado = 'activo'
       GROUP BY c.nombre, ar.nombre, a.sexo
       ORDER BY ar.nombre, c.nombre, a.sexo`,
      [farmId],
    );
    return rows;
  }

  async consolidatedFarms(farmIds: number[], year: number, month: number) {
    const { rows } = await this.db.query(
      `SELECT g.id, g.nombre, e.nombre AS especie,
              (SELECT COUNT(*)::int FROM animales a WHERE a.id_granja = g.id AND a.estado = 'activo') AS poblacion,
              (SELECT COALESCE(SUM(vivos_m+vivos_h),0)::int FROM partos p
                WHERE p.id_granja = g.id
                  AND EXTRACT(YEAR FROM p.fecha_parto) = $2
                  AND EXTRACT(MONTH FROM p.fecha_parto) = $3) AS nacimientos,
              (SELECT COALESCE(SUM(cantidad),0)::int FROM mortalidad m
                WHERE m.id_granja = g.id
                  AND EXTRACT(YEAR FROM m.fecha) = $2
                  AND EXTRACT(MONTH FROM m.fecha) = $3) AS mortalidad,
              (SELECT COALESCE(SUM(cantidad),0)::int FROM ventas v
                WHERE v.id_granja = g.id
                  AND EXTRACT(YEAR FROM v.fecha) = $2
                  AND EXTRACT(MONTH FROM v.fecha) = $3) AS ventas
       FROM granjas g
       JOIN especies e ON e.id = g.id_especie
       WHERE g.id = ANY($1::int[]) AND g.activa = true
       ORDER BY e.nombre, g.nombre`,
      [farmIds, year, month],
    );
    return rows;
  }

  /* ---------------- Conteo físico por jaula (CU-06) ---------------- */

  async findActiveCage(farmId: number, jaulaId: number) {
    const { rows } = await this.db.query(
      `SELECT id, codigo FROM recintos WHERE id = $1 AND id_granja = $2 AND activa = true`,
      [jaulaId, farmId],
    );
    return rows[0] || null;
  }

  async countRegisteredBySex(farmId: number, jaulaId: number) {
    const { rows } = await this.db.query(
      `SELECT COUNT(*) FILTER (WHERE sexo = 'M')::int AS machos,
              COUNT(*) FILTER (WHERE sexo = 'H')::int AS hembras
         FROM animales
        WHERE id_granja = $1 AND id_jaula = $2 AND estado = 'activo'`,
      [farmId, jaulaId],
    );
    return { machos: rows[0]?.machos ?? 0, hembras: rows[0]?.hembras ?? 0 };
  }

  async insertCount(d: NewInventoryCount) {
    const [p1, p2, p3] = d.pesos;
    const { rows } = await this.db.query(
      `INSERT INTO conteos_inventario
         (id_granja, id_jaula, fecha, machos_contados, hembras_contadas,
          machos_sistema, hembras_sistema, peso_muestra1, peso_muestra2, peso_muestra3,
          observaciones, created_by)
       VALUES ($1, $2, $3::date, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        d.farmId, d.jaulaId, d.fecha, d.machosContados, d.hembrasContadas,
        d.machosSistema, d.hembrasSistema, p1, p2, p3, d.observaciones, d.userId,
      ],
    );
    return rows[0];
  }

  /** Lista conteos con la diferencia y el peso promedio calculados (no se almacenan). */
  async listCounts(farmId: number, filters: { desde?: string; hasta?: string; jaulaId?: number }) {
    const params: unknown[] = [farmId];
    let sql = `
      SELECT c.*, j.codigo AS jaula, a.nombre AS area, u.nombre AS registrado_por,
             (c.machos_contados + c.hembras_contadas) AS total_contado,
             (c.machos_sistema + c.hembras_sistema) AS total_sistema,
             (c.machos_contados + c.hembras_contadas)
               - (c.machos_sistema + c.hembras_sistema) AS diferencia,
             ROUND(
               (COALESCE(c.peso_muestra1, 0) + COALESCE(c.peso_muestra2, 0) + COALESCE(c.peso_muestra3, 0))
               / NULLIF((c.peso_muestra1 IS NOT NULL)::int + (c.peso_muestra2 IS NOT NULL)::int
                        + (c.peso_muestra3 IS NOT NULL)::int, 0), 2) AS peso_promedio
        FROM conteos_inventario c
        JOIN recintos j ON j.id = c.id_jaula
        LEFT JOIN areas a ON a.id = j.id_area
        LEFT JOIN usuarios u ON u.id = c.created_by
       WHERE c.id_granja = $1`;
    if (filters.desde) {
      params.push(filters.desde);
      sql += ` AND c.fecha >= $${params.length}::date`;
    }
    if (filters.hasta) {
      params.push(filters.hasta);
      sql += ` AND c.fecha <= $${params.length}::date`;
    }
    if (filters.jaulaId) {
      params.push(filters.jaulaId);
      sql += ` AND c.id_jaula = $${params.length}`;
    }
    sql += ' ORDER BY c.fecha DESC, c.id DESC LIMIT 200';
    const { rows } = await this.db.query(sql, params);
    return rows;
  }
}
