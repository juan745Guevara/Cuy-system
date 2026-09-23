/**
 * Reorganiza backend en core/ + modules/cuyes/ con Clean Architecture por módulo.
 * Una sola BD; rutas HTTP sin cambio de prefijo.
 *
 * Ejecutar: node scripts/restructure-clean-architecture.js
 */
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', 'src');
const CORE = path.join(SRC, 'core');
const CUYES = path.join(SRC, 'modules', 'cuyes');
const SHARED = path.join(SRC, 'shared');

const CORE_FEATURES = ['auth', 'usuarios', 'granjas', 'auditoria'];

const CUYES_FEATURES = [
  'areas',
  'jaulas',
  'animales',
  'catalogos',
  'movimientos',
  'mortalidad',
  'ventas',
  'inventario',
  'pesajes',
  'tratamientos',
  'reportes',
  'empadres',
  'partos',
  'destetes',
  'alertas',
  'ranking',
];

function readIfExists(filePath) {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : null;
}

function write(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
}

function rmrf(dir) {
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
}

function toPascal(name) {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function fixSharedImports(content, sharedPrefix) {
  return content
    .replace(/require\(['"](?:\.\.\/)+shared\//g, `require('${sharedPrefix}shared/`)
    .replace(/require\(['"](?:\.\.\/)+modules\//g, `require('${sharedPrefix}modules/`);
}

function findSourceFile(featureDirs, suffix) {
  const names = {
    service: (feature) => `${feature}.service.js`,
    repository: (feature) => `${feature}.repository.js`,
    routes: (feature) => `${feature}.routes.js`,
  };

  const candidates = [];
  for (const dir of featureDirs) {
    const feature = path.basename(dir);
    const file = names[suffix](feature);
    candidates.push(path.join(dir, file));
    candidates.push(
      path.join(dir, suffix === 'service' ? 'application' : suffix === 'repository' ? 'infrastructure' : 'interfaces', file)
    );
    if (suffix === 'routes') candidates.push(path.join(dir, 'presentation', 'routes.js'));
    if (suffix === 'service') candidates.push(path.join(dir, 'application', file));
    if (suffix === 'repository') candidates.push(path.join(dir, 'infrastructure', file));
  }

  for (const file of candidates) {
    if (fs.existsSync(file)) return file;
  }
  return null;
}

function featureDirsFor(feature, modulePaths) {
  return modulePaths
    .map((modulePath) => path.join(modulePath, feature))
    .filter((dir) => fs.existsSync(dir));
}

function migrateFeature({ feature, sourceModulePaths, targetModule, sharedPrefix }) {
  const sourceDirs = featureDirsFor(feature, sourceModulePaths);
  const serviceSrc = findSourceFile(sourceDirs, 'service');
  const repoSrc = findSourceFile(sourceDirs, 'repository');
  const routesSrc = findSourceFile(sourceDirs, 'routes');

  if (!routesSrc) {
    console.warn(`  SKIP ${feature}: sin routes`);
    return false;
  }

  const appDir = path.join(targetModule, 'application');
  const infraDir = path.join(targetModule, 'infrastructure');
  const ifaceDir = path.join(targetModule, 'interfaces');

  if (serviceSrc) {
    write(
      path.join(appDir, `${feature}.service.js`),
      fixSharedImports(readIfExists(serviceSrc), sharedPrefix)
    );
  }

  if (repoSrc) {
    write(
      path.join(infraDir, `${feature}.repository.js`),
      fixSharedImports(readIfExists(repoSrc), sharedPrefix)
    );
  }

  write(
    path.join(ifaceDir, `${feature}.routes.js`),
    fixSharedImports(readIfExists(routesSrc), sharedPrefix)
  );

  console.log(`  OK ${feature}`);
  return { feature, sourceDir: sourceDirs[0] || null };
}

const migrated = { core: [], cuyes: [] };

function ensureDomain(modulePath) {
  const domainDir = path.join(modulePath, 'domain');
  fs.mkdirSync(domainDir, { recursive: true });

  if (!fs.existsSync(path.join(domainDir, 'index.js'))) {
    write(path.join(domainDir, 'index.js'), '/** Reglas de dominio del módulo */\nmodule.exports = {};\n');
  }
}

function createRouter(modulePath, features, moduleName) {
  const relShared = moduleName === 'core' ? '../../shared' : '../../../shared';
  const lines = features.map(([feature, pascal]) => {
    return `  router.use('/${feature}', composeModule({
    createRepository: require('../infrastructure/${feature}.repository').create${pascal}Repository,
    createService: require('../application/${feature}.service').create${pascal}Service,
    createRoutes: require('../interfaces/${feature}.routes').create${pascal}Routes,
    deps,
  }));`;
  });

  write(
    path.join(modulePath, 'composition', 'router.js'),
    `const express = require('express');
const { composeModule } = require('${relShared}/kernel/composeModule');

function create${moduleName === 'core' ? 'Core' : 'Cuyes'}Router(deps) {
  const router = express.Router();
${lines.join('\n\n')}
  return router;
}

module.exports = { create${moduleName === 'core' ? 'Core' : 'Cuyes'}Router };
`
  );

  write(
    path.join(modulePath, 'index.js'),
    `const { create${moduleName === 'core' ? 'Core' : 'Cuyes'}Router } = require('./composition/router');

/** Composition root — recibe deps inyectadas desde server.js */
module.exports = function create${moduleName === 'core' ? 'Core' : 'Cuyes'}Module(deps) {
  return create${moduleName === 'core' ? 'Core' : 'Cuyes'}Router(deps);
};
`
  );
}

function cleanupOldFeatureDirs(modulePath, migratedFeatures) {
  for (const feature of migratedFeatures) {
    rmrf(path.join(modulePath, feature));
  }
}

function updateDeps() {
  write(
    path.join(SHARED, 'deps.js'),
    `const { createDatabase } = require('./contracts/database');
const { createAuditLogger } = require('./contracts/auditLogger');
const { createNoOpAreaRules } = require('./species/areaRulesPort');

/** Dependencias compartidas inyectables en todos los módulos. */
function createSharedDeps(overrides = {}) {
  return {
    db: createDatabase(overrides),
    audit: createAuditLogger(overrides),
    areaRules: overrides.areaRules || createNoOpAreaRules(),
    ...overrides,
  };
}

module.exports = { createSharedDeps, createNoOpAreaRules };
`
  );
}

function updateServer() {
  write(
    path.join(SRC, 'server.js'),
    `require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { createSharedDeps } = require('./shared/deps');
const cuyesAreaRules = require('./modules/cuyes/domain/areaRules.adapter');

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

const deps = createSharedDeps({ areaRules: cuyesAreaRules });

// Plataforma (auth, usuarios, granjas, auditoría)
app.use('/api/v1', require('./core')(deps));

// Módulo cuyes (operaciones de la especie)
app.use('/api/v1', require('./modules/cuyes')(deps));

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
}

// --- main ---
console.log('Reestructurando core/ (Clean Architecture)...');
ensureDomain(CORE);

for (const feature of CORE_FEATURES) {
  const result = migrateFeature({
    feature,
    sourceModulePaths: [CORE],
    targetModule: CORE,
    sharedPrefix: '../../',
  });
  if (result) migrated.core.push(feature);
}

createRouter(
  CORE,
  CORE_FEATURES.map((f) => [f, toPascal(f)]),
  'core'
);

console.log('Reestructurando modules/cuyes/ (Clean Architecture)...');
ensureDomain(CUYES);

for (const feature of CUYES_FEATURES) {
  const result = migrateFeature({
    feature,
    sourceModulePaths: [CUYES, CORE],
    targetModule: CUYES,
    sharedPrefix: '../../../',
  });
  if (result) migrated.cuyes.push(feature);
}

createRouter(
  CUYES,
  CUYES_FEATURES.map((f) => [f, toPascal(f)]),
  'cuyes'
);

console.log('Limpiando carpetas planas antiguas (solo migradas)...');
cleanupOldFeatureDirs(CORE, migrated.core);
cleanupOldFeatureDirs(CUYES, migrated.cuyes);

updateDeps();
updateServer();

console.log('Reestructura completada.');
