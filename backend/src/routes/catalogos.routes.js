const express = require('express');
const { pool } = require('../config/database');
const { asyncHandler } = require('../utils/helpers');
const { authRequired, loadUserFarms, requireFarmAccess, requireRoles } = require('../middleware/auth');

const router = express.Router();
router.use(authRequired, loadUserFarms, requireFarmAccess);

async function especieDeGranja(granjaId) {
  const { rows } = await pool.query(`SELECT id_especie FROM granjas WHERE id = $1`, [granjaId]);
  return rows[0]?.id_especie;
}

// CUY-01
router.get(
  '/razas',
  asyncHandler(async (req, res) => {
    const idEspecie = await especieDeGranja(req.granjaId);
    const { rows } = await pool.query(
      `SELECT * FROM razas WHERE id_especie = $1 AND activa = true ORDER BY nombre`,
      [idEspecie]
    );
    res.json(rows);
  })
);

router.post(
  '/razas',
  requireRoles('superadmin', 'admin'),
  asyncHandler(async (req, res) => {
    const { nombre } = req.body || {};
    if (!nombre) return res.status(400).json({ error: 'nombre es obligatorio' });
    const idEspecie = await especieDeGranja(req.granjaId);
    try {
      const { rows } = await pool.query(
        `INSERT INTO razas (id_especie, nombre) VALUES ($1, $2) RETURNING *`,
        [idEspecie, nombre.trim()]
      );
      res.status(201).json(rows[0]);
    } catch (err) {
      if (err.code === '23505') return res.status(409).json({ error: 'Raza ya existe' });
      throw err;
    }
  })
);

// CUY-02
router.get(
  '/categorias',
  asyncHandler(async (req, res) => {
    const idEspecie = await especieDeGranja(req.granjaId);
    const { rows } = await pool.query(
      `SELECT * FROM categorias WHERE id_especie = $1 AND activa = true ORDER BY nombre`,
      [idEspecie]
    );
    res.json(rows);
  })
);

router.post(
  '/categorias',
  requireRoles('superadmin', 'admin'),
  asyncHandler(async (req, res) => {
    const { nombre, proposito_area } = req.body || {};
    if (!nombre) return res.status(400).json({ error: 'nombre es obligatorio' });
    const idEspecie = await especieDeGranja(req.granjaId);
    try {
      const { rows } = await pool.query(
        `INSERT INTO categorias (id_especie, nombre, proposito_area) VALUES ($1, $2, $3) RETURNING *`,
        [idEspecie, nombre.trim(), proposito_area || null]
      );
      res.status(201).json(rows[0]);
    } catch (err) {
      if (err.code === '23505') return res.status(409).json({ error: 'Categoría ya existe' });
      throw err;
    }
  })
);

router.get(
  '/especies',
  asyncHandler(async (req, res) => {
    const { rows } = await pool.query(`SELECT * FROM especies WHERE activo = true ORDER BY nombre`);
    res.json(rows);
  })
);

router.patch(
  '/razas/:id/desactivar',
  requireRoles('superadmin', 'admin'),
  asyncHandler(async (req, res) => {
    const idEspecie = await especieDeGranja(req.granjaId);
    const { rows } = await pool.query(
      `UPDATE razas SET activa=false WHERE id=$1 AND id_especie=$2 RETURNING *`,
      [req.params.id, idEspecie]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Raza no encontrada' });
    res.json(rows[0]);
  })
);

router.patch(
  '/categorias/:id/desactivar',
  requireRoles('superadmin', 'admin'),
  asyncHandler(async (req, res) => {
    const idEspecie = await especieDeGranja(req.granjaId);
    const { rows } = await pool.query(
      `UPDATE categorias SET activa=false WHERE id=$1 AND id_especie=$2 RETURNING *`,
      [req.params.id, idEspecie]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Categoría no encontrada' });
    res.json(rows[0]);
  })
);

module.exports = router;
