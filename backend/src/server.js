require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/v1/auth', require('./routes/auth.routes'));
app.use('/api/v1/usuarios', require('./routes/usuarios.routes'));
app.use('/api/v1/granjas', require('./routes/granjas.routes'));
app.use('/api/v1/areas', require('./routes/areas.routes'));
app.use('/api/v1/jaulas', require('./routes/jaulas.routes'));
app.use('/api/v1/animales', require('./routes/animales.routes'));
app.use('/api/v1/catalogos', require('./routes/catalogos.routes'));
app.use('/api/v1/empadres', require('./routes/empadres.routes'));
app.use('/api/v1/partos', require('./routes/partos.routes'));
app.use('/api/v1/destetes', require('./routes/destetes.routes'));
app.use('/api/v1/mortalidad', require('./routes/mortalidad.routes'));
app.use('/api/v1/ventas', require('./routes/ventas.routes'));
app.use('/api/v1/inventario', require('./routes/inventario.routes'));
app.use('/api/v1/reportes', require('./routes/reportes.routes'));
app.use('/api/v1/pesajes', require('./routes/pesajes.routes'));
app.use('/api/v1/movimientos', require('./routes/movimientos.routes'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Sistema de Control de Animales - UNAS' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Error interno' });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});

module.exports = app;
