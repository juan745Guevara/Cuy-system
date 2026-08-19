const express = require('express');
const router = express.Router();

// NUC-01: Iniciar sesión
router.post('/login', async (req, res) => {
  // TODO: Implementar login con JWT
  res.json({ message: 'Endpoint no implementado - NUC-01' });
});

// NUC-01: Cerrar sesión
router.post('/logout', async (req, res) => {
  // TODO: Implementar logout
  res.json({ message: 'Endpoint no implementado - NUC-01' });
});

module.exports = router;
