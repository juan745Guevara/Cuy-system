const express = require('express');
const { pool } = require('../config/database');
const { asyncHandler } = require('../utils/helpers');
const { authRequired, loadUserFarms, requireFarmAccess } = require('../middleware/auth');

const router = express.Router();
router.use(authRequired, loadUserFarms, requireFarmAccess);

function endOfMonth(year, month) {
  return new Date(year, month, 0).toISOString().slice(0, 10);
}
function startOfMonth(year, month) {
  return `${year}-${String(month).padStart(2, '0')}-01`;
}

async function poblacionAt(granjaId, fechaHasta) {
  const { rows } = await pool.query(
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
    [granjaId, fechaHasta]
  );
  return rows;
}

// Población resumen
router.get(
  '/poblacion',
  asyncHandler(async (req, res) => {
    const fecha = req.query.fecha || new Date().toISOString().slice(0, 10);
    const rows = await poblacionAt(req.granjaId, fecha);

    const matriz = {};
    for (const r of rows) {
      if (!matriz[r.raza]) matriz[r.raza] = {};
      const key = r.categoria;
      if (!matriz[r.raza][key]) matriz[r.raza][key] = { H: 0, M: 0, total: 0 };
      matriz[r.raza][key][r.sexo] = r.cantidad;
      matriz[r.raza][key].total += r.cantidad;
    }

    const detalle = await pool.query(
      `SELECT a.id, a.codigo, a.sexo, a.estado,
              r.nombre AS raza, c.nombre AS categoria, j.codigo AS jaula
       FROM animales a
       LEFT JOIN razas r ON r.id = a.id_raza
       LEFT JOIN categorias c ON c.id = a.id_categoria
       LEFT JOIN jaulas j ON j.id = a.id_jaula
       WHERE a.id_granja = $1 AND a.estado = 'activo'
       ORDER BY r.nombre, c.nombre, a.codigo
       LIMIT 500`,
      [req.granjaId]
    );

    const total = rows.reduce((s, r) => s + r.cantidad, 0);
    res.json({
      fecha,
      total,
      por_categoria: rows,
      por_raza: Object.entries(matriz).map(([raza, cats]) => ({
        raza,
        categorias: cats,
        total: Object.values(cats).reduce((s, c) => s + c.total, 0),
      })),
      matriz,
      detalle: detalle.rows,
    });
  })
);

// Población por área / jaula
router.get(
  '/resumen-mensual',
  asyncHandler(async (req, res) => {
    const year = Number(req.query.anio) || new Date().getFullYear();
    const month = Number(req.query.mes) || new Date().getMonth() + 1;
    const ini = startOfMonth(year, month);
    const fin = endOfMonth(year, month);
    const prevFin =
      month === 1
        ? endOfMonth(year - 1, 12)
        : endOfMonth(year, month - 1);

    const pobIniRows = await poblacionAt(req.granjaId, prevFin);
    const pobFinRows = await poblacionAt(req.granjaId, fin);
    const sum = (rows) => rows.reduce((s, r) => s + r.cantidad, 0);

    const nac = await pool.query(
      `SELECT COALESCE(SUM(vivos_m + vivos_h),0)::int AS nacimientos,
              COALESCE(SUM(vivos_m),0)::int AS nac_m,
              COALESCE(SUM(vivos_h),0)::int AS nac_h
       FROM partos
       WHERE id_granja = $1 AND fecha_parto BETWEEN $2 AND $3`,
      [req.granjaId, ini, fin]
    );
    const mort = await pool.query(
      `SELECT COALESCE(SUM(cantidad),0)::int AS mortalidad,
              COALESCE(categoria,'sin_categoria') AS categoria
       FROM mortalidad
       WHERE id_granja = $1 AND fecha BETWEEN $2 AND $3
       GROUP BY COALESCE(categoria,'sin_categoria')`,
      [req.granjaId, ini, fin]
    );
    const vent = await pool.query(
      `SELECT COALESCE(SUM(cantidad),0)::int AS ventas,
              COALESCE(categoria,'sin_categoria') AS categoria
       FROM ventas
       WHERE id_granja = $1 AND fecha BETWEEN $2 AND $3
       GROUP BY COALESCE(categoria,'sin_categoria')`,
      [req.granjaId, ini, fin]
    );
    const mortTotal = mort.rows.reduce((s, r) => s + Number(r.mortalidad), 0);
    const ventTotal = vent.rows.reduce((s, r) => s + Number(r.ventas), 0);

    let transferencias_in = 0;
    let transferencias_out = 0;
    try {
      const tr = await pool.query(
        `SELECT
           COALESCE(SUM(CASE WHEN tipo = 'transferencia' AND id_granja_destino = $1 THEN 1 ELSE 0 END),0)::int AS tin,
           COALESCE(SUM(CASE WHEN tipo = 'transferencia' AND id_granja_origen = $1 THEN 1 ELSE 0 END),0)::int AS tout
         FROM movimientos
         WHERE tipo = 'transferencia'
           AND fecha BETWEEN $2 AND $3
           AND (id_granja_origen = $1 OR id_granja_destino = $1)`,
        [req.granjaId, ini, fin]
      );
      transferencias_in = tr.rows[0]?.tin || 0;
      transferencias_out = tr.rows[0]?.tout || 0;
    } catch {
      /* tabla movimientos puede no existir en entornos viejos */
    }

    const desglose = {};
    for (const r of pobFinRows) {
      const k = r.categoria;
      if (!desglose[k]) desglose[k] = { categoria: k, H: 0, M: 0, total: 0 };
      desglose[k][r.sexo] += r.cantidad;
      desglose[k].total += r.cantidad;
    }

    const poblacion_inicial = sum(pobIniRows);
    const poblacion_final = sum(pobFinRows);

    const continuidadEsperada =
      poblacion_inicial +
      Number(nac.rows[0].nacimientos) -
      mortTotal -
      ventTotal +
      (transferencias_in - transferencias_out);
    const continuidad_ok =
      continuidadEsperada === poblacion_final &&
      Number(poblacion_inicial) >= 0;

    res.json({
      anio: year,
      mes: month,
      poblacion_inicial,
      nacimientos: nac.rows[0].nacimientos,
      nacimientos_m: nac.rows[0].nac_m,
      nacimientos_h: nac.rows[0].nac_h,
      mortalidad: mortTotal,
      mortalidad_por_categoria: mort.rows,
      ventas: ventTotal,
      ventas_por_categoria: vent.rows,
      transferencias_in,
      transferencias_out,
      poblacion_final,
      poblacion_actual: poblacion_final,
      desglose_categorias: Object.values(desglose),
      continuidad_ok,
      continuidad_esperada: continuidadEsperada,
      continuidad_detalle: {
        poblacion_inicial,
        nacimientos: Number(nac.rows[0].nacimientos),
        mortalidad: mortTotal,
        ventas: ventTotal,
        transferencias_in,
        transferencias_out,
      },
    });
  })
);

