const express = require('express');
const router = express.Router();

// NUC-21: Registrar peso individual
router.post('/', async (req, res) => {
  // TODO: Implementar registro de peso
  res.json({ message: 'Endpoint no implementado - NUC-21' });
});

// NUC-22: Registrar pesaje por lote
router.post('/lote', async (req, res) => {
  // TODO: Implementar pesaje por lote
  res.json({ message: 'Endpoint no implementado - NUC-22' });
});

// NUC-23: Ver evolución del peso
router.get('/animal/:id_animal', async (req, res) => {
  // TODO: Implementar historial de pesos
  res.json({ message: 'Endpoint no implementado - NUC-23' });
});

module.exports = router;
