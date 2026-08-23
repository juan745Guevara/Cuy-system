const express = require('express');
const { pool } = require('../config/database');
const { asyncHandler } = require('../utils/helpers');
const { writeAudit, ensureAuditSchema } = require('../utils/audit');
const {
  authRequired,
  loadUserFarms,
  requireFarmAccess,
  requireRoles,
} = require('../middleware/auth');

const router = express.Router();
router.use(authRequired, loadUserFarms, requireFarmAccess);
const canAudit = requireRoles('superadmin', 'admin', 'supervisor', 'encargado');

router.get(
  '/',
  canAudit,
  asyncHandler(async (req, res) => {
    await ensureAuditSchema();
    const params = [req.granjaId];
    let sql = `
      SELECT a.*, u.nombre AS usuario_nombre, u.email AS usuario_email
      FROM audit_log a
      LEFT JOIN usuarios u ON u.id = a.id_usuario
      WHERE (a.id_granja = $1 OR a.id_granja IS NULL)`;
    if (req.query.entidad) {
      params.push(req.query.entidad);
      sql += ` AND a.entidad = $${params.length}`;
    }
    if (req.query.id_entidad) {
      params.push(Number(req.query.id_entidad));
      sql += ` AND a.id_entidad = $${params.length}`;
    }
    sql += ' ORDER BY a.created_at DESC LIMIT 200';
    const { rows } = await pool.query(sql, params);
    res.json(rows);
  })
);

/** Soft-anular mortalidad (deja de contar en inventario) */
router.post(
  '/anular/mortalidad/:id',
  canAudit,
  asyncHandler(async (req, res) => {
    await ensureAuditSchema();
    const { motivo } = req.body || {};
    if (!(motivo || '').trim()) {
      return res.status(400).json({ error: 'motivo de anulación obligatorio' });
    }
    const before = await pool.query(
      `SELECT * FROM mortalidad WHERE id = $1 AND id_granja = $2`,
      [req.params.id, req.granjaId]
    );
    if (!before.rows[0]) return res.status(404).json({ error: 'Registro no encontrado' });
    if (before.rows[0].anulado) {
      return res.status(409).json({ error: 'Ya está anulado' });
    }
    await pool.query(`ALTER TABLE mortalidad ADD COLUMN IF NOT EXISTS anulado BOOLEAN DEFAULT false`);
    await pool.query(`ALTER TABLE mortalidad ADD COLUMN IF NOT EXISTS motivo_anulacion TEXT`);
    const { rows } = await pool.query(
      `UPDATE mortalidad SET anulado = true, motivo_anulacion = $1
       WHERE id = $2 AND id_granja = $3 RETURNING *`,
      [motivo.trim(), req.params.id, req.granjaId]
    );
    await writeAudit({
      userId: req.user.id,
      granjaId: req.granjaId,
      accion: 'anular',
      entidad: 'mortalidad',
      idEntidad: rows[0].id,
      antes: before.rows[0],
      despues: rows[0],
      detalle: motivo.trim(),
    });
    res.json(rows[0]);
  })
);

router.post(
  '/anular/venta/:id',
  canAudit,
  asyncHandler(async (req, res) => {
    await ensureAuditSchema();
    const { motivo } = req.body || {};
    if (!(motivo || '').trim()) {
      return res.status(400).json({ error: 'motivo de anulación obligatorio' });
    }
    const before = await pool.query(
      `SELECT * FROM ventas WHERE id = $1 AND id_granja = $2`,
      [req.params.id, req.granjaId]
    );
    if (!before.rows[0]) return res.status(404).json({ error: 'Registro no encontrado' });
    await pool.query(`ALTER TABLE ventas ADD COLUMN IF NOT EXISTS anulado BOOLEAN DEFAULT false`);
    await pool.query(`ALTER TABLE ventas ADD COLUMN IF NOT EXISTS motivo_anulacion TEXT`);
    if (before.rows[0].anulado) {
      return res.status(409).json({ error: 'Ya está anulado' });
    }
    const { rows } = await pool.query(
      `UPDATE ventas SET anulado = true, motivo_anulacion = $1
       WHERE id = $2 AND id_granja = $3 RETURNING *`,
      [motivo.trim(), req.params.id, req.granjaId]
    );
    await writeAudit({
      userId: req.user.id,
      granjaId: req.granjaId,
      accion: 'anular',
      entidad: 'venta',
      idEntidad: rows[0].id,
      antes: before.rows[0],
      despues: rows[0],
      detalle: motivo.trim(),
    });
    res.json(rows[0]);
  })
);

module.exports = router;
