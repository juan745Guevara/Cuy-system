const express = require('express');
const router = express.Router();

// NUC-13: Administrar jaulas
router.post('/', async (req, res) => {
  // TODO: Implementar creación de jaula
  res.json({ message: 'Endpoint no implementado - NUC-13' });
});

// NUC-15: Ver jaulas de un área
router.get('/area/:id_area', async (req, res) => {
  // TODO: Implementar listado de jaulas
  res.json({ message: 'Endpoint no implementado - NUC-15' });
});

// NUC-18: Controlar capacidad
router.get('/:id/ocupacion', async (req, res) => {
  // TODO: Implementar consulta de ocupación
  res.json({ message: 'Endpoint no implementado - NUC-18' });
});

// NUC-13: Actualizar jaula
router.put('/:id', async (req, res) => {
  // TODO: Implementar actualización
  res.json({ message: 'Endpoint no implementado - NUC-13' });
});

module.exports = router;
