const express = require('express');
const { pool } = require('../config/database');
const { asyncHandler, isValidDateStr, todayISO, promedioPesos } = require('../utils/helpers');
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

router.post(
  '/reproductoras',
  canWrite,
  asyncHandler(async (req, res) => {
    const { codigo, id_raza, id_categoria, id_jaula, fecha_nacimiento, particularidad } =
      req.body || {};
    if (!codigo) return res.status(400).json({ error: 'codigo obligatorio' });
    if (!id_jaula) return res.status(400).json({ error: 'jaula es obligatoria', campo: 'id_jaula' });
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
          id_jaula,
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
    const { codigo, id_raza, id_categoria, id_jaula, fecha_nacimiento, particularidad } =
      req.body || {};
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
      cantidad_prenadas,
      notas,
    } = req.body || {};
    if (!fecha_empadre || !Array.isArray(hembras) || hembras.length === 0) {
      return res.status(400).json({ error: 'fecha_empadre y hembras[] son obligatorios' });
    }
    if (!isValidDateStr(fecha_empadre)) {
      return res.status(400).json({ error: 'fecha_empadre inválida', campo: 'fecha_empadre' });
    }
    if (fecha_empadre > todayISO()) {
      return res.status(400).json({ error: 'fecha_empadre no puede ser futura', campo: 'fecha_empadre' });
    }
    const cantPren = cantidad_prenadas != null ? Number(cantidad_prenadas) : null;
    if (cantPren != null && (cantPren < 0 || cantPren > hembras.length)) {
      return res.status(400).json({
        error: 'cantidad de preñadas no puede superar la cantidad de hembras',
        campo: 'cantidad_prenadas',
      });
    }

    if (id_macho) {
      const m = await assertAnimal(req.granjaId, id_macho, 'M');
      if (m.error) return res.status(400).json({ error: m.error });
    }
    for (const hid of hembras) {
      const h = await assertAnimal(req.granjaId, hid, 'H');
      if (h.error) return res.status(400).json({ error: h.error });
      const lastParto = await pool.query(
        `SELECT fecha_parto FROM partos WHERE id_hembra=$1 ORDER BY fecha_parto DESC LIMIT 1`,
        [hid]
      );
      if (lastParto.rows[0] && fecha_empadre < String(lastParto.rows[0].fecha_parto).slice(0, 10)) {
        return res.status(400).json({
          error: 'fecha_empadre no puede ser anterior al último parto de la hembra',
          campo: 'fecha_empadre',
          id_hembra: hid,
        });
      }
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query(
        `INSERT INTO empadres
          (id_granja, id_macho, id_jaula, fecha_empadre, peso_antes, peso_despues,
           cantidad_hembras, cantidad_prenadas, notas, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
        [
          req.granjaId,
          id_macho || null,
          id_jaula || null,
          fecha_empadre,
          peso_antes || null,
          peso_despues || null,
          hembras.length,
          cantPren,
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
      res.status(201).json({ ...emp, hembras, cantidad_hembras: hembras.length });
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
      `SELECT e.*, m.codigo AS macho_codigo,
              (SELECT COUNT(*)::int FROM empadre_hembras eh WHERE eh.id_empadre = e.id) AS cant_hembras
       FROM empadres e
       LEFT JOIN animales m ON m.id = e.id_macho
       WHERE e.id_granja = $1
       ORDER BY e.fecha_empadre DESC`,
      [req.granjaId]
    );
    res.json(rows);
  })
);

router.patch(
  '/:id/hembras/:idHembra',
  canWrite,
  asyncHandler(async (req, res) => {
    const { resultado, fecha } = req.body || {};
    if (!['prenez', 'vacia', 'aborto', 'murio'].includes(resultado)) {
      return res.status(400).json({ error: 'resultado inválido' });
    }
    const fechaRes = fecha && isValidDateStr(fecha) ? fecha : todayISO();
    const { rows } = await pool.query(
      `UPDATE empadre_hembras eh SET resultado = $1
       FROM empadres e
       WHERE eh.id_empadre = e.id AND e.id = $2 AND eh.id_hembra = $3 AND e.id_granja = $4
       RETURNING eh.*`,
      [resultado, req.params.id, req.params.idHembra, req.granjaId]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Registro no encontrado' });

    if (resultado === 'murio') {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(
          `UPDATE animales SET estado = 'baja_muerte', fecha_baja = $1,
             motivo_baja = 'Murió en ciclo de empadre', updated_at = NOW()
           WHERE id = $2 AND id_granja = $3`,
          [fechaRes, req.params.idHembra, req.granjaId]
        );
        await client.query(
          `INSERT INTO mortalidad
            (id_granja, id_animal, fecha, categoria, cantidad, causa, created_by)
           VALUES ($1,$2,$3,'reproductora',1,'Murió en ciclo de empadre',$4)`,
          [req.granjaId, req.params.idHembra, fechaRes, req.user.id]
        );
        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    }
    res.json(rows[0]);
  })
);

router.get(
  '/reproductoras/:id',
  asyncHandler(async (req, res) => {
    const h = await assertAnimal(req.granjaId, Number(req.params.id), 'H');
    // allow ficha even if baja
    let animal = h.animal;
    if (h.error) {
      const any = await pool.query(
        `SELECT * FROM animales WHERE id=$1 AND id_granja=$2 AND sexo='H'`,
        [req.params.id, req.granjaId]
      );
      if (!any.rows[0]) return res.status(404).json({ error: 'Hembra no encontrada' });
      animal = any.rows[0];
    }

    const ciclos = await pool.query(
      `SELECT e.*, eh.resultado, m.codigo AS macho_codigo,
              (SELECT json_agg(json_build_object(
                 'id', p.id, 'fecha_parto', p.fecha_parto,
                 'vivos_m', p.vivos_m, 'vivos_h', p.vivos_h, 'muertos', p.muertos,
                 'peso_m1', p.peso_m1, 'peso_m2', p.peso_m2, 'peso_m3', p.peso_m3,
                 'peso_h1', p.peso_h1, 'peso_h2', p.peso_h2, 'peso_h3', p.peso_h3,
                 'peso_promedio', NULL,
                 'destete', (SELECT json_build_object(
                    'fecha_destete', d.fecha_destete,
                    'destetados_m', d.destetados_m, 'destetados_h', d.destetados_h,
                    'muertos', d.muertos,
                    'peso_m1', d.peso_m1, 'peso_m2', d.peso_m2, 'peso_m3', d.peso_m3,
                    'peso_h1', d.peso_h1, 'peso_h2', d.peso_h2, 'peso_h3', d.peso_h3
                  ) FROM destetes d WHERE d.id_parto = p.id LIMIT 1)
               ) ORDER BY p.fecha_parto)
               FROM partos p WHERE p.id_hembra = eh.id_hembra AND (p.id_empadre = e.id OR p.id_empadre IS NULL)) AS partos
       FROM empadre_hembras eh
       JOIN empadres e ON e.id = eh.id_empadre
       LEFT JOIN animales m ON m.id = e.id_macho
       WHERE eh.id_hembra = $1 AND e.id_granja = $2
       ORDER BY e.fecha_empadre DESC`,
      [req.params.id, req.granjaId]
    );

    const partosAll = await pool.query(
      `SELECT p.*, d.destetados_m, d.destetados_h
       FROM partos p
       LEFT JOIN destetes d ON d.id_parto = p.id
       WHERE p.id_hembra = $1`,
      [req.params.id]
    );
    const numPartos = partosAll.rows.length;
    const avgCamada =
      numPartos > 0
        ? partosAll.rows.reduce((s, p) => s + (p.vivos_m || 0) + (p.vivos_h || 0), 0) / numPartos
        : 0;
    const criasDestetadas = partosAll.rows.reduce(
      (s, p) => s + (p.destetados_m || 0) + (p.destetados_h || 0),
      0
    );

    const ciclosOut = ciclos.rows.map((c) => ({
      ...c,
      partos: (c.partos || []).map((p) => ({
        ...p,
        peso_promedio: promedioPesos(
          p.peso_m1,
          p.peso_m2,
          p.peso_m3,
          p.peso_h1,
          p.peso_h2,
          p.peso_h3
        ),
      })),
    }));

    res.json({
      animal,
      ciclos: ciclosOut,
      indicadores: {
        numero_partos: numPartos,
        promedio_camada: Math.round(avgCamada * 100) / 100,
        crias_destetadas: criasDestetadas,
      },
    });
  })
);

router.get(
  '/jaula/:id/hembras',
  asyncHandler(async (req, res) => {
    const { rows } = await pool.query(
      `SELECT an.id, an.codigo, an.sexo, j.codigo AS jaula, ar.nombre AS area, ar.proposito
       FROM animales an
       JOIN jaulas j ON j.id = an.id_jaula
       JOIN areas ar ON ar.id = j.id_area
       WHERE j.id = $1 AND an.id_granja = $2 AND an.estado = 'activo' AND an.sexo = 'H'
       ORDER BY an.codigo`,
      [req.params.id, req.granjaId]
    );
    res.json(rows);
  })
);

router.get(
  '/reproductores/:id',
  asyncHandler(async (req, res) => {
    const { rows: machos } = await pool.query(
      `SELECT * FROM animales WHERE id = $1 AND id_granja = $2 AND sexo = 'M'`,
      [req.params.id, req.granjaId]
    );
    if (!machos[0]) return res.status(404).json({ error: 'Macho no encontrado' });

    const ciclos = await pool.query(
      `SELECT e.id, e.fecha_empadre, e.cantidad_hembras, e.cantidad_prenadas, e.id_jaula,
              j.codigo AS jaula,
              (SELECT COUNT(*)::int FROM empadre_hembras eh
                WHERE eh.id_empadre = e.id AND eh.resultado = 'prenez') AS prenadas,
              (SELECT COUNT(*)::int FROM empadre_hembras eh WHERE eh.id_empadre = e.id) AS total_hembras,
              COALESCE((
                SELECT json_agg(json_build_object(
                  'id_parto', p.id,
                  'id_hembra', p.id_hembra,
                  'hembra_codigo', ah.codigo,
                  'fecha_parto', p.fecha_parto,
                  'vivos_m', p.vivos_m,
                  'vivos_h', p.vivos_h,
                  'tamano_camada', COALESCE(p.vivos_m,0)+COALESCE(p.vivos_h,0)
                ) ORDER BY p.fecha_parto)
                FROM partos p
                JOIN animales ah ON ah.id = p.id_hembra
                WHERE p.id_empadre = e.id
              ), '[]'::json) AS partos
       FROM empadres e
       LEFT JOIN jaulas j ON j.id = e.id_jaula
       WHERE e.id_macho = $1 AND e.id_granja = $2
       ORDER BY e.fecha_empadre DESC`,
      [req.params.id, req.granjaId]
    );

    let totalEmpadres = ciclos.rows.length;
    let totalPrenadas = 0;
    let totalHembras = 0;
    let sumCamada = 0;
    let nPartos = 0;
    for (const c of ciclos.rows) {
      totalPrenadas += Number(c.prenadas) || 0;
      totalHembras += Number(c.total_hembras) || 0;
      const partos = Array.isArray(c.partos) ? c.partos : [];
      for (const p of partos) {
        sumCamada += Number(p.tamano_camada) || 0;
        nPartos += 1;
      }
    }

    res.json({
      animal: machos[0],
      empadres: ciclos.rows,
      indicadores: {
        empadres: totalEmpadres,
        porcentaje_prenez:
          totalHembras > 0 ? Math.round((totalPrenadas / totalHembras) * 1000) / 10 : null,
        promedio_camada: nPartos > 0 ? Math.round((sumCamada / nPartos) * 100) / 100 : null,
        partos: nPartos,
      },
    });
  })
);

router.post(
  '/:id/cerrar',
  canWrite,
  asyncHandler(async (req, res) => {
    const { id_jaula_retorno } = req.body || {};
    const { rows } = await pool.query(
      `SELECT * FROM empadres WHERE id = $1 AND id_granja = $2`,
      [req.params.id, req.granjaId]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Empadre no encontrado' });
    const emp = rows[0];
    if (!emp.id_macho) {
      return res.status(400).json({ error: 'El empadre no tiene macho asignado' });
    }
    if (!id_jaula_retorno) {
      return res.status(400).json({ error: 'id_jaula_retorno es obligatorio' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const jaula = await client.query(
        `SELECT j.id FROM jaulas j
         JOIN areas a ON a.id = j.id_area
         WHERE j.id = $1 AND a.id_granja = $2 AND j.activa = true`,
        [id_jaula_retorno, req.granjaId]
      );
      if (!jaula.rows[0]) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Jaula de retorno inválida' });
      }
      const macho = await client.query(
        `SELECT id, id_jaula FROM animales WHERE id = $1 AND id_granja = $2`,
        [emp.id_macho, req.granjaId]
      );
      await client.query(
        `UPDATE animales SET id_jaula = $1, updated_at = NOW() WHERE id = $2`,
        [id_jaula_retorno, emp.id_macho]
      );
      await client.query(
        `INSERT INTO movimientos
          (tipo, id_animal, id_granja_origen, id_granja_destino,
           id_jaula_origen, id_jaula_destino, fecha, motivo, created_by)
         VALUES ('traslado',$1,$2,$2,$3,$4,$5,$6,$7)`,
        [
          emp.id_macho,
          req.granjaId,
          macho.rows[0]?.id_jaula || null,
          id_jaula_retorno,
          todayISO(),
          `Retorno macho tras empadre #${emp.id}`,
          req.user.id,
        ]
      );
      await client.query(
        `UPDATE empadres SET notas = COALESCE(notas,'') || ' [cerrado]', updated_at = NOW()
         WHERE id = $1`,
        [emp.id]
      );
      await client.query('COMMIT');
      res.json({ ok: true, id_empadre: emp.id, id_jaula_retorno });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  })
);

module.exports = router;
