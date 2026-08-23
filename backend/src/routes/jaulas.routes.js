const express = require('express');
const { pool } = require('../config/database');
const { asyncHandler, normalizeCodigo } = require('../utils/helpers');
const {
  authRequired,
  loadUserFarms,
  requireFarmAccess,
  requireRoles,
} = require('../middleware/auth');

const router = express.Router();
router.use(authRequired, loadUserFarms, requireFarmAccess);

// NUC-13 + CUY-03
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { id_area } = req.query;
    const params = [req.granjaId];
    let sql = `
      SELECT j.*, a.nombre AS area, a.proposito,
             (SELECT COUNT(*)::int FROM animales an
               WHERE an.id_jaula = j.id AND an.estado = 'activo') AS ocupacion
      FROM jaulas j
      JOIN areas a ON a.id = j.id_area
      WHERE a.id_granja = $1 AND j.activa = true`;
    if (id_area) {
      params.push(Number(id_area));
      sql += ` AND j.id_area = $2`;
    }
    sql += ' ORDER BY a.nombre, j.codigo';
    const { rows } = await pool.query(sql, params);
    res.json(rows);
  })
);

/** NUC-18 — ocupación por jaula / área / granja + sobrecupo */
router.get(
  '/ocupacion',
  asyncHandler(async (req, res) => {
    const { rows } = await pool.query(
      `SELECT a.id AS id_area, a.nombre AS area, a.proposito,
              j.id AS id_jaula, j.codigo AS jaula, j.capacidad_maxima,
              COUNT(an.id)::int AS ocupacion
       FROM areas a
       LEFT JOIN jaulas j ON j.id_area = a.id AND j.activa = true
       LEFT JOIN animales an ON an.id_jaula = j.id AND an.estado = 'activo'
       WHERE a.id_granja = $1 AND a.activa = true
       GROUP BY a.id, a.nombre, a.proposito, j.id, j.codigo, j.capacidad_maxima
       ORDER BY a.nombre, j.codigo`,
      [req.granjaId]
    );

    const areasMap = {};
    let ocupacionGranja = 0;
    let capacidadGranja = 0;
    const sobrecupo = [];

    for (const r of rows) {
      if (!areasMap[r.id_area]) {
        areasMap[r.id_area] = {
          id: r.id_area,
          nombre: r.area,
          proposito: r.proposito,
          ocupacion: 0,
          capacidad: 0,
          jaulas: [],
        };
      }
      if (!r.id_jaula) continue;
      const item = {
        id: r.id_jaula,
        codigo: r.jaula,
        capacidad_maxima: r.capacidad_maxima,
        ocupacion: r.ocupacion,
        excedida: r.capacidad_maxima != null && r.ocupacion > r.capacidad_maxima,
      };
      areasMap[r.id_area].jaulas.push(item);
      areasMap[r.id_area].ocupacion += r.ocupacion;
      if (r.capacidad_maxima != null) {
        areasMap[r.id_area].capacidad += r.capacidad_maxima;
        capacidadGranja += r.capacidad_maxima;
      }
      ocupacionGranja += r.ocupacion;
      if (item.excedida) {
        sobrecupo.push({ ...item, area: r.area, id_area: r.id_area });
      }
    }

    res.json({
      granja: { ocupacion: ocupacionGranja, capacidad: capacidadGranja || null },
      areas: Object.values(areasMap),
      sobrecupo,
    });
  })
);

router.post(
  '/',
  requireRoles('superadmin', 'admin', 'encargado'),
  asyncHandler(async (req, res) => {
    const { id_area, codigo, capacidad_maxima } = req.body || {};
    if (!id_area || !codigo) {
      return res.status(400).json({ error: 'id_area y codigo son obligatorios' });
    }
    const area = await pool.query(
      `SELECT id FROM areas WHERE id = $1 AND id_granja = $2`,
      [id_area, req.granjaId]
    );
    if (!area.rows[0]) {
      return res.status(400).json({ error: 'El área no pertenece a la granja activa' });
    }
    try {
      const codigoNorm = normalizeCodigo(codigo);
      const dup = await pool.query(
        `SELECT j.id FROM jaulas j
         JOIN areas a ON a.id = j.id_area
         WHERE a.id_granja = $1 AND UPPER(REPLACE(j.codigo,' ','')) = $2 AND j.activa = true`,
        [req.granjaId, codigoNorm]
      );
      if (dup.rows[0]) {
        return res.status(409).json({ error: 'Ya existe una jaula con ese nombre en la granja' });
      }
      const { rows } = await pool.query(
        `INSERT INTO jaulas (id_area, codigo, capacidad_maxima)
         VALUES ($1, $2, $3) RETURNING *`,
        [id_area, String(codigo).trim(), capacidad_maxima || null]
      );
      res.status(201).json(rows[0]);
    } catch (err) {
      if (err.code === '23505') {
        return res.status(409).json({ error: 'Ya existe una jaula con ese código en el área' });
      }
      throw err;
    }
  })
);

router.patch(
  '/:id',
  requireRoles('superadmin', 'admin', 'encargado'),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const { codigo, capacidad_maxima, id_area } = req.body || {};
    const cur = await pool.query(
      `SELECT j.* FROM jaulas j JOIN areas a ON a.id = j.id_area
       WHERE j.id=$1 AND a.id_granja=$2`,
      [id, req.granjaId]
    );
    if (!cur.rows[0]) return res.status(404).json({ error: 'Jaula no encontrada' });

    if (id_area) {
      const area = await pool.query(
        `SELECT id FROM areas WHERE id=$1 AND id_granja=$2`,
        [id_area, req.granjaId]
      );
      if (!area.rows[0]) return res.status(400).json({ error: 'Área inválida' });
    }
    if (codigo) {
      const codigoNorm = normalizeCodigo(codigo);
      const dup = await pool.query(
        `SELECT j.id FROM jaulas j JOIN areas a ON a.id = j.id_area
         WHERE a.id_granja=$1 AND UPPER(REPLACE(j.codigo,' ',''))=$2 AND j.id<>$3 AND j.activa`,
        [req.granjaId, codigoNorm, id]
      );
      if (dup.rows[0]) {
        return res.status(409).json({ error: 'Nombre de jaula duplicado en la granja' });
      }
    }

    const { rows } = await pool.query(
      `UPDATE jaulas SET
         codigo = COALESCE($1, codigo),
         capacidad_maxima = COALESCE($2, capacidad_maxima),
         id_area = COALESCE($3, id_area),
         updated_at = NOW()
       WHERE id = $4 RETURNING *`,
      [codigo ? String(codigo).trim() : null, capacidad_maxima ?? null, id_area || null, id]
    );
    res.json(rows[0]);
  })
);

router.patch(
  '/:id/desactivar',
  requireRoles('superadmin', 'admin', 'encargado'),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const { rows } = await pool.query(
      `UPDATE jaulas j SET activa=false, updated_at=NOW()
       FROM areas a WHERE j.id_area=a.id AND j.id=$1 AND a.id_granja=$2
       RETURNING j.*`,
      [id, req.granjaId]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Jaula no encontrada' });
    res.json(rows[0]);
  })
);

router.get(
  '/:id/animales',
  asyncHandler(async (req, res) => {
    const { rows } = await pool.query(
      `SELECT an.*
       FROM animales an
       JOIN jaulas j ON j.id = an.id_jaula
       JOIN areas a ON a.id = j.id_area
       WHERE j.id = $1 AND a.id_granja = $2 AND an.estado = 'activo'
       ORDER BY an.codigo`,
      [req.params.id, req.granjaId]
    );
    res.json(rows);
  })
);

module.exports = router;
