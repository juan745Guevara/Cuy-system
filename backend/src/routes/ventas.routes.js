const express = require('express');
const { pool } = require('../config/database');
const { asyncHandler, isValidDateStr, esFechaFutura } = require('../utils/helpers');
const { writeAudit } = require('../utils/audit');
const { authRequired, loadUserFarms, requireFarmAccess, requireRoles } = require('../middleware/auth');

const router = express.Router();
router.use(authRequired, loadUserFarms, requireFarmAccess);
const canWrite = requireRoles('superadmin', 'admin', 'encargado', 'auxiliar');

async function pobCategoria(granjaId, categoria) {
  if (!categoria) {
    const { rows } = await pool.query(
      `SELECT COUNT(*)::int AS n FROM animales WHERE id_granja=$1 AND estado='activo'`,
      [granjaId]
    );
    return rows[0].n;
  }
  const { rows } = await pool.query(
    `SELECT COUNT(*)::int AS n FROM animales a
     LEFT JOIN categorias c ON c.id = a.id_categoria
     WHERE a.id_granja=$1 AND a.estado='activo'
       AND LOWER(COALESCE(c.nombre,'')) = LOWER($2)`,
    [granjaId, categoria]
  );
  return rows[0].n;
}

// Ventas / descartes
router.post(
  '/',
  canWrite,
  asyncHandler(async (req, res) => {
    const { id_animal, fecha, clasificacion, categoria, cantidad, comprador, precio } =
      req.body || {};
    if (!fecha || !cantidad) {
      return res.status(400).json({ error: 'fecha y cantidad son obligatorios' });
    }
    if (!isValidDateStr(fecha)) {
      return res.status(400).json({ error: 'fecha inválida', campo: 'fecha' });
    }
    if (esFechaFutura(fecha)) {
      return res.status(400).json({ error: 'fecha no puede ser futura', campo: 'fecha' });
    }
    const cant = Number(cantidad);
    if (!Number.isFinite(cant) || cant <= 0) {
      return res.status(400).json({ error: 'cantidad debe ser mayor que cero', campo: 'cantidad' });
    }

    if (!id_animal) {
      const disponible = await pobCategoria(req.granjaId, categoria);
      if (cant > disponible) {
        return res.status(400).json({
          error: `cantidad (${cant}) supera la población disponible (${disponible})`,
          campo: 'cantidad',
          disponible,
        });
      }
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query(
        `INSERT INTO ventas
          (id_granja, id_animal, fecha, clasificacion, categoria, cantidad, comprador, precio, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
        [
          req.granjaId,
          id_animal || null,
          fecha,
          clasificacion || null,
          categoria || null,
          cant,
          comprador || null,
          precio || null,
          req.user.id,
        ]
      );
      if (id_animal) {
        await client.query(
          `UPDATE animales SET estado = 'baja_venta', fecha_baja = $1,
             motivo_baja = 'Venta', updated_at = NOW()
           WHERE id = $2 AND id_granja = $3`,
          [fecha, id_animal, req.granjaId]
        );
      }
      await client.query('COMMIT');
      await writeAudit({
        userId: req.user.id,
        granjaId: req.granjaId,
        accion: 'crear',
        entidad: 'venta',
        idEntidad: rows[0].id,
        despues: rows[0],
        detalle: `Venta de ${cant} ${categoria || (id_animal ? `animal ${id_animal}` : 'animales')}`,
      });
      res.status(201).json(rows[0]);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  })
);

// Descartes marcados desde ranking, agrupados para venta
router.get(
  '/descartes',
  asyncHandler(async (req, res) => {
    const { rows } = await pool.query(
      `SELECT c.nombre AS categoria,
              COUNT(*)::int AS cantidad,
              COALESCE(json_agg(an.id ORDER BY an.codigo), '[]') AS id_animales
       FROM animales an
       LEFT JOIN categorias c ON c.id = an.id_categoria
       WHERE an.id_granja = $1 AND an.estado = 'descarte'
       GROUP BY c.nombre
       ORDER BY c.nombre`,
      [req.granjaId]
    );
    res.json(rows);
  })
);

// Registrar venta de un grupo de descartes (estado 'descarte')
router.post(
  '/descartes',
  canWrite,
  asyncHandler(async (req, res) => {
    const { fecha, comprador, precio, id_animales } = req.body || {};
    if (!fecha) return res.status(400).json({ error: 'fecha es obligatoria', campo: 'fecha' });
    if (!Array.isArray(id_animales) || !id_animales.length) {
      return res.status(400).json({ error: 'id_animales[] es obligatorio', campo: 'id_animales' });
    }
    if (!isValidDateStr(fecha)) {
      return res.status(400).json({ error: 'fecha inválida', campo: 'fecha' });
    }
    if (esFechaFutura(fecha)) {
      return res.status(400).json({ error: 'fecha no puede ser futura', campo: 'fecha' });
    }
    const ids = [...new Set(id_animales.map(Number).filter((n) => Number.isFinite(n)))];

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows: animales } = await client.query(
        `SELECT id, codigo, estado FROM animales
         WHERE id_granja = $1 AND id = ANY($2::int[])`,
        [req.granjaId, ids]
      );
      const noDescarte = animales.filter((a) => a.estado !== 'descarte');
      if (noDescarte.length) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          error: 'Hay animales que no están marcados como descarte',
          animales: noDescarte.map((a) => a.codigo),
        });
      }
      const creados = [];
      for (const a of animales) {
        const { rows } = await client.query(
          `INSERT INTO ventas
            (id_granja, id_animal, fecha, clasificacion, cantidad, comprador, precio, created_by)
           VALUES ($1,$2,$3,'descarte',1,$4,$5,$6) RETURNING *`,
          [req.granjaId, a.id, fecha, comprador || null, precio || null, req.user.id]
        );
        await client.query(
          `UPDATE animales SET estado='baja_venta', fecha_baja=$2,
               motivo_baja='Venta de descarte agrupado', updated_at=NOW()
           WHERE id=$1`,
          [a.id, fecha]
        );
        creados.push(rows[0]);
      }
      await client.query('COMMIT');
      await writeAudit({
        userId: req.user.id,
        granjaId: req.granjaId,
        accion: 'crear',
        entidad: 'venta',
        idEntidad: creados[0]?.id,
        despues: creados,
        detalle: `Venta agrupada de ${creados.length} descartes`,
      });
      res.status(201).json({ registradas: creados.length, ventas: creados });
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
      `SELECT * FROM ventas WHERE id_granja = $1 ORDER BY fecha DESC`,
      [req.granjaId]
    );
    res.json(rows);
  })
);

module.exports = router;
