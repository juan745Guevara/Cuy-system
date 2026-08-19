const express = require('express');
const router = express.Router();

// NUC-27: Registrar venta
router.post('/', async (req, res) => {
  // TODO: Implementar registro de venta
  res.json({ message: 'Endpoint no implementado - NUC-27' });
});

// NUC-27: Ver ventas de una granja
router.get('/granja/:id_granja', async (req, res) => {
  // TODO: Implementar listado de ventas
  res.json({ message: 'Endpoint no implementado - NUC-27' });
});

module.exports = router;
