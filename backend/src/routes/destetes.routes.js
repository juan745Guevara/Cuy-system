const express = require('express');
const router = express.Router();

// CUY-09: Registrar destete
router.post('/', async (req, res) => {
  // TODO: Implementar registro de destete
  res.json({ message: 'Endpoint no implementado - CUY-09' });
});

// CUY-11: Ver destetes de un parto
router.get('/parto/:id_parto', async (req, res) => {
  // TODO: Implementar listado de destetes
  res.json({ message: 'Endpoint no implementado - CUY-11' });
});

module.exports = router;
