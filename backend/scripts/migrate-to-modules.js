/**
 * Script de migración: estructura plana → módulos con Clean Architecture.
 * Ejecutar una sola vez: node scripts/migrate-to-modules.js
 */
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', 'src');
const SHARED = path.join(SRC, 'shared');

const CORE_MODULES = {
  'auth.routes.js': 'auth',
  'usuarios.routes.js': 'usuarios',
  'granjas.routes.js': 'granjas',
  'areas.routes.js': 'areas',
  'jaulas.routes.js': 'jaulas',
  'animales.routes.js': 'animales',
  'catalogos.routes.js': 'catalogos',
  'movimientos.routes.js': 'movimientos',
  'mortalidad.routes.js': 'mortalidad',
  'ventas.routes.js': 'ventas',
  'inventario.routes.js': 'inventario',
  'pesajes.routes.js': 'pesajes',
  'tratamientos.routes.js': 'tratamientos',
  'auditoria.routes.js': 'auditoria',
  'reportes.routes.js': 'reportes',
};

const CUYES_MODULES = {
  'empadres.routes.js': 'empadres',
  'partos.routes.js': 'partos',
  'destetes.routes.js': 'destetes',
  'alertas.routes.js': 'alertas',
  'ranking.routes.js': 'ranking',
};

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function write(filePath, content) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, 'utf8');
}

