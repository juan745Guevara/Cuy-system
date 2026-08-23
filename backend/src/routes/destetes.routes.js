const express = require('express');
const { pool } = require('../config/database');
const { asyncHandler, isValidDateStr, promedioPesos } = require('../utils/helpers');
const { authRequired, loadUserFarms, requireFarmAccess, requireRoles } = require('../middleware/auth');

const router = express.Router();
router.use(authRequired, loadUserFarms, requireFarmAccess);
const canWrite = requireRoles('superadmin', 'admin', 'encargado', 'auxiliar');

async function catId(client, granjaId, nombres) {
  const { rows } = await client.query(
    `SELECT c.id, c.nombre FROM categorias c
     JOIN granjas g ON g.id_especie = c.id_especie
     WHERE g.id = $1 AND LOWER(c.nombre) = ANY($2::text[]) AND c.activa = true`,
    [granjaId, nombres.map((n) => n.toLowerCase())]
  );
  return rows;
}

// CUY-09
router.post(
  '/',
  canWrite,
  asyncHandler(async (req, res) => {
    const {
      id_parto,
      fecha_destete,
      destetados_m = 0,
      destetados_h = 0,
      muertos = 0,
      peso_m1,
      peso_m2,
      peso_m3,
      peso_h1,
      peso_h2,
      peso_h3,
      id_jaula_m,
      id_jaula_h,
    } = req.body || {};
    if (!id_parto || !fecha_destete) {
      return res.status(400).json({ error: 'id_parto y fecha_destete son obligatorios' });
    }
    if (!isValidDateStr(fecha_destete)) {
      return res.status(400).json({ error: 'fecha_destete inválida', campo: 'fecha_destete' });
    }

    const partoQ = await pool.query(`SELECT * FROM partos WHERE id = $1 AND id_granja = $2`, [
      id_parto,
      req.granjaId,
    ]);
    if (!partoQ.rows[0]) return res.status(404).json({ error: 'Parto no encontrado' });
    const parto = partoQ.rows[0];
    if (fecha_destete <= String(parto.fecha_parto).slice(0, 10)) {
      return res.status(400).json({
        error: 'fecha_destete debe ser posterior a la del parto',
        campo: 'fecha_destete',
      });
    }

    const dm = Number(destetados_m) || 0;
    const dh = Number(destetados_h) || 0;
    const mu = Number(muertos) || 0;
    const vivosNac = (parto.vivos_m || 0) + (parto.vivos_h || 0);
    if (dm + dh > vivosNac) {
      return res.status(400).json({
        error: 'tamaño de camada al destete no puede superar crías vivas al nacimiento',
        campo: 'destetados_m',
      });
    }
    if (dm + dh + mu > vivosNac) {
      return res.status(400).json({
        error: 'destetados + muertos no pueden superar vivos al nacimiento',
      });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query(
        `INSERT INTO destetes
          (id_parto, fecha_destete, destetados_m, destetados_h, muertos,
           peso_m1, peso_m2, peso_m3, peso_h1, peso_h2, peso_h3, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
        [
          id_parto,
          fecha_destete,
          dm,
          dh,
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

      const cats = await catId(client, req.granjaId, ['recria', 'reemplazo']);
      const idRecria =
        cats.find((c) => c.nombre.toLowerCase() === 'recria')?.id ||
        cats.find((c) => c.nombre.toLowerCase() === 'reemplazo')?.id ||
        null;

      const gazapos = await client.query(
        `SELECT id, sexo FROM animales
         WHERE id_parto_origen = $1 AND id_granja = $2 AND estado = 'activo'
         ORDER BY sexo, id`,
        [id_parto, req.granjaId]
      );

      for (const g of gazapos.rows) {
        const jaulaDest =
          g.sexo === 'M' ? id_jaula_m || null : id_jaula_h || null;
        await client.query(
          `UPDATE animales SET
             id_categoria = COALESCE($1, id_categoria),
             id_jaula = COALESCE($2, id_jaula),
             updated_at = NOW()
           WHERE id = $3`,
          [idRecria, jaulaDest, g.id]
        );
      }

      // CUY-16: pesos de destete → historial de pesajes
      const machos = gazapos.rows.filter((g) => g.sexo === 'M');
      const hembras = gazapos.rows.filter((g) => g.sexo === 'H');
      const pesosM = [peso_m1, peso_m2, peso_m3].filter((p) => p != null && Number(p) > 0);
      const pesosH = [peso_h1, peso_h2, peso_h3].filter((p) => p != null && Number(p) > 0);
      for (let i = 0; i < Math.min(machos.length, pesosM.length); i += 1) {
        await client.query(
          `INSERT INTO pesajes (id_granja, id_animal, fecha, peso_gramos, fuera_rango, created_by)
           VALUES ($1,$2,$3,$4,false,$5)`,
          [req.granjaId, machos[i].id, fecha_destete, Number(pesosM[i]), req.user.id]
        );
      }
      for (let i = 0; i < Math.min(hembras.length, pesosH.length); i += 1) {
        await client.query(
          `INSERT INTO pesajes (id_granja, id_animal, fecha, peso_gramos, fuera_rango, created_by)
           VALUES ($1,$2,$3,$4,false,$5)`,
          [req.granjaId, hembras[i].id, fecha_destete, Number(pesosH[i]), req.user.id]
        );
      }

      // mortalidad de gazapos no destetados
      if (mu > 0) {
        const toKill = gazapos.rows.slice(dm + dh);
        for (const g of toKill.slice(0, mu)) {
          await client.query(
            `UPDATE animales SET estado = 'baja_muerte', fecha_baja = $1,
               motivo_baja = 'Muerto al destete', updated_at = NOW()
             WHERE id = $2`,
            [fecha_destete, g.id]
          );
        }
        await client.query(
          `INSERT INTO mortalidad
            (id_granja, fecha, clasificacion, categoria, cantidad, causa, created_by)
           VALUES ($1,$2,$3,'gazapo',$4,'Muertos al destete',$5)`,
          [req.granjaId, fecha_destete, null, mu, req.user.id]
        );
      }

      await client.query(
        `INSERT INTO animal_particularidades (id_animal, texto, created_by)
         VALUES ($1, $2, $3)`,
        [
          parto.id_hembra,
          `Destete ${fecha_destete}: ${dm}M + ${dh}H (gazapos → recría)`,
          req.user.id,
        ]
      );

      await client.query('COMMIT');
      res.status(201).json({
        ...rows[0],
        peso_promedio_destete: promedioPesos(peso_m1, peso_m2, peso_m3, peso_h1, peso_h2, peso_h3),
        crias_actualizadas: gazapos.rows.length,
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
      `SELECT d.*, p.fecha_parto, a.codigo AS hembra_codigo
       FROM destetes d
       JOIN partos p ON p.id = d.id_parto
       JOIN animales a ON a.id = p.id_hembra
       WHERE p.id_granja = $1
       ORDER BY d.fecha_destete DESC`,
      [req.granjaId]
    );
    res.json(
      rows.map((d) => ({
        ...d,
        peso_promedio_destete: promedioPesos(
          d.peso_m1,
          d.peso_m2,
          d.peso_m3,
          d.peso_h1,
          d.peso_h2,
          d.peso_h3
        ),
      }))
    );
  })
);

module.exports = router;
