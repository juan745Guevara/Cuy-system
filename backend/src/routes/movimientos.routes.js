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

async function getJaula(client, idJaula, idGranja) {
  const { rows } = await client.query(
    `SELECT j.id, j.codigo, j.capacidad_maxima, j.id_area, a.nombre AS area,
            a.proposito, a.id_granja,
            (SELECT COUNT(*)::int FROM animales an
              WHERE an.id_jaula = j.id AND an.estado = 'activo') AS ocupacion
     FROM jaulas j
     JOIN areas a ON a.id = j.id_area
     WHERE j.id = $1 AND a.id_granja = $2 AND j.activa = true`,
    [idJaula, idGranja]
  );
  return rows[0] || null;
}

function hoyISO() {
  return new Date().toISOString().slice(0, 10);
}

// NUC-14
router.post(
  '/traslado',
  canWrite,
  asyncHandler(async (req, res) => {
    const {
      fecha,
      id_jaula_destino,
      motivo,
      ids_animales,
      id_jaula_origen_completa,
      confirmar_capacidad,
      confirmar_area,
    } = req.body || {};

    if (!fecha || !id_jaula_destino) {
      return res.status(400).json({ error: 'fecha e id_jaula_destino son obligatorios' });
    }
    if (fecha > hoyISO()) {
      return res.status(400).json({ error: 'La fecha no puede ser futura' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const destino = await getJaula(client, id_jaula_destino, req.granjaId);
      if (!destino) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Jaula destino inválida en esta granja' });
      }

      let animalIds = Array.isArray(ids_animales) ? ids_animales.map(Number) : [];
      if (id_jaula_origen_completa) {
        const { rows } = await client.query(
          `SELECT an.id FROM animales an
           JOIN jaulas j ON j.id = an.id_jaula
           JOIN areas a ON a.id = j.id_area
           WHERE j.id = $1 AND a.id_granja = $2 AND an.estado = 'activo'`,
          [id_jaula_origen_completa, req.granjaId]
        );
        animalIds = rows.map((r) => r.id);
      }
      if (!animalIds.length) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Seleccione al menos un animal' });
      }

      const { rows: animales } = await client.query(
        `SELECT an.*, c.nombre AS categoria, c.proposito_area
         FROM animales an
         LEFT JOIN categorias c ON c.id = an.id_categoria
         WHERE an.id = ANY($1::int[]) AND an.id_granja = $2 AND an.estado = 'activo'`,
        [animalIds, req.granjaId]
      );
      if (animales.length !== animalIds.length) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Algunos animales no están activos en esta granja' });
      }

      for (const a of animales) {
        if (a.fecha_nacimiento && fecha < String(a.fecha_nacimiento).slice(0, 10)) {
          await client.query('ROLLBACK');
          return res.status(400).json({ error: `Fecha anterior al nacimiento de ${a.codigo}` });
        }
      }

      const nuevaOcupacion = destino.ocupacion + animales.length;
      const excedio =
        destino.capacidad_maxima != null && nuevaOcupacion > destino.capacidad_maxima;
      if (excedio && !confirmar_capacidad) {
        await client.query('ROLLBACK');
        return res.status(409).json({
          error: 'La jaula destino supera su capacidad',
          requiere_confirmacion: 'capacidad',
          ocupacion_actual: destino.ocupacion,
          capacidad_maxima: destino.capacidad_maxima,
          a_mover: animales.length,
        });
      }

      const avisosArea = animales.filter((a) => {
        if (!a.proposito_area) return false;
        if (destino.proposito === 'machos' && a.sexo === 'H') return true;
        if (destino.proposito === 'maternidad' && a.sexo === 'M') return true;
        return a.proposito_area !== destino.proposito;
      });
      if (avisosArea.length && !confirmar_area) {
        await client.query('ROLLBACK');
        return res.status(409).json({
          error: 'Algunos animales no corresponden al propósito del área destino',
          requiere_confirmacion: 'area',
          animales: avisosArea.map((a) => a.codigo),
          proposito_area: destino.proposito,
        });
      }

      const creados = [];
      for (const a of animales) {
        const { rows } = await client.query(
          `INSERT INTO movimientos
            (tipo, id_animal, id_granja_origen, id_granja_destino,
             id_jaula_origen, id_jaula_destino, fecha, motivo,
             excedio_capacidad, aviso_area, created_by)
           VALUES ('traslado',$1,$2,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
          [
            a.id,
            req.granjaId,
            a.id_jaula,
            id_jaula_destino,
            fecha,
            motivo || null,
            excedio,
            avisosArea.some((x) => x.id === a.id),
            req.user.id,
          ]
        );
        await client.query(`UPDATE animales SET id_jaula = $1, updated_at = NOW() WHERE id = $2`, [
          id_jaula_destino,
          a.id,
        ]);
        creados.push(rows[0]);
      }

      await client.query('COMMIT');
      res.status(201).json({
        trasladados: creados.length,
        excedio_capacidad: excedio,
        movimientos: creados,
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  })
);

// NUC-20
router.post(
  '/transferencia',
  requireRoles('superadmin', 'admin', 'supervisor'),
  asyncHandler(async (req, res) => {
    const { fecha, id_granja_destino, id_jaula_destino, ids_animales, motivo } = req.body || {};
    if (!fecha || !id_granja_destino || !id_jaula_destino || !ids_animales?.length) {
      return res.status(400).json({
        error: 'fecha, id_granja_destino, id_jaula_destino e ids_animales son obligatorios',
      });
    }

    const enAlcance =
      req.user.rol === 'superadmin' ||
      (req.userFarms || []).some((g) => Number(g.id) === Number(id_granja_destino));
    if (!enAlcance) {
      return res.status(403).json({ error: 'Sin alcance en la granja destino' });
    }

    const origen = await pool.query(`SELECT id, id_especie FROM granjas WHERE id = $1`, [
      req.granjaId,
    ]);
    const dest = await pool.query(
      `SELECT id, id_especie FROM granjas WHERE id = $1 AND activa = true`,
      [id_granja_destino]
    );
    if (!origen.rows[0] || !dest.rows[0]) {
      return res.status(400).json({ error: 'Granja origen o destino inválida' });
    }
    if (origen.rows[0].id_especie !== dest.rows[0].id_especie) {
      return res.status(400).json({
        error: 'Solo se permite transferir entre granjas de la misma especie',
      });
    }
    if (Number(id_granja_destino) === Number(req.granjaId)) {
      return res.status(400).json({ error: 'Use traslado interno dentro de la misma granja' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const jaulaDest = await getJaula(client, id_jaula_destino, id_granja_destino);
      if (!jaulaDest) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Jaula destino inválida' });
      }

      const animalIds = ids_animales.map(Number);
      const { rows: animales } = await client.query(
        `SELECT * FROM animales WHERE id = ANY($1::int[]) AND id_granja = $2 AND estado = 'activo'`,
        [animalIds, req.granjaId]
      );
      if (animales.length !== animalIds.length) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Algunos animales no están activos en origen' });
      }

      for (const a of animales) {
        const clash = await client.query(
          `SELECT id FROM animales WHERE id_granja = $1 AND codigo_norm = $2 AND id <> $3`,
          [id_granja_destino, a.codigo_norm, a.id]
        );
        if (clash.rows[0]) {
          await client.query('ROLLBACK');
          return res.status(409).json({
            error: `El código ${a.codigo} ya existe en la granja destino`,
            codigo: a.codigo,
          });
        }
      }

      const creados = [];
      for (const a of animales) {
        const { rows } = await client.query(
          `INSERT INTO movimientos
            (tipo, id_animal, id_granja_origen, id_granja_destino,
             id_jaula_origen, id_jaula_destino, fecha, motivo, created_by)
           VALUES ('transferencia',$1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
          [
            a.id,
            req.granjaId,
            id_granja_destino,
            a.id_jaula,
            id_jaula_destino,
            fecha,
            motivo || null,
            req.user.id,
          ]
        );
        await client.query(
          `UPDATE animales SET id_granja = $1, id_jaula = $2, updated_at = NOW() WHERE id = $3`,
          [id_granja_destino, id_jaula_destino, a.id]
        );
        creados.push(rows[0]);
      }

      await client.query('COMMIT');
      res.status(201).json({ transferidos: creados.length, movimientos: creados });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  })
);

// NUC-15
router.get(
  '/animal/:id_animal',
  asyncHandler(async (req, res) => {
    const { rows } = await pool.query(
      `SELECT m.*,
              jo.codigo AS jaula_origen, ao.nombre AS area_origen,
              jd.codigo AS jaula_destino, ad.nombre AS area_destino,
              go.nombre AS granja_origen, gd.nombre AS granja_destino
       FROM movimientos m
       LEFT JOIN jaulas jo ON jo.id = m.id_jaula_origen
       LEFT JOIN areas ao ON ao.id = jo.id_area
       LEFT JOIN jaulas jd ON jd.id = m.id_jaula_destino
       LEFT JOIN areas ad ON ad.id = jd.id_area
       LEFT JOIN granjas go ON go.id = m.id_granja_origen
       LEFT JOIN granjas gd ON gd.id = m.id_granja_destino
       WHERE m.id_animal = $1
         AND (m.id_granja_origen = $2 OR m.id_granja_destino = $2)
       ORDER BY m.fecha DESC, m.id DESC`,
      [req.params.id_animal, req.granjaId]
    );
    res.json(rows);
  })
);

router.get(
  '/jaula/:id_jaula',
  asyncHandler(async (req, res) => {
    const fecha = req.query.fecha || hoyISO();
    const idJaula = Number(req.params.id_jaula);

    const jaulaOk = await pool.query(
      `SELECT j.id, j.codigo, a.nombre AS area
       FROM jaulas j JOIN areas a ON a.id = j.id_area
       WHERE j.id = $1 AND a.id_granja = $2`,
      [idJaula, req.granjaId]
    );
    if (!jaulaOk.rows[0]) {
      return res.status(404).json({ error: 'Jaula no encontrada' });
    }

    // Ocupación "hoy": animales activos en la jaula
    const actuales = await pool.query(
      `SELECT an.id, an.codigo, an.sexo, an.estado, c.nombre AS categoria
       FROM animales an
       LEFT JOIN categorias c ON c.id = an.id_categoria
       JOIN jaulas j ON j.id = an.id_jaula
       JOIN areas a ON a.id = j.id_area
       WHERE j.id = $1 AND a.id_granja = $2 AND an.estado = 'activo'
       ORDER BY an.codigo`,
      [idJaula, req.granjaId]
    );

    // Ocupación a una fecha: última jaula conocida por animal vía movimientos ≤ fecha
    // + animales sin movimientos creados/asignados ≤ fecha que siguen en esta jaula
    const enFecha = await pool.query(
      `WITH ultimos AS (
         SELECT DISTINCT ON (m.id_animal)
                m.id_animal, m.id_jaula_destino, m.fecha
         FROM movimientos m
         WHERE m.fecha <= $2::date
           AND (m.id_granja_origen = $3 OR m.id_granja_destino = $3)
         ORDER BY m.id_animal, m.fecha DESC, m.id DESC
       )
       SELECT an.id, an.codigo, an.sexo, an.estado, c.nombre AS categoria
       FROM animales an
       LEFT JOIN categorias c ON c.id = an.id_categoria
       LEFT JOIN ultimos u ON u.id_animal = an.id
       WHERE (
           (u.id_jaula_destino = $1)
           OR (
             u.id_animal IS NULL
             AND an.id_jaula = $1
             AND COALESCE(an.fecha_nacimiento, an.created_at::date) <= $2::date
           )
         )
         AND (an.estado = 'activo' OR COALESCE(an.fecha_baja, '9999-12-31'::date) > $2::date)
         AND (
           EXISTS (
             SELECT 1 FROM movimientos mx
             WHERE mx.id_animal = an.id
               AND (mx.id_granja_origen = $3 OR mx.id_granja_destino = $3)
           )
           OR an.id_granja = $3
         )
       ORDER BY an.codigo`,
      [idJaula, fecha, req.granjaId]
    );

    const historial = await pool.query(
      `SELECT m.*, an.codigo,
              jo.codigo AS jaula_origen, ao.nombre AS area_origen,
              jd.codigo AS jaula_destino, ad.nombre AS area_destino
       FROM movimientos m
       JOIN animales an ON an.id = m.id_animal
       LEFT JOIN jaulas jo ON jo.id = m.id_jaula_origen
       LEFT JOIN areas ao ON ao.id = jo.id_area
       LEFT JOIN jaulas jd ON jd.id = m.id_jaula_destino
       LEFT JOIN areas ad ON ad.id = jd.id_area
       WHERE (m.id_jaula_origen = $1 OR m.id_jaula_destino = $1)
         AND m.fecha <= $2
         AND (m.id_granja_origen = $3 OR m.id_granja_destino = $3)
       ORDER BY m.fecha DESC, m.id DESC
       LIMIT 100`,
      [idJaula, fecha, req.granjaId]
    );

    res.json({
      fecha,
      jaula: jaulaOk.rows[0],
      actuales: actuales.rows,
      en_fecha: enFecha.rows,
      historial: historial.rows,
    });
  })
);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { rows } = await pool.query(
      `SELECT m.*, an.codigo,
              jo.codigo AS jaula_origen, jd.codigo AS jaula_destino
       FROM movimientos m
       JOIN animales an ON an.id = m.id_animal
       LEFT JOIN jaulas jo ON jo.id = m.id_jaula_origen
       LEFT JOIN jaulas jd ON jd.id = m.id_jaula_destino
       WHERE m.id_granja_origen = $1 OR m.id_granja_destino = $1
       ORDER BY m.fecha DESC, m.id DESC
       LIMIT 200`,
      [req.granjaId]
    );
    res.json(rows);
  })
);