function fixImports(content, depthFromSrc) {
  const shared = '../'.repeat(depthFromSrc) + 'shared';
  return content
    .replace(/require\(['"]\.\.\/config\/database['"]\)/g, `require('${shared}/database')`)
    .replace(/require\(['"]\.\.\/utils\/helpers['"]\)/g, `require('${shared}/utils/helpers')`)
    .replace(/require\(['"]\.\.\/utils\/audit['"]\)/g, `require('${shared}/utils/audit')`)
    .replace(/require\(['"]\.\.\/middleware\/auth['"]\)/g, `require('${shared}/middleware/auth')`)
    .replace(
      /require\(['"]\.\.\/utils\/propositoArea['"]\)/g,
      `require('../../../modules/cuyes/domain/propositoArea')`
    )
    .replace(
      /require\(['"]\.\.\/services\/animales\.service['"]\)/g,
      `require('../application/animales.service')`
    );
}

function createModuleIndex(modulePath, featureName, sharedDepth) {
  const sharedPrefix = '../'.repeat(sharedDepth) + 'shared';

  write(
    path.join(modulePath, 'index.js'),
    `const router = require('./presentation/routes');
module.exports = router;
`
  );

  const domainPath = path.join(modulePath, 'domain');
  if (!fs.existsSync(path.join(domainPath, 'index.js'))) {
    write(
      path.join(domainPath, 'index.js'),
      `/** Reglas de dominio — ${featureName} */\nmodule.exports = {};\n`
    );
  }

  const appPath = path.join(modulePath, 'application');
  if (!fs.existsSync(path.join(appPath, 'index.js'))) {
    write(
      path.join(appPath, 'index.js'),
      `/** Casos de uso — ${featureName} */\nmodule.exports = {};\n`
    );
  }

  const infraPath = path.join(modulePath, 'infrastructure');
  if (!fs.existsSync(path.join(infraPath, 'repository.js'))) {
    write(
      path.join(infraPath, 'repository.js'),
      `const { pool } = require('${sharedPrefix}/database');

/** Repositorio — ${featureName} */
module.exports = { pool };
`
    );
  }
}

function migrateRoute(routeFile, targetBase, featureName, sharedDepth) {
  const srcFile = path.join(SRC, 'routes', routeFile);
  if (!fs.existsSync(srcFile)) {
    console.warn(`  SKIP (no existe): ${routeFile}`);
    return;
  }
  const content = fixImports(fs.readFileSync(srcFile, 'utf8'), sharedDepth);
  const modulePath = path.join(targetBase, featureName);
  write(path.join(modulePath, 'presentation', 'routes.js'), content);
  createModuleIndex(modulePath, featureName, sharedDepth);
  console.log(`  OK ${featureName}`);
}

// --- 1. Shared ---
console.log('Migrando shared/...');
ensureDir(path.join(SHARED, 'config'));
ensureDir(path.join(SHARED, 'database'));
ensureDir(path.join(SHARED, 'middleware'));
ensureDir(path.join(SHARED, 'utils'));

// database
write(
  path.join(SHARED, 'database', 'index.js'),
  fs.readFileSync(path.join(SRC, 'config', 'database.js'), 'utf8')
);

// config (schema, migrate, seed)
for (const f of ['schema.sql', 'migrate.js', 'seed.js']) {
  const src = path.join(SRC, 'config', f);
  if (fs.existsSync(src)) {
    let content = fs.readFileSync(src, 'utf8');
    content = content.replace(/require\(['"]\.\/database['"]\)/g, "require('../database')");
    write(path.join(SHARED, 'config', f), content);
  }
}

// middleware
let authContent = fs.readFileSync(path.join(SRC, 'middleware', 'auth.js'), 'utf8');
authContent = authContent.replace(
  /require\(['"]\.\.\/config\/database['"]\)/g,
  "require('../database')"
);
write(path.join(SHARED, 'middleware', 'auth.js'), authContent);

// utils
for (const f of ['helpers.js', 'audit.js']) {
  let content = fs.readFileSync(path.join(SRC, 'utils', f), 'utf8');
  content = content.replace(
    /require\(['"]\.\.\/config\/database['"]\)/g,
    "require('../database')"
  );
  write(path.join(SHARED, 'utils', f), content);
}

// --- 2. Cuyes domain ---
console.log('Migrando modules/cuyes/domain/...');
write(
  path.join(SRC, 'modules', 'cuyes', 'domain', 'propositoArea.js'),
  fs.readFileSync(path.join(SRC, 'utils', 'propositoArea.js'), 'utf8')
);

// --- 3. Core modules ---
console.log('Migrando core/...');
const coreBase = path.join(SRC, 'core');
for (const [routeFile, feature] of Object.entries(CORE_MODULES)) {
  migrateRoute(routeFile, coreBase, feature, 3);
}

// --- 4. Cuyes modules ---
console.log('Migrando modules/cuyes/...');
const cuyesBase = path.join(SRC, 'modules', 'cuyes');
for (const [routeFile, feature] of Object.entries(CUYES_MODULES)) {
  migrateRoute(routeFile, cuyesBase, feature, 4);
}

// --- 5. Animales service → application + repository ---
console.log('Migrando animales service...');
const animalesServiceSrc = path.join(SRC, 'services', 'animales.service.js');
if (fs.existsSync(animalesServiceSrc)) {
  let svc = fs.readFileSync(animalesServiceSrc, 'utf8');
  svc = svc
    .replace(/require\(['"]\.\.\/utils\/helpers['"]\)/g, "require('../../../shared/utils/helpers')")
    .replace(/require\(['"]\.\.\/utils\/audit['"]\)/g, "require('../../../shared/utils/audit')");
  write(path.join(coreBase, 'animales', 'application', 'animales.service.js'), svc);
  write(
    path.join(coreBase, 'animales', 'application', 'index.js'),
    `module.exports = require('./animales.service');\n`
  );
}

// --- 6. Core index ---
write(
  path.join(coreBase, 'index.js'),
  `const express = require('express');
const router = express.Router();

router.use('/auth', require('./auth'));
router.use('/usuarios', require('./usuarios'));
router.use('/granjas', require('./granjas'));
router.use('/areas', require('./areas'));
router.use('/jaulas', require('./jaulas'));
router.use('/animales', require('./animales'));
router.use('/catalogos', require('./catalogos'));
router.use('/movimientos', require('./movimientos'));
router.use('/mortalidad', require('./mortalidad'));
router.use('/ventas', require('./ventas'));
router.use('/inventario', require('./inventario'));
router.use('/pesajes', require('./pesajes'));
router.use('/tratamientos', require('./tratamientos'));
router.use('/auditoria', require('./auditoria'));
router.use('/reportes', require('./reportes'));

module.exports = router;
`
);

// --- 7. Cuyes index ---
write(
  path.join(cuyesBase, 'index.js'),
  `const express = require('express');
const router = express.Router();

router.use('/empadres', require('./empadres'));
router.use('/partos', require('./partos'));
router.use('/destetes', require('./destetes'));
router.use('/alertas', require('./alertas'));
router.use('/ranking', require('./ranking'));

module.exports = router;
`
);

// --- 8. New server.js ---
write(
  path.join(SRC, 'server.js'),
  `require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

if (!process.env.JWT_SECRET) {
  console.error(
    'JWT_SECRET no está definido. Configúralo en .env antes de iniciar el servidor (ver .env.example).'
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

// Núcleo común (NUC)
app.use('/api/v1', require('./core'));

// Módulo cuyes (CUY)
app.use('/api/v1', require('./modules/cuyes'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Sistema de Control de Animales - UNAS' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Error interno' });
});

app.listen(PORT, () => {
  console.log(\`Servidor corriendo en puerto \${PORT}\`);
});

module.exports = app;
`
);

console.log('Migración estructural completada.');
