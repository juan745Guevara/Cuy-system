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

// NUC-13 + CUY-03
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { id_area } = req.query;
    const params = [req.granjaId];
    let sql = `
      SELECT j.*, a.nombre AS area, a.proposito,
             (SELECT COUNT(*)::int FROM animales an
               WHERE an.id_jaula = j.id AND an.estado = 'activo') AS ocupacion
      FROM jaulas j
      JOIN areas a ON a.id = j.id_area
      WHERE a.id_granja = $1 AND j.activa = true`;
    if (id_area) {
      params.push(Number(id_area));
      sql += ` AND j.id_area = $2`;
    }
    sql += ' ORDER BY a.nombre, j.codigo';
    const { rows } = await pool.query(sql, params);
    res.json(rows);
  })
);

router.post(
  '/',
  requireRoles('superadmin', 'admin', 'encargado'),
  asyncHandler(async (req, res) => {
    const { id_area, codigo, capacidad_maxima } = req.body || {};
    if (!id_area || !codigo) {
      return res.status(400).json({ error: 'id_area y codigo son obligatorios' });
    }
    const area = await pool.query(
      `SELECT id FROM areas WHERE id = $1 AND id_granja = $2`,
      [id_area, req.granjaId]
    );
    if (!area.rows[0]) {
      return res.status(400).json({ error: 'El área no pertenece a la granja activa' });
    }
    try {
      const { rows } = await pool.query(
        `INSERT INTO jaulas (id_area, codigo, capacidad_maxima)
         VALUES ($1, $2, $3) RETURNING *`,
        [id_area, String(codigo).trim(), capacidad_maxima || null]
      );
      res.status(201).json(rows[0]);
    } catch (err) {
      if (err.code === '23505') {
        return res.status(409).json({ error: 'Ya existe una jaula con ese código en el área' });
      }
      throw err;
    }
  })
);

router.get(
  '/:id/animales',
  asyncHandler(async (req, res) => {
    const { rows } = await pool.query(
      `SELECT an.*
       FROM animales an
       JOIN jaulas j ON j.id = an.id_jaula
       JOIN areas a ON a.id = j.id_area
       WHERE j.id = $1 AND a.id_granja = $2 AND an.estado = 'activo'
       ORDER BY an.codigo`,
      [req.params.id, req.granjaId]
    );
    res.json(rows);
  })
);

module.exports = router;
