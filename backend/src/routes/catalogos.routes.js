const express = require('express');
const { pool } = require('../config/database');
const { asyncHandler } = require('../utils/helpers');
const { writeAudit } = require('../utils/audit');
const { authRequired, loadUserFarms, requireFarmAccess, requireRoles } = require('../middleware/auth');

const router = express.Router();
router.use(authRequired, loadUserFarms, requireFarmAccess);

async function especieDeGranja(granjaId) {
  const { rows } = await pool.query(`SELECT id_especie FROM granjas WHERE id = $1`, [granjaId]);
  return rows[0]?.id_especie;
}

// Listado de razas
router.get(
  '/razas',
  asyncHandler(async (req, res) => {
    const idEspecie = await especieDeGranja(req.granjaId);
    const { rows } = await pool.query(
      `SELECT * FROM razas WHERE id_especie = $1 AND activa = true ORDER BY nombre`,
      [idEspecie]
    );
    res.json(rows);
  })
);

router.post(
  '/razas',
  requireRoles('superadmin', 'admin'),
  asyncHandler(async (req, res) => {
    const { nombre } = req.body || {};
    if (!nombre) return res.status(400).json({ error: 'nombre es obligatorio' });
    const idEspecie = await especieDeGranja(req.granjaId);
    try {
      const { rows } = await pool.query(
        `INSERT INTO razas (id_especie, nombre) VALUES ($1, $2) RETURNING *`,
        [idEspecie, nombre.trim()]
      );
      await writeAudit({
        userId: req.user.id,
        granjaId: req.granjaId,
        accion: 'crear',
        entidad: 'raza',
        idEntidad: rows[0].id,
        despues: rows[0],
        detalle: `Alta de raza ${rows[0].nombre}`,
      });
      res.status(201).json(rows[0]);
    } catch (err) {
      if (err.code === '23505') return res.status(409).json({ error: 'Raza ya existe' });
      throw err;
    }
  })
);

// Listado de categorías
router.get(
  '/categorias',
  asyncHandler(async (req, res) => {
    const idEspecie = await especieDeGranja(req.granjaId);
    const { rows } = await pool.query(
      `SELECT * FROM categorias WHERE id_especie = $1 AND activa = true ORDER BY nombre`,
      [idEspecie]
    );
    res.json(rows);
  })
);

router.post(
  '/categorias',
  requireRoles('superadmin', 'admin'),
  asyncHandler(async (req, res) => {
    const { nombre, proposito_area } = req.body || {};
    if (!nombre) return res.status(400).json({ error: 'nombre es obligatorio' });
    const idEspecie = await especieDeGranja(req.granjaId);
    try {
      const { rows } = await pool.query(
        `INSERT INTO categorias (id_especie, nombre, proposito_area) VALUES ($1, $2, $3) RETURNING *`,
        [idEspecie, nombre.trim(), proposito_area || null]
      );
      await writeAudit({
        userId: req.user.id,
        granjaId: req.granjaId,
        accion: 'crear',
        entidad: 'categoria',
        idEntidad: rows[0].id,
        despues: rows[0],
        detalle: `Alta de categoría ${rows[0].nombre}`,
      });
      res.status(201).json(rows[0]);
    } catch (err) {
      if (err.code === '23505') return res.status(409).json({ error: 'Categoría ya existe' });
      throw err;
    }
  })
);

router.get(
  '/especies',
  asyncHandler(async (req, res) => {
    const { rows } = await pool.query(`SELECT * FROM especies WHERE activo = true ORDER BY nombre`);
    res.json(rows);
  })
);

