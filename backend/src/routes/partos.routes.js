const express = require('express');
const { pool } = require('../config/database');
const { asyncHandler } = require('../utils/helpers');
const { authRequired, loadUserFarms, requireFarmAccess, requireRoles } = require('../middleware/auth');

const router = express.Router();
router.use(authRequired, loadUserFarms, requireFarmAccess);
const canWrite = requireRoles('superadmin', 'admin', 'encargado', 'auxiliar');

// CUY-08
router.post(
  '/',
  canWrite,
  asyncHandler(async (req, res) => {
    const {
      id_hembra,
      id_empadre,
      fecha_parto,
      vivos_m = 0,
      vivos_h = 0,
      muertos = 0,
      peso_m1,
      peso_m2,
      peso_m3,
      peso_h1,
      peso_h2,
      peso_h3,
    } = req.body || {};
    if (!id_hembra || !fecha_parto) {
      return res.status(400).json({ error: 'id_hembra y fecha_parto son obligatorios' });
    }

    const hembra = await pool.query(
      `SELECT id FROM animales WHERE id=$1 AND id_granja=$2 AND sexo='H' AND estado='activo'`,
      [id_hembra, req.granjaId]
    );
    if (!hembra.rows[0]) return res.status(400).json({ error: 'Hembra inválida' });

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query(
        `INSERT INTO partos
          (id_granja, id_hembra, id_empadre, fecha_parto, vivos_m, vivos_h, muertos,
           peso_m1, peso_m2, peso_m3, peso_h1, peso_h2, peso_h3, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
        [
          req.granjaId,
          id_hembra,
          id_empadre || null,
          fecha_parto,
          vivos_m,
          vivos_h,
          muertos,
          peso_m1 || null,
          peso_m2 || null,
          peso_m3 || null,
          peso_h1 || null,
          peso_h2 || null,
          peso_h3 || null,
          req.user.id,
        ]
      );
      if (id_empadre) {
        await client.query(
          `UPDATE empadre_hembras SET resultado = 'prenez'
           WHERE id_empadre = $1 AND id_hembra = $2`,
          [id_empadre, id_hembra]
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
      `SELECT p.*, a.codigo AS hembra_codigo
       FROM partos p JOIN animales a ON a.id = p.id_hembra
       WHERE p.id_granja = $1
       ORDER BY p.fecha_parto DESC`,
      [req.granjaId]
    );
    res.json(rows);
  })
);

module.exports = router;
