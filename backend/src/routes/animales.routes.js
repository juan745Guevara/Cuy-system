const express = require('express');
const { pool } = require('../config/database');
const { asyncHandler, normalizeCodigo, isValidDateStr } = require('../utils/helpers');
const {
  authRequired,
  loadUserFarms,
  requireFarmAccess,
  requireRoles,
} = require('../middleware/auth');

const router = express.Router();
router.use(authRequired, loadUserFarms, requireFarmAccess);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const {
      sexo,
      id_categoria,
      id_raza,
      id_area,
      id_jaula,
      estado = 'activo',
      q,
      sort = 'codigo',
    } = req.query;
    const params = [req.granjaId];
    let where = 'WHERE a.id_granja = $1';
    const add = (val, sql) => {
      params.push(val);
      where += ` AND ${sql.replace('?', `$${params.length}`)}`;
    };
    if (estado && estado !== 'todos') add(estado, 'a.estado = ?');
    if (sexo) add(sexo, 'a.sexo = ?');
    if (id_categoria) add(Number(id_categoria), 'a.id_categoria = ?');
    if (id_raza) add(Number(id_raza), 'a.id_raza = ?');
    if (id_jaula) add(Number(id_jaula), 'a.id_jaula = ?');
    if (id_area) add(Number(id_area), 'j.id_area = ?');
    if (q) add(`%${normalizeCodigo(q)}%`, 'a.codigo_norm LIKE ?');

    const orderMap = {
      codigo: 'a.codigo',
      fecha_nacimiento: 'a.fecha_nacimiento NULLS LAST, a.codigo',
      ubicacion: 'ar.nombre NULLS LAST, j.codigo NULLS LAST, a.codigo',
    };
    const orderBy = orderMap[sort] || orderMap.codigo;

    const { rows } = await pool.query(
      `SELECT a.*, r.nombre AS raza, c.nombre AS categoria, j.codigo AS jaula, ar.nombre AS area
       FROM animales a
       LEFT JOIN razas r ON r.id = a.id_raza
       LEFT JOIN categorias c ON c.id = a.id_categoria
       LEFT JOIN jaulas j ON j.id = a.id_jaula
       LEFT JOIN areas ar ON ar.id = j.id_area
       ${where}
       ORDER BY ${orderBy}`,
      params
    );
    res.json({ total: rows.length, data: rows });
  })
);

router.get(
  '/buscar/:codigo',
  asyncHandler(async (req, res) => {
    const codigo = normalizeCodigo(req.params.codigo);
    const { rows } = await pool.query(
      `SELECT a.*, r.nombre AS raza, c.nombre AS categoria, j.codigo AS jaula, ar.nombre AS area
       FROM animales a
       LEFT JOIN razas r ON r.id = a.id_raza
       LEFT JOIN categorias c ON c.id = a.id_categoria
       LEFT JOIN jaulas j ON j.id = a.id_jaula
       LEFT JOIN areas ar ON ar.id = j.id_area
       WHERE a.id_granja = $1 AND a.codigo_norm = $2`,
      [req.granjaId, codigo]
    );
    if (!rows[0]) {
      return res.status(404).json({ error: 'Animal no encontrado', sugerencia: 'registrar', codigo });
    }
    const hist = await pool.query(
      `SELECT 'particularidad' AS tipo, fecha::text AS fecha, texto AS detalle, created_at
       FROM animal_particularidades WHERE id_animal = $1
       UNION ALL
       SELECT 'empadre', e.fecha_empadre::text, 'Empadre #' || e.id::text, e.created_at
       FROM empadre_hembras eh JOIN empadres e ON e.id = eh.id_empadre WHERE eh.id_hembra = $1
       UNION ALL
       SELECT 'parto', p.fecha_parto::text, 'Camada M:'||p.vivos_m||' H:'||p.vivos_h, p.created_at
       FROM partos p WHERE p.id_hembra = $1
       UNION ALL
       SELECT 'destete', d.fecha_destete::text,
              'Destete M:'||d.destetados_m||' H:'||d.destetados_h, d.created_at
       FROM destetes d JOIN partos p ON p.id = d.id_parto WHERE p.id_hembra = $1
       UNION ALL
       SELECT 'mortalidad', m.fecha::text, COALESCE(m.causa,'Mortalidad'), m.created_at
       FROM mortalidad m WHERE m.id_animal = $1
       UNION ALL
       SELECT 'venta', v.fecha::text, 'Venta', v.created_at
       FROM ventas v WHERE v.id_animal = $1
       ORDER BY created_at DESC`,
      [rows[0].id]
    );
    res.json({ ...rows[0], historial: hist.rows });
  })
);

