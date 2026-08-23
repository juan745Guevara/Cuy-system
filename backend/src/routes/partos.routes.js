const express = require('express');
const { pool } = require('../config/database');
const { asyncHandler, normalizeCodigo, isValidDateStr, promedioPesos } = require('../utils/helpers');
const { authRequired, loadUserFarms, requireFarmAccess, requireRoles } = require('../middleware/auth');

const router = express.Router();
router.use(authRequired, loadUserFarms, requireFarmAccess);
const canWrite = requireRoles('superadmin', 'admin', 'encargado', 'auxiliar');

async function catId(client, granjaId, nombre) {
  const { rows } = await client.query(
    `SELECT c.id FROM categorias c
     JOIN granjas g ON g.id_especie = c.id_especie
     WHERE g.id = $1 AND LOWER(c.nombre) = LOWER($2) AND c.activa = true LIMIT 1`,
    [granjaId, nombre]
  );
  return rows[0]?.id || null;
}

// CUY-08
router.post(
  '/',
  canWrite,
  asyncHandler(async (req, res) => {
    const {
      id_hembra,
      id_empadre,
      fecha_parto,
      vivos_m = 0,
      vivos_h = 0,
      muertos = 0,
      peso_m1,
      peso_m2,
      peso_m3,
      peso_h1,
      peso_h2,
      peso_h3,
    } = req.body || {};
    if (!id_hembra || !fecha_parto) {
      return res.status(400).json({ error: 'id_hembra y fecha_parto son obligatorios', campo: 'fecha_parto' });
    }
    if (!isValidDateStr(fecha_parto)) {
      return res.status(400).json({ error: 'fecha_parto inválida', campo: 'fecha_parto' });
    }
    const vm = Number(vivos_m) || 0;
    const vh = Number(vivos_h) || 0;
    const mu = Number(muertos) || 0;
    if (vm < 0 || vh < 0 || mu < 0) {
      return res.status(400).json({ error: 'cantidades deben ser ≥ 0' });
    }
    const tamanoCamada = vm + vh + mu;
    if (tamanoCamada <= 0) {
      return res.status(400).json({ error: 'indique vivos o muertos' });
    }
    if (mu > tamanoCamada) {
      return res.status(400).json({ error: 'muertos no pueden superar el tamaño de camada', campo: 'muertos' });
    }

    const hembra = await pool.query(
      `SELECT * FROM animales WHERE id=$1 AND id_granja=$2 AND sexo='H' AND estado='activo'`,
      [id_hembra, req.granjaId]
    );
    if (!hembra.rows[0]) return res.status(400).json({ error: 'Hembra inválida' });

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query(
        `INSERT INTO partos
          (id_granja, id_hembra, id_empadre, fecha_parto, vivos_m, vivos_h, muertos,
           peso_m1, peso_m2, peso_m3, peso_h1, peso_h2, peso_h3, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
        [
          req.granjaId,
          id_hembra,
          id_empadre || null,
          fecha_parto,
          vm,
          vh,
          mu,
          peso_m1 || null,
          peso_m2 || null,
          peso_m3 || null,
          peso_h1 || null,
          peso_h2 || null,
          peso_h3 || null,
          req.user.id,
        ]
      );
      const parto = rows[0];
      if (id_empadre) {
        await client.query(
          `UPDATE empadre_hembras SET resultado = 'prenez'
           WHERE id_empadre = $1 AND id_hembra = $2`,
          [id_empadre, id_hembra]
        );
      }

      const idGazapo = await catId(client, req.granjaId, 'gazapo');
      const madre = hembra.rows[0];
      const crias = [];
      for (let i = 1; i <= vm; i += 1) {
        const codigo = `${madre.codigo}-P${parto.id}-M${i}`;
        const ins = await client.query(
          `INSERT INTO animales
            (id_granja, codigo, codigo_norm, sexo, id_raza, id_categoria, id_jaula,
             fecha_nacimiento, created_by, id_parto_origen)
           VALUES ($1,$2,$3,'M',$4,$5,$6,$7,$8,$9) RETURNING id, codigo, sexo`,
          [
            req.granjaId,
            codigo,
            normalizeCodigo(codigo),
            madre.id_raza,
            idGazapo,
            madre.id_jaula,
            fecha_parto,
            req.user.id,
            parto.id,
          ]
        );
        crias.push(ins.rows[0]);
      }
      for (let i = 1; i <= vh; i += 1) {
        const codigo = `${madre.codigo}-P${parto.id}-H${i}`;
        const ins = await client.query(
          `INSERT INTO animales
            (id_granja, codigo, codigo_norm, sexo, id_raza, id_categoria, id_jaula,
             fecha_nacimiento, created_by, id_parto_origen)
           VALUES ($1,$2,$3,'H',$4,$5,$6,$7,$8,$9) RETURNING id, codigo, sexo`,
          [
            req.granjaId,
            codigo,
            normalizeCodigo(codigo),
            madre.id_raza,
            idGazapo,
            madre.id_jaula,
            fecha_parto,
            req.user.id,
            parto.id,
          ]
        );
        crias.push(ins.rows[0]);
      }

      await client.query('COMMIT');
      res.status(201).json({
        ...parto,
        peso_promedio_nacimiento: promedioPesos(peso_m1, peso_m2, peso_m3, peso_h1, peso_h2, peso_h3),
        gazapos: crias,
      });
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
      `SELECT p.*, a.codigo AS hembra_codigo
       FROM partos p JOIN animales a ON a.id = p.id_hembra
       WHERE p.id_granja = $1
       ORDER BY p.fecha_parto DESC`,
      [req.granjaId]
    );
    res.json(
      rows.map((p) => ({
        ...p,
        peso_promedio_nacimiento: promedioPesos(
          p.peso_m1,
          p.peso_m2,
          p.peso_m3,
          p.peso_h1,
          p.peso_h2,
          p.peso_h3
        ),
      }))
    );
  })
);

module.exports = router;
