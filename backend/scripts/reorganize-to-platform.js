/**
 * Reorganize: core/ → platform/, cleanup legacy, /cuyes prefix, species module.
 * Run: node scripts/reorganize-to-platform.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const SRC = path.join(ROOT, 'backend', 'src');
const FRONTEND = path.join(ROOT, 'frontend', 'src');
const CORE = path.join(SRC, 'core');
const PLATFORM = path.join(SRC, 'platform');

const CA_DIRS = ['application', 'infrastructure', 'interfaces', 'domain', 'composition'];

function rmrf(dir) {
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
}

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(from, to);
    else fs.copyFileSync(from, to);
  }
}

function write(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content, 'utf8');
}

console.log('Creating platform/ from core/ CA layers...');
rmrf(PLATFORM);
for (const dir of CA_DIRS) {
  copyDir(path.join(CORE, dir), path.join(PLATFORM, dir));
}

write(
  path.join(PLATFORM, 'index.js'),
  `const { createPlatformRouter } = require('./composition/router');

/** Platform module — auth, users, farms, species, audit */
module.exports = function createPlatformModule(deps) {
  return createPlatformRouter(deps);
};
`
);

write(
  path.join(PLATFORM, 'composition', 'router.js'),
  `const express = require('express');
const { composeModule } = require('../../shared/kernel/composeModule');

