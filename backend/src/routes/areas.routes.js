const express = require('express');
const { pool } = require('../config/database');
const { asyncHandler } = require('../utils/helpers');
const { writeAudit } = require('../utils/audit');
const { PROPOSITOS, normalizeProposito } = require('../utils/propositoArea');
const {
  authRequired,
  loadUserFarms,
  requireFarmAccess,
  requireRoles,
} = require('../middleware/auth');

const router = express.Router();

router.use(authRequired, loadUserFarms, requireFarmAccess);

// Gestión de áreas
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { rows } = await pool.query(
      `SELECT a.*,
              (SELECT COUNT(*)::int FROM jaulas j WHERE j.id_area = a.id AND j.activa) AS jaulas,
              (SELECT COUNT(*)::int FROM animales an
                 JOIN jaulas j ON j.id = an.id_jaula
                WHERE j.id_area = a.id AND an.estado = 'activo') AS animales
       FROM areas a
       WHERE a.id_granja = $1
       ORDER BY a.nombre`,
      [req.granjaId]
    );
    res.json(rows);
  })
);

// Vista por áreas
router.get(
  '/resumen',
  asyncHandler(async (req, res) => {
    const { rows } = await pool.query(
      `SELECT a.id, a.nombre, a.proposito,
              COALESCE(json_agg(
                json_build_object(
                  'id', j.id,
                  'codigo', j.codigo,
                  'capacidad_maxima', j.capacidad_maxima,
                  'ocupacion', (
                    SELECT COUNT(*)::int FROM animales an
                    WHERE an.id_jaula = j.id AND an.estado = 'activo'
                  )
                )
              ) FILTER (WHERE j.id IS NOT NULL), '[]') AS jaulas
       FROM areas a
       LEFT JOIN jaulas j ON j.id_area = a.id AND j.activa = true
       WHERE a.id_granja = $1 AND a.activa = true
       GROUP BY a.id
       ORDER BY a.nombre`,
      [req.granjaId]
    );
    res.json(rows);
  })
);

router.post(
  '/',
  requireRoles('superadmin', 'admin', 'encargado'),
  asyncHandler(async (req, res) => {
    const { nombre, proposito, jaula_ids = [] } = req.body || {};
    if (!nombre || !proposito) {
      return res.status(400).json({ error: 'nombre y proposito son obligatorios' });
    }
    const prop = normalizeProposito(proposito);
    if (!PROPOSITOS.includes(prop) && prop !== proposito) {
      // allow "otro" custom already normalized, or unknown mapped
    }
    if (!PROPOSITOS.includes(prop)) {
      return res.status(400).json({
        error: 'Propósito no válido',
        propositos: PROPOSITOS,
      });
    }
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query(
        `INSERT INTO areas (id_granja, nombre, proposito)
         VALUES ($1, $2, $3) RETURNING *`,
        [req.granjaId, nombre, prop]
      );
      const area = rows[0];
      for (const jid of jaula_ids.map(Number).filter(Boolean)) {
        await client.query(
          `UPDATE jaulas j SET id_area = $1
           FROM areas a WHERE j.id_area = a.id AND a.id_granja = $2 AND j.id = $3`,
          [area.id, req.granjaId, jid]
        );
      }
      await client.query('COMMIT');
      await writeAudit({
        userId: req.user.id,
        granjaId: req.granjaId,
        accion: 'crear',
        entidad: 'area',
        idEntidad: area.id,
        despues: area,
        detalle: `Alta de área ${area.nombre}`,
      });
      res.status(201).json(area);
    } catch (err) {
      await client.query('ROLLBACK');
      if (err.code === '23505') {
        return res.status(409).json({ error: 'Ya existe un área con ese nombre en la granja' });
      }
      throw err;
    } finally {
      client.release();
    }
  })
);

router.patch(
  '/:id/desactivar',
  requireRoles('superadmin', 'admin', 'encargado'),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const { id_area_destino } = req.body || {};
    const area = await pool.query(
      `SELECT * FROM areas WHERE id=$1 AND id_granja=$2`,
      [id, req.granjaId]
    );
    if (!area.rows[0]) return res.status(404).json({ error: 'Área no encontrada' });

    const jaulas = await pool.query(
      `SELECT id FROM jaulas WHERE id_area=$1 AND activa=true`,
      [id]
    );
    if (jaulas.rows.length && !id_area_destino) {
      return res.status(400).json({
        error: 'Reubique las jaulas a otra área antes de desactivar',
        jaulas: jaulas.rows.length,
      });
    }
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      if (id_area_destino) {
        const dest = await client.query(
          `SELECT id FROM areas WHERE id=$1 AND id_granja=$2 AND activa=true`,
          [id_area_destino, req.granjaId]
        );
        if (!dest.rows[0]) {
          await client.query('ROLLBACK');
          return res.status(400).json({ error: 'Área destino inválida' });
        }
        await client.query(`UPDATE jaulas SET id_area=$1 WHERE id_area=$2`, [
          id_area_destino,
          id,
        ]);
      }
      const { rows } = await client.query(
        `UPDATE areas SET activa=false, updated_at=NOW() WHERE id=$1 RETURNING *`,
        [id]
      );
      await client.query('COMMIT');
      await writeAudit({
        userId: req.user.id,
        granjaId: req.granjaId,
        accion: 'desactivar',
        entidad: 'area',
        idEntidad: rows[0].id,
        antes: area.rows[0],
        despues: rows[0],
        detalle: `Desactivación de área ${area.rows[0].nombre}`,
      });
      res.json(rows[0]);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  })
);

module.exports = router;
