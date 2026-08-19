const express = require('express');
const router = express.Router();

// NUC-14: Registrar traslado dentro de la granja
router.post('/traslado', async (req, res) => {
  // TODO: Implementar traslado
  res.json({ message: 'Endpoint no implementado - NUC-14' });
});

// NUC-20: Transferir entre granjas
router.post('/transferencia', async (req, res) => {
  // TODO: Implementar transferencia
  res.json({ message: 'Endpoint no implementado - NUC-20' });
});

// NUC-15: Ver historial de movimientos
router.get('/animal/:id_animal', async (req, res) => {
  // TODO: Implementar historial de movimientos
  res.json({ message: 'Endpoint no implementado - NUC-15' });
});

module.exports = router;