router.get(
  '/por-area',
  asyncHandler(async (req, res) => {
    const { rows } = await pool.query(
      `SELECT a.id AS id_area, a.nombre AS area, a.proposito,
              j.id AS id_jaula, j.codigo AS jaula, j.capacidad_maxima,
              COUNT(an.id) FILTER (WHERE an.estado = 'activo')::int AS ocupacion,
              COUNT(an.id) FILTER (WHERE an.estado = 'activo' AND an.sexo = 'H')::int AS hembras,
              COUNT(an.id) FILTER (WHERE an.estado = 'activo' AND an.sexo = 'M')::int AS machos
       FROM areas a
       LEFT JOIN jaulas j ON j.id_area = a.id AND j.activa = true
       LEFT JOIN animales an ON an.id_jaula = j.id
       WHERE a.id_granja = $1 AND a.activa = true
       GROUP BY a.id, a.nombre, a.proposito, j.id, j.codigo, j.capacidad_maxima
       ORDER BY a.nombre, j.codigo`,
      [req.granjaId]
    );
    const byArea = {};
    for (const r of rows) {
      if (!byArea[r.id_area]) {
        byArea[r.id_area] = {
          id: r.id_area,
          nombre: r.area,
          proposito: r.proposito,
          total: 0,
          jaulas: [],
        };
      }
      if (r.id_jaula) {
        byArea[r.id_area].jaulas.push({
          id: r.id_jaula,
          codigo: r.jaula,
          capacidad_maxima: r.capacidad_maxima,
          ocupacion: r.ocupacion,
          vacia: r.ocupacion === 0,
          hembras: r.hembras,
          machos: r.machos,
        });
        byArea[r.id_area].total += r.ocupacion;
      }
    }
    res.json(Object.values(byArea));
  })
);

router.get(
  '/por-categoria-area',
  asyncHandler(async (req, res) => {
    const { rows } = await pool.query(
      `SELECT COALESCE(c.nombre, 'sin_categoria') AS categoria,
              ar.nombre AS area, a.sexo, COUNT(*)::int AS cantidad
       FROM animales a
       LEFT JOIN categorias c ON c.id = a.id_categoria
       LEFT JOIN jaulas j ON j.id = a.id_jaula
       LEFT JOIN areas ar ON ar.id = j.id_area
       WHERE a.id_granja = $1 AND a.estado = 'activo'
       GROUP BY c.nombre, ar.nombre, a.sexo
       ORDER BY ar.nombre, c.nombre, a.sexo`,
      [req.granjaId]
    );
    res.json(rows);
  })
);

router.get(
  '/consolidado',
  asyncHandler(async (req, res) => {
    const year = Number(req.query.anio) || new Date().getFullYear();
    const month = Number(req.query.mes) || new Date().getMonth() + 1;
    const farmIds = (req.userFarms || []).map((g) => g.id);
    if (!farmIds.length) return res.json({ granjas: [], por_especie: [], total: null });

    const { rows } = await pool.query(
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
      [farmIds, year, month]
    );

    const porEspecie = {};
    for (const r of rows) {
      if (!porEspecie[r.especie]) {
        porEspecie[r.especie] = {
          especie: r.especie,
          poblacion: 0,
          nacimientos: 0,
          mortalidad: 0,
          ventas: 0,
        };
      }
      porEspecie[r.especie].poblacion += r.poblacion;
      porEspecie[r.especie].nacimientos += r.nacimientos;
      porEspecie[r.especie].mortalidad += r.mortalidad;
      porEspecie[r.especie].ventas += r.ventas;
    }

    res.json({
      anio: year,
      mes: month,
      granjas: rows,
      por_especie: Object.values(porEspecie),
      total: {
        poblacion: rows.reduce((s, r) => s + r.poblacion, 0),
        nacimientos: rows.reduce((s, r) => s + r.nacimientos, 0),
        mortalidad: rows.reduce((s, r) => s + r.mortalidad, 0),
        ventas: rows.reduce((s, r) => s + r.ventas, 0),
      },
    });
  })
);

module.exports = router;
