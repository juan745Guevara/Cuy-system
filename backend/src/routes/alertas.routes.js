const express = require('express');
const { pool } = require('../config/database');
const { asyncHandler } = require('../utils/helpers');
const { writeAudit } = require('../utils/audit');
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
  { tipo: 'edad_recria', dias: 21, activo: true },
  { tipo: 'edad_empadre', dias: 90, activo: true },
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

// Plazos de alerta configurables
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
    await writeAudit({
      userId: req.user.id,
      granjaId: req.granjaId,
      accion: 'configurar',
      entidad: 'alerta',
      idEntidad: req.granjaId,
      despues: items,
      detalle: `Configuración de ${items.length} alerta(s)`,
    });
    res.json(await getConfig(req.granjaId));
  })
);

// Alertas calculadas del ciclo reproductivo
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

    // Revisión de hembra sin preñez confirmada: empadre abierto sin parto
    const sinP = byTipo.sin_prenez;
    if (sinP?.activo) {
      const { rows } = await pool.query(
        `SELECT eh.id_hembra, eh.id_empadre, e.fecha_empadre, an.codigo, j.codigo AS jaula
         FROM empadre_hembras eh
         JOIN empadres e ON e.id = eh.id_empadre
         JOIN animales an ON an.id = eh.id_hembra
         LEFT JOIN jaulas j ON j.id = an.id_jaula
         LEFT JOIN partos p ON p.id_empadre = e.id AND p.id_hembra = eh.id_hembra
         WHERE e.id_granja = $1 AND eh.resultado = 'abierto' AND an.estado = 'activo'
           AND p.id IS NULL`,
        [req.granjaId]
      );
      for (const r of rows) {
        if (descartado('sin_prenez', r.id_hembra, r.id_empadre)) continue;
        const prevista = addDays(r.fecha_empadre, sinP.dias);
        alertas.push({
          key: `sin_prenez-${r.id_hembra}-${r.id_empadre}`,
          tipo: 'sin_prenez',
          id_animal: r.id_hembra,
          id_referencia: r.id_empadre,
          codigo: r.codigo,
          jaula: r.jaula,
          fecha_prevista: prevista,
          vencida: prevista < hoy,
          ruta: '/reproductoras',
          mensaje: `Revisar preñez de ${r.codigo} (empadre sin confirmar)`,
        });
      }
    }

    // Empadre disponible tras el destete: reproductora sin ciclo abierto
    const empDisp = byTipo.empadre_disponible;
    if (empDisp?.activo) {
      const { rows } = await pool.query(
        `SELECT an.id AS id_hembra, an.codigo, j.codigo AS jaula,
                MAX(COALESCE(p.fecha_parto, e.fecha_empadre)) AS ultimo_evento
         FROM animales an
         LEFT JOIN jaulas j ON j.id = an.id_jaula
         LEFT JOIN categorias c ON c.id = an.id_categoria
         LEFT JOIN empadre_hembras eh ON eh.id_hembra = an.id
         LEFT JOIN empadres e ON e.id = eh.id_empadre
         LEFT JOIN partos p ON p.id_empadre = e.id AND p.id_hembra = an.id
         WHERE an.id_granja = $1 AND an.estado = 'activo' AND an.sexo = 'H'
           AND LOWER(COALESCE(c.nombre,'')) LIKE '%reproductora%'
           AND an.id NOT IN (
             SELECT eh2.id_hembra FROM empadre_hembras eh2
             JOIN empadres e2 ON e2.id = eh2.id_empadre
             WHERE e2.id_granja = $1 AND eh2.resultado = 'abierto'
           )
         GROUP BY an.id, an.codigo, j.codigo
         HAVING MAX(COALESCE(p.fecha_parto, e.fecha_empadre)) IS NOT NULL`,
        [req.granjaId]
      );
      for (const r of rows) {
        if (descartado('empadre_disponible', r.id_hembra, null)) continue;
        const prevista = addDays(r.ultimo_evento, empDisp.dias);
        alertas.push({
          key: `empadre_disponible-${r.id_hembra}`,
          tipo: 'empadre_disponible',
          id_animal: r.id_hembra,
          id_referencia: null,
          codigo: r.codigo,
          jaula: r.jaula,
          fecha_prevista: prevista,
          vencida: prevista < hoy,
          ruta: '/empadres',
          mensaje: `Empadre disponible para ${r.codigo}`,
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

// Descartar alerta
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
    await writeAudit({
      userId: req.user.id,
      granjaId: req.granjaId,
      accion: 'descartar',
      entidad: 'alerta',
      idEntidad: rows[0].id,
      despues: rows[0],
      detalle: `Descarte de alerta ${tipo}${id_animal ? ` para animal ${id_animal}` : ''}`,
    });
    res.status(201).json(rows[0]);
  })
);

module.exports = router;
