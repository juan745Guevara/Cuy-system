/**
 * One-shot script: English translation for active backend (core, modules/cuyes, shared, server.js).
 * Run from backend/: node scripts/apply-english-translation.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', 'src');
const TARGETS = [
  path.join(ROOT, 'core'),
  path.join(ROOT, 'modules', 'cuyes'),
  path.join(ROOT, 'shared'),
  path.join(ROOT, 'server.js'),
];

function walk(entry, files = []) {
  if (!fs.existsSync(entry)) return files;
  const stat = fs.statSync(entry);
  if (stat.isFile() && entry.endsWith('.js')) {
    files.push(entry);
    return files;
  }
  if (stat.isDirectory()) {
    for (const name of fs.readdirSync(entry)) {
      walk(path.join(entry, name), files);
    }
  }
  return files;
}

const STRING_REPLACEMENTS = [
  // Bug fixes
  ['areaPurpose.PROPOSITOS', 'areaPurpose.PURPOSES'],
  ['if (!PROPOSITOS.includes', 'if (!PURPOSES.includes'],
  ['propositos: PROPOSITOS', 'propositos: PURPOSES'],

  // ServiceResult / shared
  ['/** Resultado tipado de un caso de uso (sin acoplar HTTP). */', '/** Typed use-case result (decoupled from HTTP). */'],
  ["return fail('Registro duplicado', 409)", "return fail('Duplicate record', 409)"],
  ['/** Mapea ServiceResult → respuesta HTTP (SRP en la capa de presentación). */', '/** Maps ServiceResult → HTTP response (presentation layer SRP). */'],
  ['/** Puerto de auditoría (ISP — solo operaciones de log). */', '/** Audit port (ISP — log operations only). */'],
  ['// Rechaza fechas futuras (comparación lexicográfica sobre ISO YYYY-MM-DD)', '// Reject future dates (lexicographic compare on ISO YYYY-MM-DD)'],
  ['// Devuelve true si la fecha es inválida o futura (para los handlers)', '// Returns true if the date is invalid or in the future (for handlers)'],
  ['mensaje || `${campo} no puede ser futura`', 'mensaje || `${campo} cannot be in the future`'],

  // Core users
  ["fail('No puede asignar granjas fuera de su alcance'", "fail('Cannot assign farms outside your scope'"],
  ["fail('nombre, email, password y rol son obligatorios')", "fail('name, email, password and role are required')"],
  ["fail('No se puede crear otro superadmin desde la API'", "fail('Cannot create another superadmin via the API'"],
  ["fail('Admin solo puede crear roles operativos'", "fail('Admin can only create operational roles'"],
  ["fail('No puede asignar un rol igual o superior al suyo'", "fail('Cannot assign a role equal to or above your own'"],
  ["fail('Usuario no encontrado'", "fail('User not found'"],
  ["fail('No se puede editar al superadmin'", "fail('Cannot edit the superadmin account'"],
  ["fail('Solo el superadmin edita cuentas Admin'", "fail('Only superadmin can edit Admin accounts'"],
  ["fail('Un admin no puede ampliar su propio alcance de granjas'", "fail('An admin cannot expand their own farm scope'"],
  ['detalle: `Alta de usuario ${created.email}`', 'detalle: `User created: ${created.email}`'],
  ['detalle: `Actualización de usuario ${target.email}`', 'detalle: `User updated: ${target.email}`'],

  // Core audit
  ["fail('Registro no encontrado'", "fail('Record not found'"],

  // Core farms audit
  ['detalle: `Alta de granja ${granja.nombre}`', 'detalle: `Farm created: ${granja.nombre}`'],
  ['detalle: `Desactivación de granja ${granja.nombre}`', 'detalle: `Farm deactivated: ${granja.nombre}`'],
  ['detalle: `Configuración de usuarios de la granja ${farmId}`', 'detalle: `Farm user configuration: ${farmId}`'],

  // Areas
  ["fail('Área no encontrada'", "fail('Area not found'"],
  ["fail('Reubique las jaulas a otra área antes de deactivate'", "fail('Move cages to another area before deactivating'"],
  ['detalle: `Alta de área ${area.nombre}`', 'detalle: `Area created: ${area.nombre}`'],
  ['detalle: `Desactivación de área ${antes.nombre}`', 'detalle: `Area deactivated: ${antes.nombre}`'],
  ["return { error: 'Área destino inválida' }", "return { error: 'Invalid destination area' }"],

  // Animals
  ["sugerencia: 'registrar'", "sugerencia: 'register'"],
  ["fail('sexo debe ser M o H')", "fail('sex must be M or H')"],
  ["fail('jaula es obligatoria'", "fail('cage is required'"],
  ["fail('fecha_nacimiento no puede ser futura'", "fail('birth_date cannot be in the future'"],
  ["fail('Jaula fuera de la granja activa')", "fail('Cage is outside the active farm')"],
  ["fail(\n            'El código pertenece a un animal dado de baja. Confirme reutilización.',", "fail(\n            'Code belongs to a removed animal. Confirm reuse.',"],
  ['detalle: `Reuso del código ${animal.codigo}`', 'detalle: `Code reused: ${animal.codigo}`'],
  ['detalle: `Alta de animal ${animal.codigo}`', 'detalle: `Animal created: ${animal.codigo}`'],
  ["fail('fecha_baja no puede ser futura'", "fail('removal date cannot be in the future'"],
  ['detalle: `Actualización de animal ${animal.codigo}`', 'detalle: `Animal updated: ${animal.codigo}`'],

  // Births
  ["fail('id_hembra y fecha_parto son obligatorios'", "fail('id_hembra and fecha_parto are required'"],
  ["fail('fecha_parto inválida'", "fail('Invalid fecha_parto'"],
  ["fail('fecha_parto no puede ser futura'", "fail('fecha_parto cannot be in the future'"],
  ["fail('cantidades deben ser ≥ 0')", "fail('quantities must be ≥ 0')"],
  ["fail('indique vivos o muertos')", "fail('specify live or dead counts')"],
  ['detalle: `Parto #${parto.id}: ${vm}M/${vh}H (${crias.length} gazapos)`', 'detalle: `Birth #${parto.id}: ${vm}M/${vh}H (${crias.length} pups)`'],

  // Weanings
  ["fail('id_parto y fecha_destete son obligatorios')", "fail('id_parto and fecha_destete are required')"],
  ["fail('fecha_destete no puede ser futura'", "fail('fecha_destete cannot be in the future'"],
  ["fail('Parto no encontrado'", "fail('Birth record not found'"],
  ["fail('fecha_destete debe ser posterior a la del parto'", "fail('fecha_destete must be after the birth date'"],
  ["fail('destetados + muertos no pueden superar vivos al nacimiento')", "fail('weaned + dead cannot exceed live births')"],
  ['detalle: `Destete #${destete.id}: ${dm}M/${dh}H del parto #${id_parto}`', 'detalle: `Weaning #${destete.id}: ${dm}M/${dh}H from birth #${id_parto}`'],

  // Breedings
  ["return { error: 'Animal not found o inactivo' }", "return { error: 'Animal not found or inactive' }"],
  ["return { error: `Se esperaba sexo ${sexo}` }", "return { error: `Expected sex ${sexo}` }"],
  ["fail('codigo obligatorio')", "fail('code is required')"],
  ["fail('jaula es obligatoria'", "fail('cage is required'"],
  ["fail('fecha_empadre y hembras[] son obligatorios')", "fail('fecha_empadre and hembras[] are required')"],
  ["fail('fecha_empadre no puede ser futura'", "fail('fecha_empadre cannot be in the future'"],
  ['detalle: `Alta de empadre #${emp.id} con ${hembras.length} hembras`', 'detalle: `Breeding #${emp.id} created with ${hembras.length} females`'],
  ['detalle: `Resultado ${resultado} en empadre #${empadreId} (hembra ${hembraId})`', 'detalle: `Result ${resultado} on breeding #${empadreId} (female ${hembraId})`'],
  ["fail('Hembra no encontrada'", "fail('Female not found'"],
  ["fail('Macho no encontrado'", "fail('Male not found'"],
  ["fail('Empadre no encontrado'", "fail('Breeding record not found'"],
  ["fail('El empadre no tiene macho asignado')", "fail('Breeding record has no assigned male')"],
  ["fail('id_jaula_retorno es obligatorio')", "fail('id_jaula_retorno is required')"],
  ['detalle: `Cierre de empadre #${emp.id} (macho → jaula ${id_jaula_retorno})`', 'detalle: `Breeding #${emp.id} closed (male → cage ${id_jaula_retorno})`'],
  ["return { error: 'Jaula de retorno inválida' }", "return { error: 'Invalid return cage' }"],
  ["motivo_baja = 'Murió en ciclo de empadre'", "motivo_baja = 'Died during breeding cycle'"],
  ["'reproductora',1,'Murió en ciclo de empadre'", "'reproductora',1,'Died during breeding cycle'"],

  // Cages
  ["fail('id_area y codigo son obligatorios')", "fail('id_area and codigo are required')"],
  ["fail('Ya existe una jaula con ese nombre en la granja'", "fail('A cage with that name already exists in the farm'"],
  ["fail('Jaula no encontrada'", "fail('Cage not found'"],
  ["fail('Nombre de jaula duplicado en la granja'", "fail('Duplicate cage name in the farm'"],
  ['detalle: `Alta de jaula ${jaula.codigo}`', 'detalle: `Cage created: ${jaula.codigo}`'],
  ['detalle: `Edición de jaula ${updated.codigo}`', 'detalle: `Cage updated: ${updated.codigo}`'],
  ['detalle: `Desactivación de jaula ${jaula.codigo}`', 'detalle: `Cage deactivated: ${jaula.codigo}`'],

  // Catalogs
  ["fail('nombre es obligatorio')", "fail('name is required')"],
  ["fail('Raza ya existe'", "fail('Breed already exists'"],
  ["fail('Raza no encontrada'", "fail('Breed not found'"],
  ['detalle: `Alta de raza ${raza.nombre}`', 'detalle: `Breed created: ${raza.nombre}`'],
  ['detalle: `Alta de categoría ${categoria.nombre}`', 'detalle: `Category created: ${categoria.nombre}`'],
  ['detalle: `Desactivación de raza ${raza.nombre}`', 'detalle: `Breed deactivated: ${raza.nombre}`'],
  ['detalle: `Desactivación de categoría ${categoria.nombre}`', 'detalle: `Category deactivated: ${categoria.nombre}`'],

  // Mortality / sales quantity
  ["fail('fecha y cantidad son obligatorios')", "fail('date and quantity are required')"],
  ["fail('fecha no puede ser futura'", "fail('date cannot be in the future'"],
  ["fail('cantidad debe ser mayor que cero'", "fail('quantity must be greater than zero'"],
  ['`cantidad (${cant}) supera la población disponible de la categoría (${disponible})`', '`quantity (${cant}) exceeds available category population (${disponible})`'],
  ['`cantidad (${cant}) supera la población disponible (${disponible})`', '`quantity (${cant}) exceeds available population (${disponible})`'],
  ['detalle: `Mortalidad de ${cant} ${categoria || (id_animal ? `animal ${id_animal}` : \'animales\')}`', 'detalle: `Mortality of ${cant} ${categoria || (id_animal ? `animal ${id_animal}` : \'animals\')}`'],
  ["fail('fecha es obligatoria'", "fail('date is required'"],
  ["fail('id_animales[] es obligatorio'", "fail('id_animales[] is required'"],
  ['detalle: `Venta de ${cant} ${categoria || (id_animal ? `animal ${id_animal}` : \'animales\')}`', 'detalle: `Sale of ${cant} ${categoria || (id_animal ? `animal ${id_animal}` : \'animals\')}`'],
  ['detalle: `Venta agrupada de ${result.ventas.length} descartes`', 'detalle: `Bulk sale of ${result.ventas.length} discards`'],
  ["error: 'Hay animales que no están marcados como descarte'", "error: 'Some animals are not marked as discards'"],

  // Treatments
  ["fail('producto, fecha_inicio y duracion_dias son obligatorios')", "fail('producto, fecha_inicio and duracion_dias are required')"],
  ["fail('tipo debe ser preventivo o curativo')", "fail('tipo must be preventivo or curativo')"],
  ["fail('fecha_inicio no puede ser futura'", "fail('fecha_inicio cannot be in the future'"],
  ["fail('duracion_dias debe ser mayor que cero'", "fail('duracion_dias must be greater than zero'"],
  ['detalle: `Tratamiento ${tipo} "${producto}" para ${creados.length} registro(s)`', 'detalle: `Treatment ${tipo} "${producto}" for ${creados.length} record(s)`'],
  ["fail('Tratamiento no encontrado'", "fail('Treatment not found'"],
  ['detalle: `Finalización de tratamiento #${row.id} (${row.producto})`', 'detalle: `Treatment completed #${row.id} (${row.producto})`'],

  // Weighings
  ["fail('fecha y peso_gramos son obligatorios')", "fail('date and peso_gramos are required')"],
  ["fail('El peso debe ser mayor que cero')", "fail('Weight must be greater than zero')"],
  ["fail('La fecha no puede ser futura')", "fail('Date cannot be in the future')"],
  ['fail(`Peso inválido para la especie (${ESPECIE_ABS.min}-${ESPECIE_ABS.max} g)`)', 'fail(`Invalid weight for species (${ESPECIE_ABS.min}-${ESPECIE_ABS.max} g)`)'],
  ["fail('Animal not found en la granja'", "fail('Animal not found in farm'"],
  ['`Peso fuera del rango esperado (${rango.min}-${rango.max} g) para ${animal.categoria || \'la categoría\'}`', '`Weight outside expected range (${rango.min}-${rango.max} g) for ${animal.categoria || \'category\'}`'],
  ["fail('fecha y pesajes[] son obligatorios')", "fail('date and pesajes[] are required')"],
  ["fail('No hay pesos para guardar')", "fail('No weights to save')"],
  ['fail(`Rango inválido para ${key}`)', 'fail(`Invalid range for ${key}`)'],
  ['detalle: `Pesaje de ${result.data.peso_gramos} g para animal ${result.data.id_animal}`', 'detalle: `Weighing ${result.data.peso_gramos} g for animal ${result.data.id_animal}`'],
  ['detalle: `${creados.length} pesajes registrados en lote`', 'detalle: `${creados.length} weighings recorded in batch`'],
  ["detalle: 'Configuración de rangos de peso'", "detalle: 'Weight range configuration'"],

  // Movements
  ["fail('fecha e id_jaula_destino son obligatorios')", "fail('date and id_jaula_destino are required')"],
  ["fail('Seleccione al menos un animal')", "fail('Select at least one animal')"],
  ['fail(`Fecha anterior al nacimiento de ${a.codigo}`)', 'fail(`Date before birth of ${a.codigo}`)'],
  ["fail('Sin alcance en la granja destino'", "fail('No access to destination farm'"],
  ["fail('El motivo de transfer es obligatorio')", "fail('Transfer reason is required')"],
  ["fail('Use relocate interno dentro de la misma granja')", "fail('Use relocate for moves within the same farm')"],
  ['fail(`El código ${a.codigo} ya existe en la granja destino`', 'fail(`Code ${a.codigo} already exists in destination farm`'],
  ['detalle: `Traslado de ${creados.length} animales a la jaula ${id_jaula_destino}`', 'detalle: `Relocated ${creados.length} animals to cage ${id_jaula_destino}`'],
  ['detalle: `Transferencia de ${creados.length} animales a la granja ${id_granja_destino}`', 'detalle: `Transferred ${creados.length} animals to farm ${id_granja_destino}`'],

  // Alerts
  ['detalle: `Configuración de ${items.length} alerta(s)`', 'detalle: `Configured ${items.length} alert(s)`'],
  ["fail('tipo es obligatorio')", "fail('tipo is required')"],
  ['detalle: `Descarte de alerta ${tipo}${id_animal ? ` para animal ${id_animal}` : \'\'}`', 'detalle: `Alert dismissed ${tipo}${id_animal ? ` for animal ${id_animal}` : \'\'}`'],
  ['mensaje: `Parto próximo de ${r.codigo}`', 'mensaje: `Upcoming birth for ${r.codigo}`'],
  ['mensaje: `Destete pendiente de camada de ${r.codigo}`', 'mensaje: `Pending weaning for litter of ${r.codigo}`'],
  ['mensaje: `Revisar preñez de ${r.codigo} (empadre sin confirmar)`', 'mensaje: `Check pregnancy for ${r.codigo} (breeding unconfirmed)`'],
  ['mensaje: `Empadre disponible para ${r.codigo}`', 'mensaje: `Breeding available for ${r.codigo}`'],

  // Ranking
  ["detalle: 'Configuración de ranking reproductivo'", "detalle: 'Breeding ranking configuration'"],
  ["fail('accion debe ser descarte o reemplazo')", "fail('accion must be descarte or reemplazo')"],
  ['detalle: `Marcado para descarte desde ranking (${row.codigo})`', 'detalle: `Marked for discard from ranking (${row.codigo})`'],
  ['detalle: `Marcado como reemplazo desde ranking (${row.codigo})`', 'detalle: `Marked as replacement from ranking (${row.codigo})`'],
  ["'Marcado para descarte desde ranking'", "'Marked for discard from ranking'"],
  ["'Marcado como reemplazo desde ranking'", "'Marked as replacement from ranking'"],

  // Reports fail messages
  ["fail('No hay datos de hembras para exportar en el periodo/alcance')", "fail('No female data to export for the period/scope')"],
  ["fail('No hay datos de machos para exportar')", "fail('No male data to export')"],
  ["fail('No hay datos de inventario para exportar')", "fail('No inventory data to export')"],
  ["fail('No hay animales para exportar en el alcance elegido')", "fail('No animals to export in the selected scope')"],
  ["fail('No hay granjas para consolidar')", "fail('No farms to consolidate')"],
  ["fail('No hay datos para consolidar')", "fail('No data to consolidate')"],

  // areaPurpose comments
  ['// macho de empadre permitido sin aviso', '// breeding male allowed without warning'],
  ['// sin categoría conocida: no forzar aviso', '// no known category: do not force warning'],

  // Weanings repo inventory note
  ['`Destete ${data.fecha_destete}: ${data.dm}M + ${data.dh}H (gazapos → recría)`', '`Weaning ${data.fecha_destete}: ${data.dm}M + ${data.dh}H (pups → rearing)`'],
];