function createPlatformRouter(deps) {
  const router = express.Router();

  const modules = [
    ['auth', 'Auth'],
    ['users', 'Users'],
    ['farms', 'Farms'],
    ['species', 'Species'],
    ['audit', 'Audit'],
  ];

  for (const [route, Pascal] of modules) {
    router.use(
      \`/\${route}\`,
      composeModule({
        createRepository: require(\`../infrastructure/\${route}.repository\`).[\`create\${Pascal}Repository\`],
        createService: require(\`../application/\${route}.service\`).[\`create\${Pascal}Service\`],
        createRoutes: require(\`../interfaces/\${route}.routes\`).[\`create\${Pascal}Routes\`],
        deps,
      })
    );
  }

  return router;
}

module.exports = { createPlatformRouter };
`
);

write(
  path.join(PLATFORM, 'infrastructure', 'species.repository.js'),
  `function createSpeciesRepository({ db }) {
  return {
    async listActive() {
      const { rows } = await db.query(
        \`SELECT id, nombre AS name FROM especies WHERE activo = true ORDER BY nombre\`
      );
      return rows;
    },
  };
}

module.exports = { createSpeciesRepository };
`
);

write(
  path.join(PLATFORM, 'application', 'species.service.js'),
  `const { ok } = require('../../shared/kernel/ServiceResult');

function createSpeciesService({ repository }) {
  return {
    async list() {
      return ok(await repository.listActive());
    },

    /** Species the user can access (from assigned farms). */
    listForUser(userFarms) {
      const map = new Map();
      for (const farm of userFarms || []) {
        if (farm.id_especie && !map.has(farm.id_especie)) {
          map.set(farm.id_especie, {
            id: farm.id_especie,
            name: farm.especie || farm.species || String(farm.id_especie),
          });
        }
      }
      return ok([...map.values()].sort((a, b) => a.name.localeCompare(b.name)));
    },
  };
}

module.exports = { createSpeciesService };
`
);

write(
  path.join(PLATFORM, 'interfaces', 'species.routes.js'),
  `const express = require('express');
const { asyncHandler } = require('../../shared/utils/helpers');
const { sendResult } = require('../../shared/kernel/sendResult');
const { authRequired, loadUserFarms } = require('../../shared/middleware/auth');

function createSpeciesRoutes(service) {
  const router = express.Router();

  router.get(
    '/',
    authRequired,
    loadUserFarms,
    asyncHandler(async (req, res) => {
      if (req.user.rol === 'superadmin') {
        sendResult(res, await service.list());
      } else {
        sendResult(res, service.listForUser(req.userFarms));
      }
    })
  );

  return router;
}

module.exports = { createSpeciesRoutes };
`
);

// Patch farms service + routes for species filter
const farmsServicePath = path.join(PLATFORM, 'application', 'farms.service.js');
let farmsSvc = fs.readFileSync(farmsServicePath, 'utf8');
farmsSvc = farmsSvc.replace(
  'list(userFarms) {\n      return ok(userFarms);',
  'list(userFarms, query = {}) {\n      let farms = userFarms || [];\n      if (query.species_id) {\n        const sid = Number(query.species_id);\n        farms = farms.filter((f) => Number(f.id_especie) === sid);\n      }\n      return ok(farms);'
);
write(farmsServicePath, farmsSvc);

const farmsRoutesPath = path.join(PLATFORM, 'interfaces', 'farms.routes.js');
let farmsRoutes = fs.readFileSync(farmsRoutesPath, 'utf8');
farmsRoutes = farmsRoutes.replace(
  'sendResult(res, service.list(req.userFarms));',
  'sendResult(res, service.list(req.userFarms, req.query));'
);
write(farmsRoutesPath, farmsRoutes);

// Middleware: requireSpecies + farm/species check
const authMiddlewarePath = path.join(SRC, 'shared', 'middleware', 'auth.js');
let authMw = fs.readFileSync(authMiddlewarePath, 'utf8');
if (!authMw.includes('requireSpecies')) {
  authMw = authMw.replace(
    'function requireFarmAccess(req, res, next) {',
    `async function requireSpecies(req, res, next) {
  const speciesId = Number(
    req.headers['x-species-id'] || req.query.species_id
  );
  if (!speciesId) {
    return res.status(400).json({
      error: 'Provide the active species (header x-species-id)',
    });
  }
  try {
    const { rows } = await pool.query(
      \`SELECT id, nombre FROM especies WHERE id = $1 AND activo = true\`,
      [speciesId]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Species not found' });
    req.speciesId = speciesId;
    req.species = rows[0];
    return next();
  } catch (err) {
    return next(err);
  }
}

function requireFarmAccess(req, res, next) {`
  );
  authMw = authMw.replace(
    `.query(\`SELECT activa FROM granjas WHERE id = $1\`, [farmId])`,
    `.query(\`SELECT activa, id_especie FROM granjas WHERE id = $1\`, [farmId])`
  );
  authMw = authMw.replace(
    `if (!rows[0]) return res.status(404).json({ error: 'Farm not found' });`,
    `if (!rows[0]) return res.status(404).json({ error: 'Farm not found' });
      if (req.speciesId && Number(rows[0].id_especie) !== Number(req.speciesId)) {
        return res.status(403).json({ error: 'Farm does not belong to the active species' });
      }`
  );
  authMw = authMw.replace(
    'module.exports = {',
    `module.exports = {
  requireSpecies,`
  );
  write(authMiddlewarePath, authMw);
}

// Cuyes module: species middleware + inject areaRules locally
write(
  path.join(SRC, 'modules', 'cuyes', 'index.js'),
  `const express = require('express');
const { requireSpecies } = require('../../shared/middleware/auth');
const { createCuyesRouter } = require('./composition/router');
const cuyesAreaRules = require('./domain/areaRules.adapter');

/** Cuyes species module — requires x-species-id on every request */
module.exports = function createCuyesModule(deps) {
  const router = express.Router();
  const moduleDeps = { ...deps, areaRules: cuyesAreaRules };
  router.use(requireSpecies);
  router.use(createCuyesRouter(moduleDeps));
  return router;
};
`
);

write(
  path.join(SRC, 'server.js'),
  `require('dotenv').config();
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
  console.log(\`Server running on port \${PORT}\`);
});

module.exports = app;
`
);

// Remove species from cuyes catalogs routes
const catalogsRoutes = path.join(SRC, 'modules', 'cuyes', 'interfaces', 'catalogs.routes.js');
if (fs.existsSync(catalogsRoutes)) {
  let c = fs.readFileSync(catalogsRoutes, 'utf8');
  c = c.replace(/\s*router\.get\(\s*'\/species',[\s\S]*?\);\s*/m, '\n');
  c = c.replace("'/razas/:id/deactivate'", "'/breeds/:id/deactivate'");
  c = c.replace("'/categorias/:id/deactivate'", "'/categories/:id/deactivate'");
  write(catalogsRoutes, c);
}

// Cleanup legacy
console.log('Removing legacy folders...');
rmrf(CORE);
rmrf(path.join(SRC, 'routes'));
rmrf(path.join(SRC, 'config'));
rmrf(path.join(SRC, 'middleware'));
rmrf(path.join(SRC, 'utils'));
rmrf(path.join(SRC, 'services'));

for (const legacy of ['empadres', 'partos', 'destetes', 'alertas', 'ranking']) {
  rmrf(path.join(SRC, 'modules', 'cuyes', legacy));
}

// Frontend: /cuyes prefix + species header + species endpoint
const PLATFORM_PREFIXES = ['/auth', '/users', '/farms', '/audit', '/species', '/api/health'];

function patchFrontendApiPaths(content) {
  let out = content;
  const re = /api\.(get|post|put|patch|delete)\(\s*`(\/[^`]+)`/g;
  out = out.replace(re, (match, method, route) => {
    if (PLATFORM_PREFIXES.some((p) => route.startsWith(p))) return match;
    if (route.startsWith('/cuyes/')) return match;
    return `api.${method}(\`/cuyes${route}\``;
  });
  const re2 = /api\.(get|post|put|patch|delete)\(\s*'(\/[^']+)'/g;
  out = out.replace(re2, (match, method, route) => {
    if (PLATFORM_PREFIXES.some((p) => route.startsWith(p))) return match;
    if (route.startsWith('/cuyes/')) return match;
    return `api.${method}('/cuyes${route}'`;
  });
  out = out.replace('/catalogs/species', '/species');
  return out;
}

