const express = require('express');
const router = express.Router();

// NUC-26: Registrar mortalidad
router.post('/', async (req, res) => {
  // TODO: Implementar registro de mortalidad
  res.json({ message: 'Endpoint no implementado - NUC-26' });
});

// NUC-26: Ver mortalidad de una granja
router.get('/granja/:id_granja', async (req, res) => {
  // TODO: Implementar listado de mortalidad
  res.json({ message: 'Endpoint no implementado - NUC-26' });
});

module.exports = router;
