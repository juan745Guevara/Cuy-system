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
      `SELECT u.id, u.nombre, u.email, u.rol, u.activo, u.created_by,
              COALESCE(json_agg(json_build_object('id', g.id, 'nombre', g.nombre))
                FILTER (WHERE g.id IS NOT NULL), '[]') AS granjas
       FROM usuarios u
       LEFT JOIN usuario_granjas ug ON ug.id_usuario = u.id
       LEFT JOIN granjas g ON g.id = ug.id_granja
       WHERE ($1 = 'superadmin') OR (u.rol <> 'superadmin' AND (
         u.created_by = $2 OR u.id IN (
           SELECT ug2.id_usuario FROM usuario_granjas ug2
           WHERE ug2.id_granja IN (SELECT id_granja FROM usuario_granjas WHERE id_usuario = $2)
         )
       ))
       GROUP BY u.id
       ORDER BY u.nombre`,
      [req.user.rol, req.user.id]
    );
    res.json(rows);
  })
);

// NUC-06/07 — editar / desactivar / reasignar granjas
router.patch(
  '/:id',
  authRequired,
  loadUserFarms,
  requireRoles('superadmin', 'admin'),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const { activo, granja_ids, password, nombre } = req.body || {};
    const target = await pool.query(`SELECT * FROM usuarios WHERE id = $1`, [id]);
    if (!target.rows[0]) return res.status(404).json({ error: 'Usuario no encontrado' });
    const u = target.rows[0];

    if (u.rol === 'superadmin') {
      return res.status(403).json({ error: 'No se puede editar al superadmin' });
    }
    if (u.rol === 'admin' && req.user.rol !== 'superadmin') {
      return res.status(403).json({ error: 'Solo el superadmin edita cuentas Admin' });
    }
    if (req.user.rol === 'admin' && u.created_by !== req.user.id && u.id !== req.user.id) {
      // admin only edits accounts they created (not self-escalation of farms)
      return res.status(403).json({ error: 'Solo puede editar cuentas que usted creó' });
    }
    if (req.user.rol === 'admin' && u.id === req.user.id && granja_ids) {
      return res.status(403).json({
        error: 'Un admin no puede ampliar su propio alcance de granjas',
      });
    }

    if (granja_ids) {
      const allowed = await creatorFarmIds(req.user.id, req.user.rol);
      const requested = granja_ids.map(Number);
      const invalid = requested.filter((gid) => !allowed.includes(gid));
      if (invalid.length) {
        await pool.query(
          `INSERT INTO audit_log (id_usuario, accion, detalle) VALUES ($1, 'escalada_bloqueada', $2)`,
          [req.user.id, JSON.stringify({ invalid, requested, target: id })]
        );
        return res.status(403).json({
          error: 'No puede asignar granjas fuera de su alcance',
          granjas_invalidas: invalid,
        });
      }
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      let hash = null;
      if (password) hash = await bcrypt.hash(password, 10);
      const { rows } = await client.query(
        `UPDATE usuarios SET
           nombre = COALESCE($1, nombre),
           activo = COALESCE($2, activo),
           password_hash = COALESCE($3, password_hash),
           updated_at = NOW()
         WHERE id = $4
         RETURNING id, nombre, email, rol, activo`,
        [nombre || null, typeof activo === 'boolean' ? activo : null, hash, id]
      );
      if (Array.isArray(granja_ids)) {
        await client.query(`DELETE FROM usuario_granjas WHERE id_usuario = $1`, [id]);
        for (const gid of granja_ids.map(Number)) {
          await client.query(
            `INSERT INTO usuario_granjas (id_usuario, id_granja) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
            [id, gid]
          );
        }
      }
      await client.query('COMMIT');
      const full = await pool.query(
        `SELECT u.id, u.nombre, u.email, u.rol, u.activo,
                COALESCE(json_agg(json_build_object('id', g.id, 'nombre', g.nombre))
                  FILTER (WHERE g.id IS NOT NULL), '[]') AS granjas
         FROM usuarios u
         LEFT JOIN usuario_granjas ug ON ug.id_usuario = u.id
         LEFT JOIN granjas g ON g.id = ug.id_granja
         WHERE u.id = $1 GROUP BY u.id`,
        [id]
      );
      res.json(full.rows[0] || rows[0]);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  })
);

module.exports = router;
