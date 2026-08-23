const express = require('express');
const { pool } = require('../config/database');
const { asyncHandler } = require('../utils/helpers');
const {
  authRequired,
  loadUserFarms,
  requireFarmAccess,
  requireRoles,
} = require('../middleware/auth');

const router = express.Router();
router.use(authRequired, loadUserFarms, requireFarmAccess);
const canWrite = requireRoles('superadmin', 'admin', 'encargado', 'auxiliar', 'supervisor');

function addDays(fechaISO, dias) {
  const d = new Date(`${fechaISO}T00:00:00`);
  d.setDate(d.getDate() + Number(dias));
  return d.toISOString().slice(0, 10);
}

// NUC-24
router.post(
  '/',
  canWrite,
  asyncHandler(async (req, res) => {
    const {
      tipo = 'curativo',
      producto,
      dosis,
      via,
      fecha_inicio,
      duracion_dias,
      diagnostico,
      responsable,
      id_animal,
      id_jaula,
      id_area,
      ids_animales,
    } = req.body || {};

    if (!producto || !fecha_inicio || !duracion_dias) {
      return res.status(400).json({
        error: 'producto, fecha_inicio y duracion_dias son obligatorios',
      });
    }
    if (!['preventivo', 'curativo'].includes(tipo)) {
      return res.status(400).json({ error: 'tipo debe ser preventivo o curativo' });
    }

    const termino = addDays(fecha_inicio, Number(duracion_dias));
    let animalIds = Array.isArray(ids_animales) ? ids_animales.map(Number) : [];
    if (id_animal) animalIds = [Number(id_animal)];

    if (id_jaula && !animalIds.length) {
      const { rows } = await pool.query(
        `SELECT an.id FROM animales an
         JOIN jaulas j ON j.id = an.id_jaula
         JOIN areas a ON a.id = j.id_area
         WHERE j.id = $1 AND a.id_granja = $2 AND an.estado = 'activo'`,
        [id_jaula, req.granjaId]
      );
      animalIds = rows.map((r) => r.id);
    }
    if (id_area && !animalIds.length) {
      const { rows } = await pool.query(
        `SELECT an.id FROM animales an
         JOIN jaulas j ON j.id = an.id_jaula
         JOIN areas a ON a.id = j.id_area
         WHERE a.id = $1 AND a.id_granja = $2 AND an.estado = 'activo'`,
        [id_area, req.granjaId]
      );
      animalIds = rows.map((r) => r.id);
    }

    const targets = animalIds.length ? animalIds : [null];
    const creados = [];
    for (const aid of targets) {
      const { rows } = await pool.query(
        `INSERT INTO tratamientos
          (id_granja, id_animal, id_jaula, id_area, tipo, producto, dosis, via,
           fecha_inicio, duracion_dias, fecha_termino, diagnostico, responsable, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
        [
          req.granjaId,
          aid,
          id_jaula || null,
          id_area || null,
          tipo,
          producto,
          dosis || null,
          via || null,
          fecha_inicio,
          Number(duracion_dias),
          termino,
          diagnostico || null,
          responsable || req.user.nombre || null,
          req.user.id,
        ]
      );
      creados.push(rows[0]);
    }
    res.status(201).json({ registrados: creados.length, tratamientos: creados });
  })
);

// NUC-25 listado
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const params = [req.granjaId];
    let sql = `
      SELECT t.*, an.codigo, a.nombre AS area, j.codigo AS jaula
      FROM tratamientos t
      LEFT JOIN animales an ON an.id = t.id_animal
      LEFT JOIN areas a ON a.id = t.id_area
      LEFT JOIN jaulas j ON j.id = t.id_jaula
      WHERE t.id_granja = $1`;
    if (req.query.estado) {
      params.push(req.query.estado);
      sql += ` AND t.estado = $${params.length}`;
    }
    if (req.query.id_area) {
      params.push(Number(req.query.id_area));
      sql += ` AND t.id_area = $${params.length}`;
    }
    if (req.query.id_animal) {
      params.push(Number(req.query.id_animal));
      sql += ` AND t.id_animal = $${params.length}`;
    }
    sql += ' ORDER BY t.fecha_inicio DESC, t.id DESC';
    const { rows } = await pool.query(sql, params);
    res.json(rows);
  })
);

router.get(
  '/en-curso',
  asyncHandler(async (req, res) => {
    const { rows } = await pool.query(
      `SELECT t.*, an.codigo, a.nombre AS area
       FROM tratamientos t
       LEFT JOIN animales an ON an.id = t.id_animal
       LEFT JOIN areas a ON a.id = t.id_area
       WHERE t.id_granja = $1 AND t.estado = 'en_curso'
       ORDER BY t.fecha_termino ASC`,
      [req.granjaId]
    );
    res.json(rows);
  })
);

router.patch(
  '/:id/terminar',
  canWrite,
  asyncHandler(async (req, res) => {
    const { motivo_cierre } = req.body || {};
    const { rows } = await pool.query(
      `UPDATE tratamientos
       SET estado = 'terminado', motivo_cierre = $1
       WHERE id = $2 AND id_granja = $3
       RETURNING *`,
      [motivo_cierre || null, req.params.id, req.granjaId]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Tratamiento no encontrado' });
    res.json(rows[0]);
  })
);

module.exports = router;
