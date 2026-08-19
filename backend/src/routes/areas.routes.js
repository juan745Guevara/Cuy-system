const express = require('express');
const router = express.Router();

// NUC-16: Definir áreas
router.post('/', async (req, res) => {
  // TODO: Implementar creación de área
  res.json({ message: 'Endpoint no implementado - NUC-16' });
});

// NUC-17: Ver áreas de una granja
router.get('/granja/:id_granja', async (req, res) => {
  // TODO: Implementar listado de áreas
  res.json({ message: 'Endpoint no implementado - NUC-17' });
});

// NUC-16: Actualizar área
router.put('/:id', async (req, res) => {
  // TODO: Implementar actualización
  res.json({ message: 'Endpoint no implementado - NUC-16' });
});

module.exports = router;
