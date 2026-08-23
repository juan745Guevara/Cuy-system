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

module.exports = router;