// Method renames: [oldName, newName] — applied with word boundaries
const METHOD_RENAMES = [
  ['getResumen', 'getSummary'],
  ['crearEmpadre', 'createBreeding'],
  ['actualizarResultadoHembra', 'updateFemaleBreedingResult'],
  ['getReproductoraFicha', 'getFemaleBreedingProfile'],
  ['getHembrasJaula', 'getFemalesInCage'],
  ['getReproductorFicha', 'getMaleBreedingProfile'],
  ['crearRaza', 'createBreed'],
  ['crearCategoria', 'createCategory'],
  ['crearLote', 'createBatch'],
  ['jaulasDestino', 'destinationCages'],
  ['historialAnimal', 'animalHistory'],
  ['historialJaula', 'cageHistory'],
  ['listSobrecupo', 'listOvercapacity'],
  ['listFueraDeArea', 'listOutOfArea'],
  ['getOcupacion', 'getOccupancy'],
  ['getAnimales', 'getAnimals'],
  ['listRazas', 'listBreeds'],
  ['listCategorias', 'listCategories'],
  ['listEspecies', 'listSpecies'],
  ['getTransiciones', 'getTransitions'],
  ['listEnCurso', 'listActive'],
  ['exportConsolidado', 'exportConsolidated'],
  ['registrar', 'register'],
  ['actualizar', 'update'],
  ['crear', 'create'],
];

