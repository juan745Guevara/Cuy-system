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
const canWrite = requireRoles('superadmin', 'admin', 'encargado', 'supervisor');

const DEFAULT_CFG = {
  peso_partos: 20,
  peso_camada: 25,
  peso_destete: 20,
  peso_mortalidad: 15,
  peso_peso_nac: 10,
  peso_peso_dest: 10,
  peso_prenez_macho: 30,
};

async function getCfg(granjaId) {
  const { rows } = await pool.query(
    `SELECT * FROM ranking_config WHERE id_granja = $1`,
    [granjaId]
  );
  if (rows[0]) return rows[0];
  const inserted = await pool.query(
    `INSERT INTO ranking_config (id_granja) VALUES ($1) RETURNING *`,
    [granjaId]
  );
  return inserted.rows[0];
}

// CUY-20
router.get(
  '/config',
  asyncHandler(async (req, res) => {
    res.json(await getCfg(req.granjaId));
  })
);

router.put(
  '/config',
  canAdmin,
  asyncHandler(async (req, res) => {
    const b = { ...DEFAULT_CFG, ...(req.body || {}) };
    const { rows } = await pool.query(
      `INSERT INTO ranking_config
        (id_granja, peso_partos, peso_camada, peso_destete, peso_mortalidad,
         peso_peso_nac, peso_peso_dest, peso_prenez_macho, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW())
       ON CONFLICT (id_granja) DO UPDATE SET
         peso_partos = EXCLUDED.peso_partos,
         peso_camada = EXCLUDED.peso_camada,
         peso_destete = EXCLUDED.peso_destete,
         peso_mortalidad = EXCLUDED.peso_mortalidad,
         peso_peso_nac = EXCLUDED.peso_peso_nac,
         peso_peso_dest = EXCLUDED.peso_peso_dest,
         peso_prenez_macho = EXCLUDED.peso_prenez_macho,
         updated_at = NOW()
       RETURNING *`,
      [
        req.granjaId,
        b.peso_partos,
        b.peso_camada,
        b.peso_destete,
        b.peso_mortalidad,
        b.peso_peso_nac,
        b.peso_peso_dest,
        b.peso_prenez_macho,
      ]
    );
    res.json(rows[0]);
  })
);

