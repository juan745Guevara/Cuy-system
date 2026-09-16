const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { pool } = require('../config/database');
const { asyncHandler } = require('../utils/helpers');
const { authRequired, loadUserFarms } = require('../middleware/auth');

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos de inicio de sesión. Intente de nuevo más tarde.' },
});

router.post(
  '/login',
  loginLimiter,
  asyncHandler(async (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
    }

    const { rows } = await pool.query(
      `SELECT id, nombre, email, password_hash, rol, activo
       FROM usuarios WHERE LOWER(email) = LOWER($1)`,
      [email.trim()]
    );
    const user = rows[0];
    if (!user || !user.activo) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Credenciales incorrectas' });

    const token = jwt.sign(
      { id: user.id, email: user.email, rol: user.rol, nombre: user.nombre },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    let farms;
    if (user.rol === 'superadmin') {
      farms = await pool.query(
        `SELECT g.id, g.nombre, g.id_especie, e.nombre AS especie
         FROM granjas g JOIN especies e ON e.id = g.id_especie
         WHERE g.activa = true ORDER BY g.nombre`
      );
    } else {
      farms = await pool.query(
        `SELECT g.id, g.nombre, g.id_especie, e.nombre AS especie
         FROM usuario_granjas ug
         JOIN granjas g ON g.id = ug.id_granja
         JOIN especies e ON e.id = g.id_especie
         WHERE ug.id_usuario = $1 AND g.activa = true ORDER BY g.nombre`,
        [user.id]
      );
    }

    await pool.query(
      `INSERT INTO audit_log (id_usuario, accion, detalle) VALUES ($1, 'login', $2)`,
      [user.id, user.email]
    );

    res.json({
      token,
      user: { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol },
      granjas: farms.rows,
    });
  })
);

router.post(
  '/logout',
  authRequired,
  asyncHandler(async (req, res) => {
    await pool.query(
      `INSERT INTO audit_log (id_usuario, accion, detalle) VALUES ($1, 'logout', 'ok')`,
      [req.user.id]
    );
    res.json({ ok: true });
  })
);

router.get(
  '/me',
  authRequired,
  loadUserFarms,
  asyncHandler(async (req, res) => {
    res.json({
      user: {
        id: req.user.id,
        nombre: req.user.nombre,
        email: req.user.email,
        rol: req.user.rol,
      },
      granjas: req.userFarms,
    });
  })
);

module.exports = router;