router.patch(
  '/razas/:id/desactivar',
  requireRoles('superadmin', 'admin'),
  asyncHandler(async (req, res) => {
    const idEspecie = await especieDeGranja(req.granjaId);
    const { rows } = await pool.query(
      `UPDATE razas SET activa=false WHERE id=$1 AND id_especie=$2 RETURNING *`,
      [req.params.id, idEspecie]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Raza no encontrada' });
    await writeAudit({
      userId: req.user.id,
      granjaId: req.granjaId,
      accion: 'desactivar',
      entidad: 'raza',
      idEntidad: rows[0].id,
      despues: rows[0],
      detalle: `Desactivación de raza ${rows[0].nombre}`,
    });
    res.json(rows[0]);
  })
);

router.patch(
  '/categorias/:id/desactivar',
  requireRoles('superadmin', 'admin'),
  asyncHandler(async (req, res) => {
    const idEspecie = await especieDeGranja(req.granjaId);
    const { rows } = await pool.query(
      `UPDATE categorias SET activa=false WHERE id=$1 AND id_especie=$2 RETURNING *`,
      [req.params.id, idEspecie]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Categoría no encontrada' });
    await writeAudit({
      userId: req.user.id,
      granjaId: req.granjaId,
      accion: 'desactivar',
      entidad: 'categoria',
      idEntidad: rows[0].id,
      despues: rows[0],
      detalle: `Desactivación de categoría ${rows[0].nombre}`,
    });
    res.json(rows[0]);
  })
);

// Propuestas de transición de categoría por edad.
// Usa los plazos configurables edad_recria y edad_empadre (alerta_config).
// La aplicación se hace con PATCH /animales/:id (id_categoria), confirmando el encargado.
router.get(
  '/transiciones',
  asyncHandler(async (req, res) => {
    const { rows: conf } = await pool.query(
      `SELECT tipo, dias FROM alerta_config WHERE id_granja = $1`,
      [req.granjaId]
    );
    const byTipo = Object.fromEntries(conf.map((c) => [c.tipo, c.dias]));
    const edadRecria = Number(byTipo.edad_recria) || 21;
    const edadEmpadre = Number(byTipo.edad_empadre) || 90;

    const idEspecie = await especieDeGranja(req.granjaId);
    const { rows: cats } = await pool.query(
      `SELECT id, nombre FROM categorias WHERE id_especie = $1 AND activa = true`,
      [idEspecie]
    );
    const findCat = (fn) => cats.find((c) => fn(c.nombre.toLowerCase()))?.id || null;
    const idRecria = findCat((n) => n.includes('recr') || n.includes('reemplazo'));
    const idReproductora = findCat((n) => n.includes('reproductora'));
    const idReproductor = findCat((n) => n.includes('reproductor'));

    const { rows } = await pool.query(
      `SELECT an.id, an.codigo, an.sexo, an.fecha_nacimiento,
              c.nombre AS categoria, j.codigo AS jaula
       FROM animales an
       LEFT JOIN categorias c ON c.id = an.id_categoria
       LEFT JOIN jaulas j ON j.id = an.id_jaula
       WHERE an.id_granja = $1 AND an.estado = 'activo' AND an.fecha_nacimiento IS NOT NULL`,
      [req.granjaId]
    );

    const hoy = new Date();
    const propuestas = [];
    for (const an of rows) {
      const edadDias = Math.floor(
        (hoy - new Date(`${String(an.fecha_nacimiento).slice(0, 10)}T00:00:00`)) / 86400000
      );
      const cat = String(an.categoria || '').toLowerCase();
      let propuesta = null;
      if (idRecria && (cat.includes('gazapo') || cat.includes('cria')) && edadDias >= edadRecria) {
        propuesta = { categorias: idRecria, nombre: cats.find((c) => c.id === idRecria).nombre };
      } else if (
        (cat.includes('recr') || cat.includes('reemplazo')) &&
        edadDias >= edadEmpadre
      ) {
        const target = an.sexo === 'H' ? idReproductora : idReproductor;
        if (target) propuesta = { categorias: target, nombre: cats.find((c) => c.id === target).nombre };
      }
      if (propuesta) {
        propuestas.push({
          id_animal: an.id,
          codigo: an.codigo,
          sexo: an.sexo,
          jaula: an.jaula,
          categoria_actual: an.categoria,
          categoria_propuesta_id: propuesta.categorias,
          categoria_propuesta: propuesta.nombre,
          edad_dias: edadDias,
        });
      }
    }

    res.json({
      plazos: { edad_recria: edadRecria, edad_empadre: edadEmpadre },
      total: propuestas.length,
      propuestas,
    });
  })
);

module.exports = router;