// CUY-19
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const sexo = req.query.sexo || 'H';
    const cfg = await getCfg(req.granjaId);

    if (sexo === 'H') {
      const { rows } = await pool.query(
        `SELECT an.id, an.codigo, r.nombre AS raza, c.nombre AS categoria,
                COUNT(p.id)::int AS partos,
                COALESCE(AVG(p.vivos_m + p.vivos_h),0)::numeric(10,2) AS camada_promedio,
                COALESCE(AVG(
                  (SELECT COALESCE(SUM(d.destetados_m+d.destetados_h),0) FROM destetes d WHERE d.id_parto = p.id)
                ),0)::numeric(10,2) AS destete_promedio,
                COALESCE(AVG(
                  (SELECT COALESCE(SUM(d.muertos),0) FROM destetes d WHERE d.id_parto = p.id)
                ),0)::numeric(10,2) AS mortalidad_camada,
                COALESCE(AVG(
                  (COALESCE(p.peso_m1,0)+COALESCE(p.peso_m2,0)+COALESCE(p.peso_m3,0)
                   +COALESCE(p.peso_h1,0)+COALESCE(p.peso_h2,0)+COALESCE(p.peso_h3,0))
                  / NULLIF((p.vivos_m+p.vivos_h),0)
                ),0)::numeric(10,2) AS peso_nac_promedio
         FROM animales an
         LEFT JOIN razas r ON r.id = an.id_raza
         LEFT JOIN categorias c ON c.id = an.id_categoria
         LEFT JOIN partos p ON p.id_hembra = an.id
         WHERE an.id_granja = $1 AND an.sexo = 'H' AND an.estado = 'activo'
         GROUP BY an.id, an.codigo, r.nombre, c.nombre
         ORDER BY an.codigo`,
        [req.granjaId]
      );

      const ranked = rows.map((row) => {
        const insuficientes = row.partos < 2;
        const score = insuficientes
          ? null
          : Number(row.partos) * Number(cfg.peso_partos) +
            Number(row.camada_promedio) * Number(cfg.peso_camada) +
            Number(row.destete_promedio) * Number(cfg.peso_destete) -
            Number(row.mortalidad_camada) * Number(cfg.peso_mortalidad) +
            Number(row.peso_nac_promedio) * Number(cfg.peso_peso_nac);
        return {
          ...row,
          puntaje: score == null ? null : Number(score.toFixed(2)),
          datos_insuficientes: insuficientes,
        };
      });
      ranked.sort((a, b) => {
        if (a.datos_insuficientes !== b.datos_insuficientes) {
          return a.datos_insuficientes ? 1 : -1;
        }
        return (b.puntaje || 0) - (a.puntaje || 0);
      });
      return res.json({ sexo: 'H', config: cfg, ranking: ranked });
    }

    // Machos
    const { rows } = await pool.query(
      `SELECT an.id, an.codigo, r.nombre AS raza, c.nombre AS categoria,
              COUNT(DISTINCT e.id)::int AS empadres,
              COUNT(DISTINCT eh.id_hembra)::int AS hembras,
              COUNT(DISTINCT eh.id_hembra) FILTER (WHERE eh.resultado = 'prenez')::int AS prenadas,
              COALESCE(AVG(p.vivos_m + p.vivos_h),0)::numeric(10,2) AS camada_promedio
       FROM animales an
       LEFT JOIN razas r ON r.id = an.id_raza
       LEFT JOIN categorias c ON c.id = an.id_categoria
       LEFT JOIN empadres e ON e.id_macho = an.id
       LEFT JOIN empadre_hembras eh ON eh.id_empadre = e.id
       LEFT JOIN partos p ON p.id_empadre = e.id
       WHERE an.id_granja = $1 AND an.sexo = 'M' AND an.estado = 'activo'
       GROUP BY an.id, an.codigo, r.nombre, c.nombre
       ORDER BY an.codigo`,
      [req.granjaId]
    );

    const ranked = rows.map((row) => {
      const insuficientes = row.empadres < 2;
      const pctPrenez =
        row.hembras > 0 ? (100 * Number(row.prenadas)) / Number(row.hembras) : 0;
      const score = insuficientes
        ? null
        : pctPrenez * Number(cfg.peso_prenez_macho) +
          Number(row.camada_promedio) * Number(cfg.peso_camada) +
          Number(row.empadres) * Number(cfg.peso_partos);
      return {
        ...row,
        pct_prenez: Number(pctPrenez.toFixed(1)),
        puntaje: score == null ? null : Number(score.toFixed(2)),
        datos_insuficientes: insuficientes,
      };
    });
    ranked.sort((a, b) => {
      if (a.datos_insuficientes !== b.datos_insuficientes) {
        return a.datos_insuficientes ? 1 : -1;
      }
      return (b.puntaje || 0) - (a.puntaje || 0);
    });
    res.json({ sexo: 'M', config: cfg, ranking: ranked });
  })
);

// CUY-21
router.post(
  '/:id_animal/marcar',
  canWrite,
  asyncHandler(async (req, res) => {
    const { accion } = req.body || {};
    if (!['descarte', 'reemplazo'].includes(accion)) {
      return res.status(400).json({ error: 'accion debe ser descarte o reemplazo' });
    }

    const animal = await pool.query(
      `SELECT * FROM animales WHERE id = $1 AND id_granja = $2`,
      [req.params.id_animal, req.granjaId]
    );
    if (!animal.rows[0]) return res.status(404).json({ error: 'Animal no encontrado' });

    if (accion === 'descarte') {
      const { rows } = await pool.query(
        `UPDATE animales
         SET estado = 'descarte', fecha_baja = CURRENT_DATE,
             motivo_baja = 'Marcado desde ranking', updated_at = NOW()
         WHERE id = $1 RETURNING *`,
        [req.params.id_animal]
      );
      await pool.query(
        `INSERT INTO animal_particularidades (id_animal, texto, created_by)
         VALUES ($1, $2, $3)`,
        [req.params.id_animal, 'Marcado para descarte desde ranking', req.user.id]
      );
      return res.json(rows[0]);
    }

    // reemplazo: buscar categoría reemplazo
    const cat = await pool.query(
      `SELECT c.id FROM categorias c
       JOIN granjas g ON g.id_especie = c.id_especie
       WHERE g.id = $1 AND LOWER(c.nombre) LIKE '%reemplazo%'
       LIMIT 1`,
      [req.granjaId]
    );
    const { rows } = await pool.query(
      `UPDATE animales
       SET id_categoria = COALESCE($1, id_categoria), updated_at = NOW()
       WHERE id = $2 RETURNING *`,
      [cat.rows[0]?.id || null, req.params.id_animal]
    );
    await pool.query(
      `INSERT INTO animal_particularidades (id_animal, texto, created_by)
       VALUES ($1, $2, $3)`,
      [req.params.id_animal, 'Marcado como reemplazo desde ranking', req.user.id]
    );
    res.json(rows[0]);
  })
);

module.exports = router;
