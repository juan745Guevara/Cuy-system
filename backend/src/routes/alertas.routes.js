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
const canAdmin = requireRoles('superadmin', 'admin', 'supervisor');

const DEFAULTS = [
  { tipo: 'parto_proximo', dias: 67, activo: true },
  { tipo: 'destete_pendiente', dias: 14, activo: true },
  { tipo: 'empadre_disponible', dias: 7, activo: true },
  { tipo: 'sin_prenez', dias: 30, activo: true },
];

async function getConfig(granjaId) {
  const { rows } = await pool.query(
    `SELECT * FROM alerta_config WHERE id_granja = $1`,
    [granjaId]
  );
  if (!rows.length) {
    for (const d of DEFAULTS) {
      await pool.query(
        `INSERT INTO alerta_config (id_granja, tipo, dias, activo)
         VALUES ($1,$2,$3,$4) ON CONFLICT (id_granja, tipo) DO NOTHING`,
        [granjaId, d.tipo, d.dias, d.activo]
      );
    }
    const again = await pool.query(`SELECT * FROM alerta_config WHERE id_granja = $1`, [
      granjaId,
    ]);
    return again.rows;
  }
  return rows;
}

function addDays(fecha, dias) {
  const d = new Date(`${String(fecha).slice(0, 10)}T00:00:00`);
  d.setDate(d.getDate() + Number(dias));
  return d.toISOString().slice(0, 10);
}

function hoyISO() {
  return new Date().toISOString().slice(0, 10);
}

// NUC-35 / CUY-17
router.get(
  '/config',
  asyncHandler(async (req, res) => {
    res.json(await getConfig(req.granjaId));
  })
);

router.put(
  '/config',
  canAdmin,
  asyncHandler(async (req, res) => {
    const items = Array.isArray(req.body) ? req.body : req.body?.items;
    if (!Array.isArray(items)) {
      return res.status(400).json({ error: 'Envíe un arreglo de configuraciones' });
    }
    for (const it of items) {
      await pool.query(
        `INSERT INTO alerta_config (id_granja, tipo, dias, activo)
         VALUES ($1,$2,$3,$4)
         ON CONFLICT (id_granja, tipo)
         DO UPDATE SET dias = EXCLUDED.dias, activo = EXCLUDED.activo`,
        [req.granjaId, it.tipo, Number(it.dias) || 0, it.activo !== false]
      );
    }
    res.json(await getConfig(req.granjaId));
  })
);

// NUC-33 / CUY-18 — alertas calculadas
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const config = await getConfig(req.granjaId);
    const byTipo = Object.fromEntries(config.map((c) => [c.tipo, c]));
    const hoy = hoyISO();
    const alertas = [];

    const descartes = await pool.query(
      `SELECT tipo, id_animal, id_referencia FROM alertas_descarte WHERE id_granja = $1`,
      [req.granjaId]
    );
    const descartado = (tipo, idAnimal, idRef) =>
      descartes.rows.some(
        (d) =>
          d.tipo === tipo &&
          Number(d.id_animal || 0) === Number(idAnimal || 0) &&
          Number(d.id_referencia || 0) === Number(idRef || 0)
      );

    // Parto próximo: empadre abierto + gestación
    const gest = byTipo.parto_proximo;
    if (gest?.activo) {
      const { rows } = await pool.query(
        `SELECT eh.id_hembra, eh.id_empadre, e.fecha_empadre, an.codigo, j.codigo AS jaula
         FROM empadre_hembras eh
         JOIN empadres e ON e.id = eh.id_empadre
         JOIN animales an ON an.id = eh.id_hembra
         LEFT JOIN jaulas j ON j.id = an.id_jaula
         WHERE e.id_granja = $1 AND eh.resultado = 'abierto' AND an.estado = 'activo'`,
        [req.granjaId]
      );
      for (const r of rows) {
        if (descartado('parto_proximo', r.id_hembra, r.id_empadre)) continue;
        const prevista = addDays(r.fecha_empadre, gest.dias);
        alertas.push({
          key: `parto_proximo-${r.id_hembra}-${r.id_empadre}`,
          tipo: 'parto_proximo',
          id_animal: r.id_hembra,
          id_referencia: r.id_empadre,
          codigo: r.codigo,
          jaula: r.jaula,
          fecha_prevista: prevista,
          vencida: prevista < hoy,
          ruta: '/partos',
          mensaje: `Parto próximo de ${r.codigo}`,
        });
      }
    }

    // Destete pendiente
    const dest = byTipo.destete_pendiente;
    if (dest?.activo) {
      const { rows } = await pool.query(
        `SELECT p.id, p.id_hembra, p.fecha_parto, an.codigo, j.codigo AS jaula
         FROM partos p
         JOIN animales an ON an.id = p.id_hembra
         LEFT JOIN jaulas j ON j.id = an.id_jaula
         WHERE p.id_granja = $1
           AND NOT EXISTS (SELECT 1 FROM destetes d WHERE d.id_parto = p.id)`,
        [req.granjaId]
      );
      for (const r of rows) {
        if (descartado('destete_pendiente', r.id_hembra, r.id)) continue;
        const prevista = addDays(r.fecha_parto, dest.dias);
        alertas.push({
          key: `destete_pendiente-${r.id}`,
          tipo: 'destete_pendiente',
          id_animal: r.id_hembra,
          id_referencia: r.id,
          codigo: r.codigo,
          jaula: r.jaula,
          fecha_prevista: prevista,
          vencida: prevista < hoy,
          ruta: '/destetes',
          mensaje: `Destete pendiente de camada de ${r.codigo}`,
        });
      }
    }

    alertas.sort((a, b) => String(a.fecha_prevista).localeCompare(String(b.fecha_prevista)));
    res.json({
      pendientes: alertas,
      vencidas: alertas.filter((a) => a.vencida),
      proximas: alertas.filter((a) => !a.vencida),
    });
  })
);

// NUC-34
router.post(
  '/descartar',
  requireRoles('superadmin', 'admin', 'encargado', 'supervisor', 'auxiliar'),
  asyncHandler(async (req, res) => {
    const { tipo, id_animal, id_referencia, motivo } = req.body || {};
    if (!tipo) return res.status(400).json({ error: 'tipo es obligatorio' });
    const { rows } = await pool.query(
      `INSERT INTO alertas_descarte (id_granja, tipo, id_animal, id_referencia, motivo, created_by)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [
        req.granjaId,
        tipo,
        id_animal || null,
        id_referencia || null,
        motivo || null,
        req.user.id,
      ]
    );
    res.status(201).json(rows[0]);
  })
);

module.exports = router;
