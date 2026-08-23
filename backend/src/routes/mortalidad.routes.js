const express = require('express');
const { pool } = require('../config/database');
const { asyncHandler } = require('../utils/helpers');
const { authRequired, loadUserFarms, requireFarmAccess, requireRoles } = require('../middleware/auth');

const router = express.Router();
router.use(authRequired, loadUserFarms, requireFarmAccess);
const canWrite = requireRoles('superadmin', 'admin', 'encargado', 'auxiliar');

// NUC-26
router.post(
  '/',
  canWrite,
  asyncHandler(async (req, res) => {
    const { id_animal, fecha, clasificacion, categoria, cantidad, causa, id_jaula } = req.body || {};
    if (!fecha || !cantidad) {
      return res.status(400).json({ error: 'fecha y cantidad son obligatorios' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query(
        `INSERT INTO mortalidad
          (id_granja, id_animal, fecha, clasificacion, categoria, cantidad, causa, id_jaula, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
        [
          req.granjaId,
          id_animal || null,
          fecha,
          clasificacion || null,
          categoria || null,
          cantidad,
          causa || null,
          id_jaula || null,
          req.user.id,
        ]
      );
      if (id_animal) {
        await client.query(
          `UPDATE animales SET estado = 'baja_muerte', fecha_baja = $1,
             motivo_baja = COALESCE($2, 'Mortalidad'), updated_at = NOW()
           WHERE id = $3 AND id_granja = $4`,
          [fecha, causa || null, id_animal, req.granjaId]
        );
      }
      await client.query('COMMIT');
      res.status(201).json(rows[0]);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  })
);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { rows } = await pool.query(
      `SELECT * FROM mortalidad WHERE id_granja = $1 ORDER BY fecha DESC`,
      [req.granjaId]
    );
    res.json(rows);
  })
);

module.exports = router;
