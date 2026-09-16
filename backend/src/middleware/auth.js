const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

function authRequired(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'No autenticado' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
    return next();
  } catch {
    return res.status(401).json({ error: 'Sesión inválida o expirada' });
  }
}

function requireRoles(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.rol)) {
      return res.status(403).json({ error: 'Sin permisos' });
    }
    return next();
  };
}

async function loadUserFarms(req, res, next) {
  try {
    if (req.user.rol === 'superadmin') {
      const { rows } = await pool.query(
        `SELECT g.id, g.nombre, g.id_especie, e.nombre AS especie
         FROM granjas g JOIN especies e ON e.id = g.id_especie
         WHERE g.activa = true ORDER BY g.nombre`
      );
      req.userFarms = rows;
    } else {
      const { rows } = await pool.query(
        `SELECT g.id, g.nombre, g.id_especie, e.nombre AS especie
         FROM usuario_granjas ug
         JOIN granjas g ON g.id = ug.id_granja
         JOIN especies e ON e.id = g.id_especie
         WHERE ug.id_usuario = $1 AND g.activa = true
         ORDER BY g.nombre`,
        [req.user.id]
      );
      req.userFarms = rows;
    }
    next();
  } catch (err) {
    next(err);
  }
}

function requireFarmAccess(req, res, next) {
  const farmId = Number(
    req.headers['x-granja-id'] || req.query.id_granja || req.body?.id_granja
  );
  if (!farmId) {
    return res.status(400).json({ error: 'Indique la granja activa (header x-granja-id)' });
  }
  const ok =
    req.user.rol === 'superadmin' ||
    (req.userFarms || []).some((g) => Number(g.id) === farmId);
  if (!ok) return res.status(403).json({ error: 'Granja fuera de su alcance' });

  // Granja desactivada no admite nuevos registros
  pool
    .query(`SELECT activa FROM granjas WHERE id = $1`, [farmId])
    .then(({ rows }) => {
      if (!rows[0]) return res.status(404).json({ error: 'Granja no encontrada' });
      const write = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);
      if (write && rows[0].activa === false) {
        return res.status(403).json({
          error: 'La granja está desactivada y no admite nuevos registros',
        });
      }
      req.granjaId = farmId;
      return next();
    })
    .catch(next);
}

module.exports = {
  authRequired,
  requireRoles,
  loadUserFarms,
  requireFarmAccess,
};
