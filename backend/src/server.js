require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { createSharedDeps } = require('./shared/deps');

if (!process.env.JWT_SECRET) {
  console.error(
    'JWT_SECRET is not set. Configure it in .env before starting the server (see .env.example).'
  );
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3001;

const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000')
  .split(',')
  .map((o) => o.trim());

app.use(helmet());
app.use(
  cors({
    origin: allowedOrigins,
  })
);
app.use(express.json());

const deps = createSharedDeps();

app.use('/api/v1', require('./platform')(deps));
app.use('/api/v1/cuyes', require('./modules/cuyes')(deps));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Animal Control System - UNAS' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal error' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
