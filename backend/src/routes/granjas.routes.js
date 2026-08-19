const express = require('express');
const router = express.Router();

// NUC-04: Administrar granjas
router.post('/', async (req, res) => {
  // TODO: Implementar creación de granja
  res.json({ message: 'Endpoint no implementado - NUC-04' });
});

// NUC-04: Listar granjas
router.get('/', async (req, res) => {
  // TODO: Implementar listado de granjas
  res.json({ message: 'Endpoint no implementado - NUC-04' });
});

// NUC-04: Obtener granja por ID
router.get('/:id', async (req, res) => {
  // TODO: Implementar obtención de granja
  res.json({ message: 'Endpoint no implementado - NUC-04' });
});

// NUC-04: Actualizar granja
router.put('/:id', async (req, res) => {
  // TODO: Implementar actualización
  res.json({ message: 'Endpoint no implementado - NUC-04' });
});

module.exports = router;
