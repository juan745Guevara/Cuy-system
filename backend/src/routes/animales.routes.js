const express = require('express');
const { pool } = require('../config/database');
const { asyncHandler, normalizeCodigo, isValidDateStr, esFechaFutura } = require('../utils/helpers');
const animalesService = require('../services/animales.service');
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
    const rows = await animalesService.listAnimales(pool, req.granjaId, req.query);
    res.json({ total: rows.length, data: rows });
  })
);

router.get(
  '/buscar/:codigo',
  asyncHandler(async (req, res) => {
    const animal = await animalesService.buscarPorCodigo(pool, req.granjaId, req.params.codigo);
    if (!animal) {
      return res.status(404).json({
        error: 'Animal no encontrado',
        sugerencia: 'registrar',
        codigo: normalizeCodigo(req.params.codigo),
      });
    }
    res.json(animal);
  })
);

router.post(
  '/',
  requireRoles('superadmin', 'admin', 'encargado', 'auxiliar'),
  asyncHandler(async (req, res) => {
    const data = req.body || {};
    if (!data.codigo || !data.sexo) {
      return res.status(400).json({ error: 'codigo y sexo son obligatorios' });
    }
    if (!['M', 'H'].includes(data.sexo)) {
      return res.status(400).json({ error: 'sexo debe ser M o H' });
    }
    if (!data.id_jaula) {
      return res.status(400).json({ error: 'jaula es obligatoria', campo: 'id_jaula' });
    }
    if (!normalizeCodigo(data.codigo)) {
      return res.status(400).json({ error: 'codigo inválido' });
    }
    if (data.fecha_nacimiento && !isValidDateStr(data.fecha_nacimiento)) {
      return res.status(400).json({ error: 'fecha_nacimiento inválida', campo: 'fecha_nacimiento' });
    }
    if (esFechaFutura(data.fecha_nacimiento)) {
      return res
        .status(400)
        .json({ error: 'fecha_nacimiento no puede ser futura', campo: 'fecha_nacimiento' });
    }

    const resultado = await animalesService.crearAnimal(pool, {
      granjaId: req.granjaId,
      userId: req.user.id,
      data,
    });

    switch (resultado.tipo) {
      case 'jaula_invalida':
        return res.status(400).json({ error: 'Jaula fuera de la granja activa' });
      case 'capacidad_excedida':
        return res.status(409).json({
          error: 'La jaula supera su capacidad máxima',
          requiere_confirmacion: 'capacidad',
          ocupacion_actual: resultado.jaula.ocupacion,
          capacidad_maxima: resultado.jaula.capacidad_maxima,
        });
      case 'codigo_duplicado':
        return res.status(409).json({ error: 'Código duplicado en la granja', animal: resultado.animal });
      case 'requiere_confirmacion_reuso':
        return res.status(409).json({
          error: 'El código pertenece a un animal dado de baja. Confirme reutilización.',
          requiere_confirmacion: true,
          animal: resultado.animal,
        });
      case 'reusado':
      case 'creado':
        return res.status(201).json(resultado.animal);
      default:
        throw new Error(`Resultado inesperado de crearAnimal: ${resultado.tipo}`);
    }
  })
);

router.patch(
  '/:id',
  requireRoles('superadmin', 'admin', 'encargado', 'auxiliar'),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const data = req.body || {};

    if (data.fecha_baja && !isValidDateStr(data.fecha_baja)) {
      return res.status(400).json({ error: 'fecha_baja inválida', campo: 'fecha_baja' });
    }
    if (esFechaFutura(data.fecha_baja)) {
      return res.status(400).json({ error: 'fecha_baja no puede ser futura', campo: 'fecha_baja' });
    }

    const resultado = await animalesService.actualizarAnimal(pool, {
      granjaId: req.granjaId,
      userId: req.user.id,
      id,
      data,
    });

    if (resultado.tipo === 'no_encontrado') {
      return res.status(404).json({ error: 'Animal no encontrado' });
    }
    res.json(resultado.animal);
  })
);

module.exports = router;