// NUC-18
router.get(
  '/sobrecupo',
  asyncHandler(async (req, res) => {
    const { rows } = await pool.query(
      `SELECT j.id, j.codigo, j.capacidad_maxima, a.nombre AS area,
              COUNT(an.id)::int AS ocupacion
       FROM jaulas j
       JOIN areas a ON a.id = j.id_area
       LEFT JOIN animales an ON an.id_jaula = j.id AND an.estado = 'activo'
       WHERE a.id_granja = $1 AND j.activa = true AND j.capacidad_maxima IS NOT NULL
       GROUP BY j.id, j.codigo, j.capacidad_maxima, a.nombre
       HAVING COUNT(an.id) > j.capacidad_maxima
       ORDER BY a.nombre, j.codigo`,
      [req.granjaId]
    );
    res.json(rows);
  })
);

// NUC-19
router.get(
  '/fuera-de-area',
  asyncHandler(async (req, res) => {
    const { rows } = await pool.query(
      `SELECT an.id, an.codigo, an.sexo, c.nombre AS categoria, c.proposito_area,
              a.nombre AS area, a.proposito AS proposito_actual, j.codigo AS jaula
       FROM animales an
       LEFT JOIN categorias c ON c.id = an.id_categoria
       JOIN jaulas j ON j.id = an.id_jaula
       JOIN areas a ON a.id = j.id_area
       WHERE an.id_granja = $1 AND an.estado = 'activo'
         AND c.proposito_area IS NOT NULL
         AND c.proposito_area <> a.proposito
       ORDER BY a.nombre, an.codigo`,
      [req.granjaId]
    );
    res.json(rows);
  })
);

module.exports = router;
