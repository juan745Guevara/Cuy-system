const express = require('express');
const { pool } = require('../config/database');
const { asyncHandler } = require('../utils/helpers');
const { authRequired, loadUserFarms, requireFarmAccess, requireRoles } = require('../middleware/auth');

const router = express.Router();
router.use(authRequired, loadUserFarms, requireFarmAccess);
const canWrite = requireRoles('superadmin', 'admin', 'encargado', 'auxiliar');

// CUY-09
router.post(
  '/',
  canWrite,
  asyncHandler(async (req, res) => {
    const {
      id_parto,
      fecha_destete,
      destetados_m = 0,
      destetados_h = 0,
      muertos = 0,
      peso_m1,
      peso_m2,
      peso_m3,
      peso_h1,
      peso_h2,
      peso_h3,
    } = req.body || {};
    if (!id_parto || !fecha_destete) {
      return res.status(400).json({ error: 'id_parto y fecha_destete son obligatorios' });
    }

    const parto = await pool.query(
      `SELECT * FROM partos WHERE id = $1 AND id_granja = $2`,
      [id_parto, req.granjaId]
    );
    if (!parto.rows[0]) return res.status(404).json({ error: 'Parto no encontrado' });

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query(
        `INSERT INTO destetes
          (id_parto, fecha_destete, destetados_m, destetados_h, muertos,
           peso_m1, peso_m2, peso_m3, peso_h1, peso_h2, peso_h3, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
        [
          id_parto,
          fecha_destete,
          destetados_m,
          destetados_h,
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

      // gazapos → recría/reemplazo (categoría)
      const cat = await client.query(
        `SELECT c.id FROM categorias c
         JOIN granjas g ON g.id_especie = c.id_especie
         WHERE g.id = $1 AND LOWER(c.nombre) IN ('recria', 'reemplazo') LIMIT 1`,
        [req.granjaId]
      );
      if (cat.rows[0]) {
        // no cría individual aún; deja traza en particularidad de la madre
        await client.query(
          `INSERT INTO animal_particularidades (id_animal, texto, created_by)
           VALUES ($1, $2, $3)`,
          [
            parto.rows[0].id_hembra,
            `Destete ${fecha_destete}: ${destetados_m}M + ${destetados_h}H (categoría destino: recría)`,
            req.user.id,
          ]
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
      `SELECT d.*, p.fecha_parto, a.codigo AS hembra_codigo
       FROM destetes d
       JOIN partos p ON p.id = d.id_parto
       JOIN animales a ON a.id = p.id_hembra
       WHERE p.id_granja = $1
       ORDER BY d.fecha_destete DESC`,
      [req.granjaId]
    );
    res.json(rows);
  })
);

module.exports = router;
