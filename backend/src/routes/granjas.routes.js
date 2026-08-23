const express = require('express');
const { pool } = require('../config/database');
const { asyncHandler } = require('../utils/helpers');
const {
  authRequired,
  requireRoles,
  loadUserFarms,
} = require('../middleware/auth');

const router = express.Router();

// NUC-04
router.get(
  '/',
  authRequired,
  loadUserFarms,
  asyncHandler(async (req, res) => {
    res.json(req.userFarms);
  })
);

router.post(
  '/',
  authRequired,
  requireRoles('superadmin'),
  asyncHandler(async (req, res) => {
    const { nombre, id_especie, ubicacion, responsable, fecha_inicio } = req.body || {};
    if (!nombre || !id_especie) {
      return res.status(400).json({ error: 'nombre e id_especie son obligatorios' });
    }
    try {
      const { rows } = await pool.query(
        `INSERT INTO granjas (nombre, id_especie, ubicacion, responsable, fecha_inicio)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [nombre, id_especie, ubicacion || null, responsable || null, fecha_inicio || null]
      );
      res.status(201).json(rows[0]);
    } catch (err) {
      if (err.code === '23505') {
        return res.status(409).json({ error: 'Ya existe una granja con ese nombre' });
      }
      throw err;
    }
  })
);

router.patch(
  '/:id/desactivar',
  authRequired,
  requireRoles('superadmin'),
  asyncHandler(async (req, res) => {
    const { rows } = await pool.query(
      `UPDATE granjas SET activa = false, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Granja no encontrada' });
    res.json(rows[0]);
  })
);

// NUC-05
router.put(
  '/:id/usuarios',
  authRequired,
  requireRoles('superadmin', 'admin'),
  loadUserFarms,
  asyncHandler(async (req, res) => {
    const granjaId = Number(req.params.id);
    const { usuario_ids = [] } = req.body || {};
    const allowed = req.userFarms.map((g) => g.id);
    if (req.user.rol !== 'superadmin' && !allowed.includes(granjaId)) {
      return res.status(403).json({ error: 'Granja fuera de su alcance' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(`DELETE FROM usuario_granjas WHERE id_granja = $1`, [granjaId]);
      for (const uid of usuario_ids.map(Number)) {
        await client.query(
          `INSERT INTO usuario_granjas (id_usuario, id_granja) VALUES ($1, $2)
           ON CONFLICT DO NOTHING`,
          [uid, granjaId]
        );
      }
      await client.query('COMMIT');
      res.json({ ok: true, id_granja: granjaId, usuarios: usuario_ids });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  })
);

module.exports = router;
