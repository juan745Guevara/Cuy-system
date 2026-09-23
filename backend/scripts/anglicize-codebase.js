/**
 * Anglicize active backend CA structure + shared kernel.
 * DB table/column names in SQL stay as-is (legacy schema); JS/API layer uses English.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const BACKEND = path.join(ROOT, 'backend', 'src');
const FRONTEND = path.join(ROOT, 'frontend', 'src');

const ACTIVE_DIRS = [
  path.join(BACKEND, 'core'),
  path.join(BACKEND, 'modules', 'cuyes'),
  path.join(BACKEND, 'shared'),
  path.join(BACKEND, 'server.js'),
];

const SKIP_DIRS = new Set(['node_modules', '.git']);

const FILE_RENAMES = {
  // core
  'granjas.service.js': 'farms.service.js',
  'granjas.repository.js': 'farms.repository.js',
  'granjas.routes.js': 'farms.routes.js',
  'usuarios.service.js': 'users.service.js',
  'usuarios.repository.js': 'users.repository.js',
  'usuarios.routes.js': 'users.routes.js',
  'auditoria.service.js': 'audit.service.js',
  'auditoria.repository.js': 'audit.repository.js',
  'auditoria.routes.js': 'audit.routes.js',
  // cuyes
  'jaulas.service.js': 'cages.service.js',
  'jaulas.repository.js': 'cages.repository.js',
  'jaulas.routes.js': 'cages.routes.js',
  'animales.service.js': 'animals.service.js',
  'animales.repository.js': 'animals.repository.js',
  'animales.routes.js': 'animals.routes.js',
  'catalogos.service.js': 'catalogs.service.js',
  'catalogos.repository.js': 'catalogs.repository.js',
  'catalogos.routes.js': 'catalogs.routes.js',
  'movimientos.service.js': 'movements.service.js',
  'movimientos.repository.js': 'movements.repository.js',
  'movimientos.routes.js': 'movements.routes.js',
  'mortalidad.service.js': 'mortality.service.js',
  'mortalidad.repository.js': 'mortality.repository.js',
  'mortalidad.routes.js': 'mortality.routes.js',
  'ventas.service.js': 'sales.service.js',
  'ventas.repository.js': 'sales.repository.js',
  'ventas.routes.js': 'sales.routes.js',
  'inventario.service.js': 'inventory.service.js',
  'inventario.repository.js': 'inventory.repository.js',
  'inventario.routes.js': 'inventory.routes.js',
  'pesajes.service.js': 'weighings.service.js',
  'pesajes.repository.js': 'weighings.repository.js',
  'pesajes.routes.js': 'weighings.routes.js',
  'tratamientos.service.js': 'treatments.service.js',
  'tratamientos.repository.js': 'treatments.repository.js',
  'tratamientos.routes.js': 'treatments.routes.js',
  'reportes.service.js': 'reports.service.js',
  'reportes.repository.js': 'reports.repository.js',
  'reportes.routes.js': 'reports.routes.js',
  'empadres.service.js': 'breedings.service.js',
  'empadres.repository.js': 'breedings.repository.js',
  'empadres.routes.js': 'breedings.routes.js',
  'partos.service.js': 'births.service.js',
  'partos.repository.js': 'births.repository.js',
  'partos.routes.js': 'births.routes.js',
  'destetes.service.js': 'weanings.service.js',
  'destetes.repository.js': 'weanings.repository.js',
  'destetes.routes.js': 'weanings.routes.js',
  'alertas.service.js': 'alerts.service.js',
  'alertas.repository.js': 'alerts.repository.js',
  'alertas.routes.js': 'alerts.routes.js',
  'propositoArea.js': 'areaPurpose.js',
};

const REPLACEMENTS = [
  // Factory / type names (longest first)
  ['createGranjasRepository', 'createFarmsRepository'],
  ['createGranjasService', 'createFarmsService'],
  ['createGranjasRoutes', 'createFarmsRoutes'],
  ['createUsuariosRepository', 'createUsersRepository'],
  ['createUsuariosService', 'createUsersService'],
  ['createUsuariosRoutes', 'createUsersRoutes'],
  ['createAuditoriaRepository', 'createAuditRepository'],
  ['createAuditoriaService', 'createAuditService'],
  ['createAuditoriaRoutes', 'createAuditRoutes'],
  ['createJaulasRepository', 'createCagesRepository'],
  ['createJaulasService', 'createCagesService'],
  ['createJaulasRoutes', 'createCagesRoutes'],
  ['createAnimalesRepository', 'createAnimalsRepository'],
  ['createAnimalesService', 'createAnimalsService'],
  ['createAnimalesRoutes', 'createAnimalsRoutes'],
  ['createCatalogosRepository', 'createCatalogsRepository'],
  ['createCatalogosService', 'createCatalogsService'],
  ['createCatalogosRoutes', 'createCatalogsRoutes'],
  ['createMovimientosRepository', 'createMovementsRepository'],
  ['createMovimientosService', 'createMovementsService'],
  ['createMovimientosRoutes', 'createMovementsRoutes'],
  ['createMortalidadRepository', 'createMortalityRepository'],
  ['createMortalidadService', 'createMortalityService'],
  ['createMortalidadRoutes', 'createMortalityRoutes'],
  ['createVentasRepository', 'createSalesRepository'],
  ['createVentasService', 'createSalesService'],
  ['createVentasRoutes', 'createSalesRoutes'],
  ['createInventarioRepository', 'createInventoryRepository'],
  ['createInventarioService', 'createInventoryService'],
  ['createInventarioRoutes', 'createInventoryRoutes'],
  ['createPesajesRepository', 'createWeighingsRepository'],
  ['createPesajesService', 'createWeighingsService'],
  ['createPesajesRoutes', 'createWeighingsRoutes'],
  ['createTratamientosRepository', 'createTreatmentsRepository'],
  ['createTratamientosService', 'createTreatmentsService'],
  ['createTratamientosRoutes', 'createTreatmentsRoutes'],
  ['createReportesRepository', 'createReportsRepository'],
  ['createReportesService', 'createReportsService'],
  ['createReportesRoutes', 'createReportsRoutes'],
  ['createEmpadresRepository', 'createBreedingsRepository'],
  ['createEmpadresService', 'createBreedingsService'],
  ['createEmpadresRoutes', 'createBreedingsRoutes'],
  ['createPartosRepository', 'createBirthsRepository'],
  ['createPartosService', 'createBirthsService'],
  ['createPartosRoutes', 'createBirthsRoutes'],
  ['createDestetesRepository', 'createWeaningsRepository'],
  ['createDestetesService', 'createWeaningsService'],
  ['createDestetesRoutes', 'createWeaningsRoutes'],
  ['createAlertasRepository', 'createAlertsRepository'],
  ['createAlertasService', 'createAlertsService'],
  ['createAlertasRoutes', 'createAlertsRoutes'],
  // Domain
  ['propositoArea', 'areaPurpose'],
  ['normalizeProposito', 'normalizePurpose'],
  ['getPropositos', 'getPurposes'],
  ['animalFueraDeArea', 'isAnimalOutOfArea'],
  ['animalCorrespondeAlArea', 'animalMatchesArea'],
  // Variables / params
  ['granjaId', 'farmId'],
  ['idGranja', 'farmId'],
  ['req.granjaId', 'req.farmId'],
  ['requireFarmAccess', 'requireFarmAccess'],
  // API routes (mount paths)
  ["router.use('/granjas'", "router.use('/farms'"],
  ["router.use('/usuarios'", "router.use('/users'"],
  ["router.use('/auditoria'", "router.use('/audit'"],
  ["router.use('/jaulas'", "router.use('/cages'"],
  ["router.use('/animales'", "router.use('/animals'"],
  ["router.use('/catalogos'", "router.use('/catalogs'"],
  ["router.use('/movimientos'", "router.use('/movements'"],
  ["router.use('/mortalidad'", "router.use('/mortality'"],
  ["router.use('/ventas'", "router.use('/sales'"],
  ["router.use('/inventario'", "router.use('/inventory'"],
  ["router.use('/pesajes'", "router.use('/weighings'"],
  ["router.use('/tratamientos'", "router.use('/treatments'"],
  ["router.use('/reportes'", "router.use('/reports'"],
  ["router.use('/empadres'", "router.use('/breedings'"],
  ["router.use('/partos'", "router.use('/births'"],
  ["router.use('/destetes'", "router.use('/weanings'"],
  ["router.use('/alertas'", "router.use('/alerts'"],
  // Sub-routes
  ["'/desactivar'", "'/deactivate'"],
  ["'/reproductoras'", "'/breeding-females'"],
  ["'/reproductores'", "'/breeding-males'"],
  ["'/cerrar'", "'/close'"],
  ["'/descartar'", "'/discard'"],
  ["'/anular'", "'/void'"],
  ["'/traslado'", "'/relocate'"],
  ["'/transferencia'", "'/transfer'"],
  ["'/fuera-de-area'", "'/out-of-area'"],
  ["'/en-curso'", "'/in-progress'"],
  ["'/terminar'", "'/complete'"],
  ["'/jaulas-destino'", "'/destination-cages'"],
  ["'/resumen-mensual'", "'/monthly-summary'"],
  ["'/por-area'", "'/by-area'"],
  ["'/por-categoria-area'", "'/by-category-area'"],
  ["'/hembras'", "'/females'"],
  ["'/machos'", "'/males'"],
  ["'/inventario-mensual'", "'/monthly-inventory'"],
  ["'/buscar/'", "'/search/'"],
  ["'/ocupacion'", "'/occupancy'"],
  ["'/poblacion'", "'/population'"],
  ["'/descartes'", "'/discards'"],
  ["'/transiciones'", "'/transitions'"],
  ["'/promedio'", "'/average'"],
  ["'/rangos'", "'/ranges'"],
  ["'/consolidado'", "'/consolidated'"],
  ["'/razas'", "'/breeds'"],
  ["'/categorias'", "'/categories'"],
  ["'/especies'", "'/species'"],
  ["'/sobrecupo'", "'/overcapacity'"],
  ["'/marcar'", "'/mark'"],
  ["'/lote'", "'/batch'"],
  // Headers / query
  ["'x-granja-id'", "'x-farm-id'"],
  ['x-granja-id', 'x-farm-id'],
  ['req.query.id_granja', 'req.query.farm_id'],
  ['req.body?.id_granja', 'req.body?.farm_id'],
  // Method names (Spanish verbs)
  ['listar', 'list'],
  ['crearReproductora', 'createBreedingFemale'],
  ['crearReproductor', 'createBreedingMale'],
  ['cerrarEmpadre', 'closeBreeding'],
  ['buscarPorCodigo', 'findByCode'],
  ['desactivar', 'deactivate'],
  ['assignUsuarios', 'assignUsers'],
  ['anularMortalidad', 'voidMortality'],
  ['anularVenta', 'voidSale'],
  ['listDescartes', 'listDiscards'],
  ['venderDescartes', 'sellDiscards'],
  ['getPoblacion', 'getPopulation'],
  ['getResumenMensual', 'getMonthlySummary'],
  ['getPorArea', 'getByArea'],
  ['getPorCategoriaArea', 'getByCategoryArea'],
  ['getConsolidado', 'getConsolidated'],
  ['exportHembras', 'exportFemales'],
  ['exportMachos', 'exportMales'],
  ['exportInventarioMensual', 'exportMonthlyInventory'],
  ['exportAnimales', 'exportAnimals'],
  ['getPromedio', 'getAverage'],
  ['evolucionAnimal', 'animalTrend'],
  ['traslado', 'relocate'],
  ['transferencia', 'transfer'],
  ['terminar', 'complete'],
  ['marcar', 'mark'],
  ['descartar', 'discard'],
  // Comments
  ['Plataforma (auth, usuarios, granjas, auditoría)', 'Platform (auth, users, farms, audit)'],
  ['Módulo cuyes (operaciones de la especie)', 'Cuy module (species operations)'],
  ['Composition root — recibe deps inyectadas desde server.js', 'Composition root — receives deps injected from server.js'],
  ['Dependencias compartidas inyectables en todos los módulos.', 'Shared injectable dependencies for all modules.'],
  ['Reglas de dominio del módulo', 'Module domain rules'],
  ['Correspondencia categoría ↔ propósito de área (módulo cuyes).', 'Category ↔ area purpose mapping (cuy module).'],
  ['Códigos canónicos usados en seed, áreas y validaciones.', 'Canonical codes used in seed, areas and validation.'],
  ['Puerto para reglas categoría ↔ área (OCP).', 'Port for category ↔ area rules (OCP).'],
  ['El núcleo depende de esta abstracción; cada especie provee su adaptador.', 'Core depends on this abstraction; each species provides its adapter.'],
  ['Composition root — inyecta dependencias (DIP).', 'Composition root — injects dependencies (DIP).'],
  // Common error messages
  ['No autenticado', 'Not authenticated'],
  ['Sesión inválida o expirada', 'Invalid or expired session'],
  ['Sin permisos', 'Forbidden'],
  ['Credenciales incorrectas', 'Invalid credentials'],
  ['Email y contraseña son obligatorios', 'Email and password are required'],
  ['Indique la granja activa (header x-granja-id)', 'Provide the active farm (header x-farm-id)'],
  ['Granja fuera de su alcance', 'Farm is outside your scope'],
  ['Granja no encontrada', 'Farm not found'],
  ['La granja está desactivada y no admite nuevos registros', 'Farm is deactivated and does not accept new records'],
  ['Error interno', 'Internal error'],
  ['Demasiados intentos de inicio de sesión. Intente de nuevo más tarde.', 'Too many login attempts. Try again later.'],
  ['Propósito no válido', 'Invalid purpose'],
  ['nombre e id_especie son obligatorios', 'name and species_id are required'],
  ['Ya existe una granja con ese nombre', 'A farm with that name already exists'],
  ['codigo y sexo son obligatorios', 'code and sex are required'],
  ['Código duplicado en la granja', 'Duplicate code in farm'],
  ['Animal no encontrado', 'Animal not found'],
  ['nombre y proposito son obligatorios', 'name and purpose are required'],
];

function walkFiles(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  if (dir.endsWith('.js')) return [dir];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkFiles(full, files);
    else if (/\.(js|jsx|sql)$/.test(entry.name)) files.push(full);
  }
  return files;
}

function applyReplacements(content) {
  let out = content;
  for (const [from, to] of REPLACEMENTS) {
    out = out.split(from).join(to);
  }
  return out;
}

function renameFilesInDir(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      renameFilesInDir(full);
      continue;
    }
    const target = FILE_RENAMES[entry.name];
    if (target) {
      fs.renameSync(full, path.join(dir, target));
      console.log('Renamed', path.relative(ROOT, full), '->', target);
    }
  }
}

function processFiles(paths) {
  for (const file of paths) {
    const content = fs.readFileSync(file, 'utf8');
    const next = applyReplacements(content);
    if (next !== content) {
      fs.writeFileSync(file, next, 'utf8');
      console.log('Updated', path.relative(ROOT, file));
    }
  }
}

// 1. Rename files
console.log('Renaming files...');
for (const base of [
  path.join(BACKEND, 'core', 'application'),
  path.join(BACKEND, 'core', 'infrastructure'),
  path.join(BACKEND, 'core', 'interfaces'),
  path.join(BACKEND, 'modules', 'cuyes', 'application'),
  path.join(BACKEND, 'modules', 'cuyes', 'infrastructure'),
  path.join(BACKEND, 'modules', 'cuyes', 'interfaces'),
  path.join(BACKEND, 'modules', 'cuyes', 'domain'),
]) {
  renameFilesInDir(base);
}

// 2. Apply text replacements
console.log('Applying replacements...');
const backendFiles = [];
for (const p of ACTIVE_DIRS) {
  if (p.endsWith('.js')) backendFiles.push(p);
  else walkFiles(p, backendFiles);
}
processFiles(backendFiles);

const frontendFiles = walkFiles(FRONTEND);
processFiles(frontendFiles);

// 3. Frontend-specific
const apiFile = path.join(FRONTEND, 'services', 'api.js');
if (fs.existsSync(apiFile)) {
  let api = fs.readFileSync(apiFile, 'utf8');
  api = api.replace(/granjaId/g, 'farmId');
  api = api.replace(/localStorage\.getItem\('granjaId'\)/g, "localStorage.getItem('farmId')");
  api = api.replace(/localStorage\.setItem\('granjaId'/g, "localStorage.setItem('farmId'");
  api = api.replace(/localStorage\.removeItem\('granjaId'/g, "localStorage.removeItem('farmId'");
  fs.writeFileSync(apiFile, api, 'utf8');
  console.log('Updated frontend api.js storage keys');
}

// 4. Frontend API path replacements
const FRONTEND_API = [
  ['/granjas', '/farms'],
  ['/usuarios', '/users'],
  ['/auditoria', '/audit'],
  ['/jaulas', '/cages'],
  ['/animales', '/animals'],
  ['/catalogos', '/catalogs'],
  ['/movimientos', '/movements'],
  ['/mortalidad', '/mortality'],
  ['/ventas', '/sales'],
  ['/inventario', '/inventory'],
  ['/pesajes', '/weighings'],
  ['/tratamientos', '/treatments'],
  ['/reportes', '/reports'],
  ['/empadres', '/breedings'],
  ['/partos', '/births'],
  ['/destetes', '/weanings'],
  ['/alertas', '/alerts'],
  ['/desactivar', '/deactivate'],
  ['/reproductoras', '/breeding-females'],
  ['/reproductores', '/breeding-males'],
  ['/cerrar', '/close'],
  ['/descartar', '/discard'],
  ['/anular', '/void'],
  ['/traslado', '/relocate'],
  ['/transferencia', '/transfer'],
  ['/fuera-de-area', '/out-of-area'],
  ['/en-curso', '/in-progress'],
  ['/terminar', '/complete'],
  ['/jaulas-destino', '/destination-cages'],
  ['/resumen-mensual', '/monthly-summary'],
  ['/por-area', '/by-area'],
  ['/por-categoria-area', '/by-category-area'],
  ['/hembras', '/females'],
  ['/machos', '/males'],
  ['/inventario-mensual', '/monthly-inventory'],
  ['/buscar/', '/search/'],
  ['/ocupacion', '/occupancy'],
  ['/poblacion', '/population'],
  ['/descartes', '/discards'],
  ['/transiciones', '/transitions'],
  ['/promedio', '/average'],
  ['/rangos', '/ranges'],
  ['/consolidado', '/consolidated'],
  ['/razas', '/breeds'],
  ['/categorias', '/categories'],
  ['/especies', '/species'],
  ['/sobrecupo', '/overcapacity'],
  ['/marcar', '/mark'],
  ['/lote', '/batch'],
  ["'granjaId'", "'farmId'"],
  ['granjaId', 'farmId'],
];

for (const file of frontendFiles) {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;
  for (const [from, to] of FRONTEND_API) {
    if (content.includes(from)) {
      content = content.split(from).join(to);
      changed = true;
    }
  }
  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated frontend paths', path.relative(ROOT, file));
  }
}

console.log('Anglicize pass complete.');