router.post(
  '/',
  requireRoles('superadmin', 'admin', 'encargado', 'auxiliar'),
  asyncHandler(async (req, res) => {
    const {
      codigo,
      sexo,
      id_raza,
      id_categoria,
      id_jaula,
      fecha_nacimiento,
      particularidad,
      confirmar_reuso,
    } = req.body || {};
    if (!codigo || !sexo) return res.status(400).json({ error: 'codigo y sexo son obligatorios' });
    if (!['M', 'H'].includes(sexo)) return res.status(400).json({ error: 'sexo debe ser M o H' });
    if (!id_jaula) return res.status(400).json({ error: 'jaula es obligatoria', campo: 'id_jaula' });
    const codigoNorm = normalizeCodigo(codigo);
    if (!codigoNorm) return res.status(400).json({ error: 'codigo inválido' });
    if (fecha_nacimiento && !isValidDateStr(fecha_nacimiento)) {
      return res.status(400).json({ error: 'fecha_nacimiento inválida', campo: 'fecha_nacimiento' });
    }

    const j = await pool.query(
      `SELECT j.id FROM jaulas j JOIN areas a ON a.id = j.id_area
       WHERE j.id = $1 AND a.id_granja = $2 AND j.activa = true`,
      [id_jaula, req.granjaId]
    );
    if (!j.rows[0]) return res.status(400).json({ error: 'Jaula fuera de la granja activa' });

    const existing = await pool.query(
      `SELECT id, codigo, estado FROM animales WHERE id_granja=$1 AND codigo_norm=$2`,
      [req.granjaId, codigoNorm]
    );
    if (existing.rows[0]) {
      const ex = existing.rows[0];
      if (ex.estado === 'activo') {
        return res.status(409).json({
          error: 'Código duplicado en la granja (NUC-40)',
          animal: ex,
        });
      }
      if (!confirmar_reuso) {
        return res.status(409).json({
          error: 'El código pertenece a un animal dado de baja. Confirme reutilización.',
          requiere_confirmacion: true,
          animal: ex,
        });
      }
      // reuso: actualizar registro de baja
      const { rows } = await pool.query(
        `UPDATE animales SET
           sexo=$1, id_raza=$2, id_categoria=$3, id_jaula=$4, fecha_nacimiento=$5,
           estado='activo', fecha_baja=NULL, motivo_baja=NULL, codigo=$6, updated_at=NOW()
         WHERE id=$7 RETURNING *`,
        [
          sexo,
          id_raza || null,
          id_categoria || null,
          id_jaula,
          fecha_nacimiento || null,
          String(codigo).trim(),
          ex.id,
        ]
      );
      if (particularidad) {
        await pool.query(
          `INSERT INTO animal_particularidades (id_animal, texto, created_by) VALUES ($1,$2,$3)`,
          [rows[0].id, particularidad, req.user.id]
        );
      }
      return res.status(201).json(rows[0]);
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query(
        `INSERT INTO animales
          (id_granja, codigo, codigo_norm, sexo, id_raza, id_categoria, id_jaula, fecha_nacimiento, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
        [
          req.granjaId,
          String(codigo).trim(),
          codigoNorm,
          sexo,
          id_raza || null,
          id_categoria || null,
          id_jaula,
          fecha_nacimiento || null,
          req.user.id,
        ]
      );
      if (particularidad) {
        await client.query(
          `INSERT INTO animal_particularidades (id_animal, texto, created_by) VALUES ($1,$2,$3)`,
          [rows[0].id, particularidad, req.user.id]
        );
      }
      await client.query('COMMIT');
      res.status(201).json(rows[0]);
    } catch (err) {
      await client.query('ROLLBACK');
      if (err.code === '23505') {
        return res.status(409).json({ error: 'Código duplicado en la granja (NUC-40)' });
      }
      throw err;
    } finally {
      client.release();
    }
  })
);

router.patch(
  '/:id',
  requireRoles('superadmin', 'admin', 'encargado', 'auxiliar'),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const { estado, motivo_baja, fecha_baja, id_categoria, id_jaula, particularidad } =
      req.body || {};
    const cur = await pool.query(`SELECT id FROM animales WHERE id=$1 AND id_granja=$2`, [
      id,
      req.granjaId,
    ]);
    if (!cur.rows[0]) return res.status(404).json({ error: 'Animal no encontrado' });

    if (fecha_baja && !isValidDateStr(fecha_baja)) {
      return res.status(400).json({ error: 'fecha_baja inválida', campo: 'fecha_baja' });
    }
    if (estado && estado !== 'activo' && !motivo_baja && !fecha_baja) {
      // allow but prefer both
    }

    const { rows } = await pool.query(
      `UPDATE animales SET
         estado = COALESCE($1, estado),
         motivo_baja = COALESCE($2, motivo_baja),
         fecha_baja = COALESCE($3, fecha_baja),
         id_categoria = COALESCE($4, id_categoria),
         id_jaula = COALESCE($5, id_jaula),
         updated_at = NOW()
       WHERE id = $6 RETURNING *`,
      [estado || null, motivo_baja || null, fecha_baja || null, id_categoria || null, id_jaula || null, id]
    );
    if (particularidad) {
      await pool.query(
        `INSERT INTO animal_particularidades (id_animal, texto, fecha, created_by) VALUES ($1,$2,COALESCE($3,CURRENT_DATE),$4)`,
        [id, particularidad, fecha_baja || null, req.user.id]
      );
    }
    res.json(rows[0]);
  })
);

module.exports = router;
