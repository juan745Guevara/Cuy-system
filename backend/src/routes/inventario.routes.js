const express = require('express');
const { pool } = require('../config/database');
const { asyncHandler } = require('../utils/helpers');
const { authRequired, loadUserFarms, requireFarmAccess } = require('../middleware/auth');

const router = express.Router();
router.use(authRequired, loadUserFarms, requireFarmAccess);

// NUC-28 población actual
router.get(
  '/poblacion',
  asyncHandler(async (req, res) => {
    const { rows } = await pool.query(
      `SELECT COALESCE(c.nombre, 'sin_categoria') AS categoria,
              a.sexo,
              COUNT(*)::int AS cantidad
       FROM animales a
       LEFT JOIN categorias c ON c.id = a.id_categoria
       WHERE a.id_granja = $1 AND a.estado = 'activo'
       GROUP BY c.nombre, a.sexo
       ORDER BY c.nombre, a.sexo`,
      [req.granjaId]
    );
    const total = rows.reduce((s, r) => s + r.cantidad, 0);
    res.json({ total, por_categoria: rows });
  })
);

// NUC-29 resumen mensual
router.get(
  '/resumen-mensual',
  asyncHandler(async (req, res) => {
    const year = Number(req.query.anio) || new Date().getFullYear();
    const month = Number(req.query.mes) || new Date().getMonth() + 1;

    const nac = await pool.query(
      `SELECT COALESCE(SUM(vivos_m + vivos_h),0)::int AS nacimientos
       FROM partos
       WHERE id_granja = $1
         AND EXTRACT(YEAR FROM fecha_parto) = $2
         AND EXTRACT(MONTH FROM fecha_parto) = $3`,
      [req.granjaId, year, month]
    );
    const mort = await pool.query(
      `SELECT COALESCE(SUM(cantidad),0)::int AS mortalidad
       FROM mortalidad
       WHERE id_granja = $1
         AND EXTRACT(YEAR FROM fecha) = $2
         AND EXTRACT(MONTH FROM fecha) = $3`,
      [req.granjaId, year, month]
    );
    const vent = await pool.query(
      `SELECT COALESCE(SUM(cantidad),0)::int AS ventas
       FROM ventas
       WHERE id_granja = $1
         AND EXTRACT(YEAR FROM fecha) = $2
         AND EXTRACT(MONTH FROM fecha) = $3`,
      [req.granjaId, year, month]
    );
    const pob = await pool.query(
      `SELECT COUNT(*)::int AS poblacion_actual FROM animales
       WHERE id_granja = $1 AND estado = 'activo'`,
      [req.granjaId]
    );

    res.json({
      anio: year,
      mes: month,
      nacimientos: nac.rows[0].nacimientos,
      mortalidad: mort.rows[0].mortalidad,
      ventas: vent.rows[0].ventas,
      poblacion_actual: pob.rows[0].poblacion_actual,
    });
  })
);

// NUC-31 población por área / jaula
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
          hembras: r.hembras,
          machos: r.machos,
        });
        byArea[r.id_area].total += r.ocupacion;
      }
    }
    res.json(Object.values(byArea));
  })
);

// NUC-30 / NUC-32 consolidado multi-granja
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

    const total = {
      poblacion: rows.reduce((s, r) => s + r.poblacion, 0),
      nacimientos: rows.reduce((s, r) => s + r.nacimientos, 0),
      mortalidad: rows.reduce((s, r) => s + r.mortalidad, 0),
      ventas: rows.reduce((s, r) => s + r.ventas, 0),
    };

    res.json({
      anio: year,
      mes: month,
      granjas: rows,
      por_especie: Object.values(porEspecie),
      total,
    });
  })
);

module.exports = router;
