const express = require('express');
const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');
const { asyncHandler } = require('../utils/helpers');
const { authRequired, requireRoles, loadUserFarms } = require('../middleware/auth');

const router = express.Router();

const ROLE_RANK = {
  superadmin: 5,
  admin: 4,
  encargado: 3,
  supervisor: 2,
  auxiliar: 1,
};

async function creatorFarmIds(userId, rol) {
  if (rol === 'superadmin') {
    const { rows } = await pool.query(`SELECT id FROM granjas WHERE activa = true`);
    return rows.map((r) => r.id);
  }
  const { rows } = await pool.query(
    `SELECT id_granja AS id FROM usuario_granjas WHERE id_usuario = $1`,
    [userId]
  );
  return rows.map((r) => r.id);
}

router.post(
  '/',
  authRequired,
  loadUserFarms,
  requireRoles('superadmin', 'admin'),
  asyncHandler(async (req, res) => {
    const { nombre, email, password, rol, granja_ids = [] } = req.body || {};
    if (!nombre || !email || !password || !rol) {
      return res.status(400).json({ error: 'nombre, email, password y rol son obligatorios' });
    }
    if (rol === 'admin' && req.user.rol !== 'superadmin') {
      return res.status(403).json({ error: 'Solo el superadmin puede crear cuentas admin' });
    }
    if (rol === 'superadmin') {
      return res.status(403).json({ error: 'No se puede crear otro superadmin desde la API' });
    }
    if (req.user.rol === 'admin' && !['encargado', 'supervisor', 'auxiliar'].includes(rol)) {
      return res.status(403).json({ error: 'Admin solo puede crear roles operativos' });
    }
    if ((ROLE_RANK[rol] || 0) >= (ROLE_RANK[req.user.rol] || 0) && req.user.rol !== 'superadmin') {
      return res.status(403).json({ error: 'No puede asignar un rol igual o superior al suyo' });
    }

    const allowed = await creatorFarmIds(req.user.id, req.user.rol);
    const requested = granja_ids.map(Number);
    const invalid = requested.filter((id) => !allowed.includes(id));
    if (invalid.length) {
      await pool.query(
        `INSERT INTO audit_log (id_usuario, accion, detalle) VALUES ($1, 'escalada_bloqueada', $2)`,
        [req.user.id, JSON.stringify({ invalid, requested })]
      );
      return res.status(403).json({
        error: 'No puede asignar granjas fuera de su alcance',
        granjas_invalidas: invalid,
      });
    }

    const hash = await bcrypt.hash(password, 10);
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query(
        `INSERT INTO usuarios (nombre, email, password_hash, rol, created_by)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, nombre, email, rol, activo`,
        [nombre, email.trim().toLowerCase(), hash, rol, req.user.id]
      );
      const user = rows[0];
      for (const gid of requested) {
        await client.query(
          `INSERT INTO usuario_granjas (id_usuario, id_granja) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [user.id, gid]
        );
      }
      await client.query('COMMIT');
      res.status(201).json(user);
    } catch (err) {
      await client.query('ROLLBACK');
      if (err.code === '23505') return res.status(409).json({ error: 'El email ya está registrado' });
      throw err;
    } finally {
      client.release();
    }
  })
);

router.get(
  '/',
  authRequired,
  requireRoles('superadmin', 'admin'),
  asyncHandler(async (req, res) => {
    const { rows } = await pool.query(
      `SELECT u.id, u.nombre, u.email, u.rol, u.activo,
              COALESCE(json_agg(json_build_object('id', g.id, 'nombre', g.nombre))
                FILTER (WHERE g.id IS NOT NULL), '[]') AS granjas
       FROM usuarios u
       LEFT JOIN usuario_granjas ug ON ug.id_usuario = u.id
       LEFT JOIN granjas g ON g.id = ug.id_granja
       WHERE ($1 = 'superadmin') OR u.rol <> 'superadmin'
       GROUP BY u.id
       ORDER BY u.nombre`,
      [req.user.rol]
    );
    res.json(rows);
  })
);

module.exports = router;
