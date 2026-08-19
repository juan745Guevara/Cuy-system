const express = require('express');
const router = express.Router();

// NUC-28: Ver población actual
router.get('/poblacion/:id_granja', async (req, res) => {
  // TODO: Implementar consulta de población
  res.json({ message: 'Endpoint no implementado - NUC-28' });
});

// NUC-29: Ver resumen mensual
router.get('/resumen/:id_granja', async (req, res) => {
  // TODO: Implementar resumen mensual
  res.json({ message: 'Endpoint no implementado - NUC-29' });
});

// NUC-30: Consolidado por especie
router.get('/consolidado/:id_especie', async (req, res) => {
  // TODO: Implementar consolidado
  res.json({ message: 'Endpoint no implementado - NUC-30' });
});

// NUC-31: Población por área/jaula
router.get('/distribucion/:id_granja', async (req, res) => {
  // TODO: Implementar distribución
  res.json({ message: 'Endpoint no implementado - NUC-31' });
});

module.exports = router;
