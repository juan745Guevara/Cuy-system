const express = require('express');
const { pool } = require('../config/database');
const { asyncHandler } = require('../utils/helpers');
const { authRequired, loadUserFarms, requireFarmAccess, requireRoles } = require('../middleware/auth');

const router = express.Router();
router.use(authRequired, loadUserFarms, requireFarmAccess);

const canWrite = requireRoles('superadmin', 'admin', 'encargado', 'auxiliar');

async function assertAnimal(granjaId, id, sexo) {
  const { rows } = await pool.query(
    `SELECT * FROM animales WHERE id = $1 AND id_granja = $2 AND estado = 'activo'`,
    [id, granjaId]
  );
  if (!rows[0]) return { error: 'Animal no encontrado o inactivo' };
  if (sexo && rows[0].sexo !== sexo) return { error: `Se esperaba sexo ${sexo}` };
  return { animal: rows[0] };
}

// CUY-06 / CUY-12 — alias sobre animales (hembra/macho reproductor)
router.post(
  '/reproductoras',
  canWrite,
  asyncHandler(async (req, res) => {
    const body = { ...req.body, sexo: 'H' };
    // reutiliza lógica mínima
    req.body = body;
    const { codigo, id_raza, id_categoria, id_jaula, fecha_nacimiento, particularidad } = body;
    if (!codigo) return res.status(400).json({ error: 'codigo obligatorio' });
    const { normalizeCodigo } = require('../utils/helpers');
    const codigoNorm = normalizeCodigo(codigo);
    try {
      const { rows } = await pool.query(
        `INSERT INTO animales
          (id_granja, codigo, codigo_norm, sexo, id_raza, id_categoria, id_jaula, fecha_nacimiento, created_by)
         VALUES ($1,$2,$3,'H',$4,$5,$6,$7,$8) RETURNING *`,
        [
          req.granjaId,
          String(codigo).trim(),
          codigoNorm,
          id_raza || null,
          id_categoria || null,
          id_jaula || null,
          fecha_nacimiento || null,
          req.user.id,
        ]
      );
      if (particularidad) {
        await pool.query(
          `INSERT INTO animal_particularidades (id_animal, texto, created_by) VALUES ($1,$2,$3)`,
          [rows[0].id, particularidad, req.user.id]
        );
      }
      res.status(201).json(rows[0]);
    } catch (err) {
      if (err.code === '23505') return res.status(409).json({ error: 'Código duplicado' });
      throw err;
    }
  })
);

router.post(
  '/reproductores',
  canWrite,
  asyncHandler(async (req, res) => {
    const { codigo, id_raza, id_categoria, id_jaula, fecha_nacimiento, particularidad } = req.body || {};
    if (!codigo) return res.status(400).json({ error: 'codigo obligatorio' });
    const { normalizeCodigo } = require('../utils/helpers');
    const codigoNorm = normalizeCodigo(codigo);
    try {
      const { rows } = await pool.query(
        `INSERT INTO animales
          (id_granja, codigo, codigo_norm, sexo, id_raza, id_categoria, id_jaula, fecha_nacimiento, created_by)
         VALUES ($1,$2,$3,'M',$4,$5,$6,$7,$8) RETURNING *`,
        [
          req.granjaId,
          String(codigo).trim(),
          codigoNorm,
          id_raza || null,
          id_categoria || null,
          id_jaula || null,
          fecha_nacimiento || null,
          req.user.id,
        ]
      );
      if (particularidad) {
        await pool.query(
          `INSERT INTO animal_particularidades (id_animal, texto, created_by) VALUES ($1,$2,$3)`,
          [rows[0].id, particularidad, req.user.id]
        );
      }
      res.status(201).json(rows[0]);
    } catch (err) {
      if (err.code === '23505') return res.status(409).json({ error: 'Código duplicado' });
      throw err;
    }
  })
);

// CUY-07 + CUY-13 — empadre (hembras + macho)
router.post(
  '/',
  canWrite,
  asyncHandler(async (req, res) => {
    const {
      id_macho,
      hembras = [],
      id_jaula,
      fecha_empadre,
      peso_antes,
      peso_despues,
      notas,
    } = req.body || {};
    if (!fecha_empadre || !Array.isArray(hembras) || hembras.length === 0) {
      return res.status(400).json({ error: 'fecha_empadre y hembras[] son obligatorios' });
    }
    if (id_macho) {
      const m = await assertAnimal(req.granjaId, id_macho, 'M');
      if (m.error) return res.status(400).json({ error: m.error });
    }
    for (const hid of hembras) {
      const h = await assertAnimal(req.granjaId, hid, 'H');
      if (h.error) return res.status(400).json({ error: h.error });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query(
        `INSERT INTO empadres
          (id_granja, id_macho, id_jaula, fecha_empadre, peso_antes, peso_despues, notas, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
        [
          req.granjaId,
          id_macho || null,
          id_jaula || null,
          fecha_empadre,
          peso_antes || null,
          peso_despues || null,
          notas || null,
          req.user.id,
        ]
      );
      const emp = rows[0];
      for (const hid of hembras) {
        await client.query(
          `INSERT INTO empadre_hembras (id_empadre, id_hembra) VALUES ($1,$2)`,
          [emp.id, hid]
        );
      }
      await client.query('COMMIT');
      res.status(201).json({ ...emp, hembras });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  })
);

// CUY-10 — resultado vacía/aborto/murió
router.patch(
  '/:id/hembras/:idHembra',
  canWrite,
  asyncHandler(async (req, res) => {
    const { resultado } = req.body || {};
    if (!['prenez', 'vacia', 'aborto', 'murio'].includes(resultado)) {
      return res.status(400).json({ error: 'resultado inválido' });
    }
    const { rows } = await pool.query(
      `UPDATE empadre_hembras eh SET resultado = $1
       FROM empadres e
       WHERE eh.id_empadre = e.id AND e.id = $2 AND eh.id_hembra = $3 AND e.id_granja = $4
       RETURNING eh.*`,
      [resultado, req.params.id, req.params.idHembra, req.granjaId]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Registro no encontrado' });

    if (resultado === 'murio') {
      await pool.query(
        `UPDATE animales SET estado = 'baja_muerte', fecha_baja = CURRENT_DATE,
           motivo_baja = 'Murió en ciclo de empadre', updated_at = NOW()
         WHERE id = $1 AND id_granja = $2`,
        [req.params.idHembra, req.granjaId]
      );
    }
    res.json(rows[0]);
  })
);

// CUY-11 — ficha reproductora
router.get(
  '/reproductoras/:id',
  asyncHandler(async (req, res) => {
    const h = await assertAnimal(req.granjaId, Number(req.params.id), 'H');
    if (h.error) return res.status(404).json({ error: h.error });

    const ciclos = await pool.query(
      `SELECT e.*, eh.resultado,
              (SELECT json_agg(json_build_object(
                 'id', p.id, 'fecha_parto', p.fecha_parto,
                 'vivos_m', p.vivos_m, 'vivos_h', p.vivos_h, 'muertos', p.muertos
               )) FROM partos p WHERE p.id_hembra = eh.id_hembra AND p.id_empadre = e.id) AS partos
       FROM empadre_hembras eh
       JOIN empadres e ON e.id = eh.id_empadre
       WHERE eh.id_hembra = $1 AND e.id_granja = $2
       ORDER BY e.fecha_empadre DESC`,
      [req.params.id, req.granjaId]
    );
    res.json({ animal: h.animal, ciclos: ciclos.rows });
  })
);

module.exports = router;
