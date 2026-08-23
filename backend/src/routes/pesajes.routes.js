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

const RANGOS_DEFAULT = {
  gazapo: { min: 50, max: 250 },
  destete: { min: 150, max: 450 },
  recria: { min: 300, max: 900 },
  reproductora: { min: 700, max: 1600 },
  reproductor: { min: 800, max: 1800 },
  default: { min: 50, max: 2000 },
};

/** Límites absolutos de la especie (rechazo duro NUC-21) */
const ESPECIE_ABS = { min: 20, max: 3000 };

let RANGOS = { ...RANGOS_DEFAULT };

function rangoPara(nombre) {
  if (!nombre) return RANGOS.default;
  const n = String(nombre).toLowerCase();
  if (n.includes('gazapo') || n.includes('cria') || n.includes('cría')) return RANGOS.gazapo;
  if (n.includes('destete')) return RANGOS.destete;
  if (n.includes('recr') || n.includes('reemplazo')) return RANGOS.recria;
  if (n.includes('reproductora')) return RANGOS.reproductora;
  if (n.includes('reproductor')) return RANGOS.reproductor;
  return RANGOS.default;
}

function hoyISO() {
  return new Date().toISOString().slice(0, 10);
}

async function insertPesaje(client, { granjaId, animalId, fecha, peso, userId, confirmar }) {
  if (!fecha || peso == null) {
    const err = new Error('fecha y peso_gramos son obligatorios');
    err.status = 400;
    throw err;
  }
  const pesoNum = Number(peso);
  if (!(pesoNum > 0)) {
    const err = new Error('El peso debe ser mayor que cero');
    err.status = 400;
    throw err;
  }
  if (fecha > hoyISO()) {
    const err = new Error('La fecha no puede ser futura');
    err.status = 400;
    throw err;
  }
  // NUC-21: rechazo duro fuera del rango válido de la especie
  if (pesoNum < ESPECIE_ABS.min || pesoNum > ESPECIE_ABS.max) {
    const err = new Error(
      `Peso inválido para la especie (${ESPECIE_ABS.min}-${ESPECIE_ABS.max} g)`
    );
    err.status = 400;
    throw err;
  }

  const { rows } = await client.query(
    `SELECT an.*, c.nombre AS categoria
     FROM animales an LEFT JOIN categorias c ON c.id = an.id_categoria
     WHERE an.id = $1 AND an.id_granja = $2`,
    [animalId, granjaId]
  );
  const animal = rows[0];
  if (!animal) {
    const err = new Error('Animal no encontrado en la granja');
    err.status = 404;
    throw err;
  }

  const rango = rangoPara(animal.categoria);
  const fuera = pesoNum < rango.min || pesoNum > rango.max;
  if (fuera && !confirmar) {
    const err = new Error(
      `Peso fuera del rango esperado (${rango.min}-${rango.max} g) para ${animal.categoria || 'la categoría'}`
    );
    err.status = 409;
    err.payload = { requiere_confirmacion: 'fuera_rango', rango, codigo: animal.codigo };
    throw err;
  }

  const inserted = await client.query(
    `INSERT INTO pesajes (id_granja, id_animal, fecha, peso_gramos, fuera_rango, created_by)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [granjaId, animalId, fecha, pesoNum, fuera, userId]
  );
  return inserted.rows[0];
}

// NUC-21
router.post(
  '/',
  canWrite,
  asyncHandler(async (req, res) => {
    const { id_animal, fecha, peso_gramos, confirmar_fuera_rango } = req.body || {};
    const client = await pool.connect();
    try {
      const row = await insertPesaje(client, {
        granjaId: req.granjaId,
        animalId: Number(id_animal),
        fecha,
        peso: peso_gramos,
        userId: req.user.id,
        confirmar: confirmar_fuera_rango,
      });
      res.status(201).json(row);
    } catch (err) {
      if (err.status === 409) return res.status(409).json({ error: err.message, ...err.payload });
      if (err.status) return res.status(err.status).json({ error: err.message });
      throw err;
    } finally {
      client.release();
    }
  })
);

// NUC-22
router.post(
  '/lote',
  canWrite,
  asyncHandler(async (req, res) => {
    const { fecha, pesajes, confirmar_fuera_rango } = req.body || {};
    if (!fecha || !Array.isArray(pesajes)) {
      return res.status(400).json({ error: 'fecha y pesajes[] son obligatorios' });
    }
    const validos = pesajes.filter((p) => p.id_animal && p.peso_gramos != null && p.peso_gramos !== '');
    if (!validos.length) return res.status(400).json({ error: 'No hay pesos para guardar' });

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const creados = [];
      for (const p of validos) {
        try {
          creados.push(
            await insertPesaje(client, {
              granjaId: req.granjaId,
              animalId: Number(p.id_animal),
              fecha,
              peso: p.peso_gramos,
              userId: req.user.id,
              confirmar: confirmar_fuera_rango || p.confirmar_fuera_rango,
            })
          );
        } catch (err) {
          await client.query('ROLLBACK');
          if (err.status === 409) return res.status(409).json({ error: err.message, ...err.payload });
          if (err.status) return res.status(err.status).json({ error: err.message });
          throw err;
        }
      }
      await client.query('COMMIT');
      res.status(201).json({ registrados: creados.length, pesajes: creados });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  })
);

// NUC-23
router.get(
  '/animal/:id_animal',
  asyncHandler(async (req, res) => {
    const { rows } = await pool.query(
      `SELECT * FROM pesajes WHERE id_animal = $1 AND id_granja = $2
       ORDER BY fecha ASC, id ASC`,
      [req.params.id_animal, req.granjaId]
    );
    res.json(
      rows.map((r, i) => ({
        ...r,
        ganancia_gramos: i > 0 ? Number(r.peso_gramos) - Number(rows[i - 1].peso_gramos) : null,
      }))
    );
  })
);

router.get(
  '/promedio',
  asyncHandler(async (req, res) => {
    const params = [req.granjaId];
    let sql = `
      SELECT p.fecha, AVG(p.peso_gramos)::numeric(10,2) AS promedio, COUNT(*)::int AS n
      FROM pesajes p JOIN animales a ON a.id = p.id_animal
      WHERE p.id_granja = $1`;
    if (req.query.id_jaula) {
      params.push(Number(req.query.id_jaula));
      sql += ` AND a.id_jaula = $${params.length}`;
    }
    if (req.query.id_area) {
      params.push(Number(req.query.id_area));
      sql += ` AND EXISTS (
        SELECT 1 FROM jaulas j WHERE j.id = a.id_jaula AND j.id_area = $${params.length}
      )`;
    }
    sql += ' GROUP BY p.fecha ORDER BY p.fecha';
    const { rows } = await pool.query(sql, params);
    res.json(rows);
  })
);

router.get('/rangos', asyncHandler(async (_req, res) => {
  res.json({ categorias: RANGOS, especie: ESPECIE_ABS });
}));

// CUY-16 — rangos configurables por la unidad
router.put(
  '/rangos',
  requireRoles('superadmin', 'admin', 'encargado'),
  asyncHandler(async (req, res) => {
    const body = req.body || {};
    const next = { ...RANGOS };
    for (const key of Object.keys(RANGOS_DEFAULT)) {
      if (body[key]?.min != null && body[key]?.max != null) {
        const min = Number(body[key].min);
        const max = Number(body[key].max);
        if (!(min > 0) || !(max > min)) {
          return res.status(400).json({ error: `Rango inválido para ${key}` });
        }
        next[key] = { min, max };
      }
    }
    RANGOS = next;
    res.json({ categorias: RANGOS, especie: ESPECIE_ABS });
  })
);

module.exports = router;
