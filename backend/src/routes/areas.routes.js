const express = require('express');
const { pool } = require('../config/database');
const { asyncHandler } = require('../utils/helpers');
const {
  authRequired,
  loadUserFarms,
  requireFarmAccess,
  requireRoles,
} = require('../middleware/auth');

const router = express.Router();

router.use(authRequired, loadUserFarms, requireFarmAccess);

// NUC-16 + CUY-04
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { rows } = await pool.query(
      `SELECT a.*,
              (SELECT COUNT(*)::int FROM jaulas j WHERE j.id_area = a.id AND j.activa) AS jaulas,
              (SELECT COUNT(*)::int FROM animales an
                 JOIN jaulas j ON j.id = an.id_jaula
                WHERE j.id_area = a.id AND an.estado = 'activo') AS animales
       FROM areas a
       WHERE a.id_granja = $1
       ORDER BY a.nombre`,
      [req.granjaId]
    );
    res.json(rows);
  })
);

// NUC-17 — vista por áreas
router.get(
  '/resumen',
  asyncHandler(async (req, res) => {
    const { rows } = await pool.query(
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
       LEFT JOIN jaulas j ON j.id_area = a.id AND j.activa = true
       WHERE a.id_granja = $1 AND a.activa = true
       GROUP BY a.id
       ORDER BY a.nombre`,
      [req.granjaId]
    );
    res.json(rows);
  })
);

router.post(
  '/',
  requireRoles('superadmin', 'admin', 'encargado'),
  asyncHandler(async (req, res) => {
    const { nombre, proposito } = req.body || {};
    if (!nombre || !proposito) {
      return res.status(400).json({ error: 'nombre y proposito son obligatorios' });
    }
    try {
      const { rows } = await pool.query(
        `INSERT INTO areas (id_granja, nombre, proposito)
         VALUES ($1, $2, $3) RETURNING *`,
        [req.granjaId, nombre, proposito]
      );
      res.status(201).json(rows[0]);
    } catch (err) {
      if (err.code === '23505') {
        return res.status(409).json({ error: 'Ya existe un área con ese nombre en la granja' });
      }
      throw err;
    }
  })
);

module.exports = router;
