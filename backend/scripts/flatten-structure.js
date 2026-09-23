/**
 * Aplana la estructura: elimina capas vacías domain/application/infrastructure/presentation
 * y deja archivos planos por feature: *.routes.js, *.service.js, *.repository.js
 */
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', 'src');

const CORE_FEATURES = [
  'auth', 'usuarios', 'granjas', 'areas', 'jaulas', 'animales', 'catalogos',
  'movimientos', 'mortalidad', 'ventas', 'inventario', 'pesajes',
  'tratamientos', 'auditoria', 'reportes',
];

const CUYES_FEATURES = ['empadres', 'partos', 'destetes', 'alertas', 'ranking'];

function read(file) {
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
}

function write(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content, 'utf8');
}

function rmrf(dir) {
  if (!fs.existsSync(dir)) return;
  fs.rmSync(dir, { recursive: true, force: true });
}

function fixSharedImports(content, levelsUpToSrc) {
  const prefix = '../'.repeat(levelsUpToSrc);
  return content
    .replace(/require\(['"](?:\.\.\/)+shared\//g, `require('${prefix}shared/`)
    .replace(/require\(['"](?:\.\.\/)+modules\//g, `require('${prefix}modules/`)
    .replace(/require\(['"]\.\.\/application\/animales\.service['"]\)/g, "require('./animales.service')")
    .replace(/require\(['"]\.\.\/infrastructure\/animales\.repository['"]\)/g, "require('./animales.repository')");
}

function flattenFeature(basePath, feature, levelsUpToSrc) {
  const modulePath = path.join(basePath, feature);
  const routesSrc = path.join(modulePath, 'presentation', 'routes.js');
  const routesContent = read(routesSrc);
  if (!routesContent) {
    console.warn(`  SKIP ${feature}: sin presentation/routes.js`);
    return;
  }

  write(
    path.join(modulePath, `${feature}.routes.js`),
    fixSharedImports(routesContent, levelsUpToSrc)
  );

  // Animales: mover service y repository al nivel del feature
  if (feature === 'animales') {
    const svc = read(path.join(modulePath, 'application', 'animales.service.js'));
    const repo = read(path.join(modulePath, 'infrastructure', 'animales.repository.js'));
    if (svc) {
      write(
        path.join(modulePath, 'animales.service.js'),
        fixSharedImports(svc, levelsUpToSrc)
      );
    }
    if (repo) {
      write(
        path.join(modulePath, 'animales.repository.js'),
        fixSharedImports(repo, levelsUpToSrc)
      );
    }
  }

  write(
    path.join(modulePath, 'index.js'),
    `module.exports = require('./${feature}.routes');\n`
  );

  // Eliminar subcarpetas de capas
  for (const layer of ['presentation', 'application', 'infrastructure', 'domain']) {
    rmrf(path.join(modulePath, layer));
  }

  console.log(`  OK ${feature}`);
}

console.log('Aplanando core/...');
for (const f of CORE_FEATURES) {
  flattenFeature(path.join(SRC, 'core'), f, 2);
}

console.log('Aplanando modules/cuyes/...');
for (const f of CUYES_FEATURES) {
  flattenFeature(path.join(SRC, 'modules', 'cuyes'), f, 3);
}

// Limpiar restos viejos en src/
for (const dir of ['routes', 'services', 'config', 'middleware', 'utils']) {
  rmrf(path.join(SRC, dir));
}

console.log('Estructura aplanada.');
