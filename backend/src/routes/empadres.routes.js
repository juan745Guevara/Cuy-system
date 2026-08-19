const express = require('express');
const router = express.Router();

// CUY-07: Registrar empadre de hembra
// CUY-13: Registrar empadre de macho
router.post('/', async (req, res) => {
  // TODO: Implementar registro de empadre
  res.json({ message: 'Endpoint no implementado - CUY-07/CUY-13' });
});

// CUY-14: Ver empadres de un macho
router.get('/macho/:id_macho', async (req, res) => {
  // TODO: Implementar listado de empadres
  res.json({ message: 'Endpoint no implementado - CUY-14' });
});

// CUY-11: Ver empadres de una hembra
router.get('/hembra/:id_hembra', async (req, res) => {
  // TODO: Implementar listado de empadres
  res.json({ message: 'Endpoint no implementado - CUY-11' });
});

module.exports = router;
