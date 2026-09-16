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

// Mortalidad / bajas
router.post(
  '/',
  canWrite,
  asyncHandler(async (req, res) => {
    const { id_animal, fecha, clasificacion, categoria, cantidad, causa, id_jaula } = req.body || {};
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
          error: `cantidad (${cant}) supera la población disponible de la categoría (${disponible})`,
          campo: 'cantidad',
          disponible,
        });
      }
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
          cant,
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
      await writeAudit({
        userId: req.user.id,
        granjaId: req.granjaId,
        accion: 'crear',
        entidad: 'mortalidad',
        idEntidad: rows[0].id,
        despues: rows[0],
        detalle: `Mortalidad de ${cant} ${categoria || (id_animal ? `animal ${id_animal}` : 'animales')}`,
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