function walkJs(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const f = path.join(dir, e.name);
    if (e.isDirectory()) walkJs(f, files);
    else if (e.name.endsWith('.js')) files.push(f);
  }
  return files;
}

for (const file of walkJs(FRONTEND)) {
  const content = fs.readFileSync(file, 'utf8');
  const next = patchFrontendApiPaths(content);
  if (next !== content) {
    fs.writeFileSync(file, next, 'utf8');
    console.log('Patched frontend', path.relative(ROOT, file));
  }
}

// api.js species header
const apiPath = path.join(FRONTEND, 'services', 'api.js');
let apiJs = fs.readFileSync(apiPath, 'utf8');
if (!apiJs.includes('x-species-id')) {
  apiJs = apiJs.replace(
    "if (farmId) config.headers['x-farm-id'] = farmId;",
    `if (farmId) config.headers['x-farm-id'] = farmId;
  const speciesId = localStorage.getItem('speciesId');
  if (speciesId) config.headers['x-species-id'] = speciesId;`
  );
  write(apiPath, apiJs);
}

// AuthContext speciesId on farm selection
const authPath = path.join(FRONTEND, 'context', 'AuthContext.js');
let authCtx = fs.readFileSync(authPath, 'utf8');
if (!authCtx.includes('speciesId')) {
  authCtx = authCtx.replace(
    'const seleccionarGranja = (id) => {',
    `const seleccionarGranja = (id) => {
    const farm = granjas.find((g) => Number(g.id) === Number(id));`
  );
  authCtx = authCtx.replace(
    "else localStorage.setItem('farmId', String(id));",
    `else {
      localStorage.setItem('farmId', String(id));
      if (farm?.id_especie) localStorage.setItem('speciesId', String(farm.id_especie));
    }`
  );
  authCtx = authCtx.replace(
    'localStorage.removeItem(\'farmId\');',
    `localStorage.removeItem('farmId');
    localStorage.removeItem('speciesId');`
  );
  authCtx = authCtx.replace(
    'if (data.granjas?.length === 1) {\n      localStorage.setItem(\'farmId\', String(data.granjas[0].id));\n      setGranjaActiva(data.granjas[0].id);',
    `if (data.granjas?.length === 1) {
      localStorage.setItem('farmId', String(data.granjas[0].id));
      if (data.granjas[0].id_especie) {
        localStorage.setItem('speciesId', String(data.granjas[0].id_especie));
      }
      setGranjaActiva(data.granjas[0].id);`
  );
  authCtx = authCtx.replace(
    'localStorage.removeItem(\'farmId\');\n    localStorage.removeItem(\'speciesId\');',
    `localStorage.removeItem('farmId');
      localStorage.removeItem('speciesId');`,
    1
  );
  write(authPath, authCtx);
}

console.log('Done. platform/ ready, legacy removed.');