const WEIGHINGS_RANGES = [
  ['async function getRangos(', 'async function loadRanges('],
  ['await getRangos(', 'await loadRanges('],
  ['async getRangos(farmId)', 'async getRanges(farmId)'],
  ['service.getRangos(', 'service.getRanges('],
];

function applyMethodRenames(content) {
  let out = content;
  for (const [oldName, newName] of METHOD_RENAMES) {
    const reDef = new RegExp(`\\basync ${oldName}\\(`, 'g');
    const reCall = new RegExp(`\\bservice\\.${oldName}\\(`, 'g');
    const reProp = new RegExp(`\\b${oldName}:`, 'g');
    out = out.replace(reDef, `async ${newName}(`);
    out = out.replace(reCall, `service.${newName}(`);
    // Avoid renaming repository method calls that share names
    out = out.replace(reProp, `${newName}:`);
  }
  return out;
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  for (const [from, to] of STRING_REPLACEMENTS) {
    if (content.includes(from)) {
      content = content.split(from).join(to);
    }
  }

  // Only rename service methods in application services and interface routes
  if (
    filePath.includes(`${path.sep}application${path.sep}`) ||
    filePath.includes(`${path.sep}interfaces${path.sep}`)
  ) {
    content = applyMethodRenames(content);
  }

  if (filePath.endsWith('weighings.service.js') || filePath.endsWith('weighings.routes.js')) {
    for (const [from, to] of WEIGHINGS_RANGES) {
      content = content.split(from).join(to);
    }
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }
  return false;
}

const files = TARGETS.flatMap((t) => walk(t));
let changed = 0;
for (const f of files) {
  if (processFile(f)) {
    changed += 1;
    console.log('updated:', path.relative(path.join(__dirname, '..'), f));
  }
}
console.log(`Done. ${changed} file(s) updated.`);
