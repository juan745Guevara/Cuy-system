const express = require('express');
const router = express.Router();

// NUC-09: Registrar un animal
router.post('/', async (req, res) => {
  // TODO: Implementar registro de animal
  res.json({ message: 'Endpoint no implementado - NUC-09' });
});

// NUC-11: Buscar animal por código
router.get('/buscar', async (req, res) => {
  // TODO: Implementar búsqueda por código
  res.json({ message: 'Endpoint no implementado - NUC-11' });
});

// NUC-12: Listar animales
router.get('/', async (req, res) => {
  // TODO: Implementar listado con filtros
  res.json({ message: 'Endpoint no implementado - NUC-12' });
});

// NUC-11: Obtener animal por ID
router.get('/:id', async (req, res) => {
  // TODO: Implementar obtención de animal
  res.json({ message: 'Endpoint no implementado - NUC-11' });
});

// NUC-10: Actualizar animal
router.put('/:id', async (req, res) => {
  // TODO: Implementar actualización
  res.json({ message: 'Endpoint no implementado - NUC-10' });
});

module.exports = router;
