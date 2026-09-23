/**
 * Second pass: translate remaining Spanish user-facing strings in active src.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', 'src');
const DIRS = [
  path.join(ROOT, 'core'),
  path.join(ROOT, 'modules', 'cuyes'),
  path.join(ROOT, 'shared'),
  path.join(ROOT, 'server.js'),
];

const MSG = [
  ['Indique la granja activa (header x-farm-id)', 'Provide the active farm (header x-farm-id)'],
  ['Granja desactivada no admite nuevos registros', 'Deactivated farm does not accept new records'],
  ['codigo inválido', 'Invalid code'],
  ['fecha_nacimiento inválida', 'Invalid birth_date'],
  ['La jaula supera su capacidad máxima', 'Cage exceeds max capacity'],
  ['fecha_baja inválida', 'Invalid removal date'],
  ['Código duplicado', 'Duplicate code'],
  ['fecha_empadre inválida', 'Invalid breeding date'],
  ['cantidad de preñadas no puede superar la cantidad de hembras', 'pregnant count cannot exceed female count'],
  ['fecha_empadre no puede ser anterior al último parto de la hembra', 'breeding date cannot be before the female last birth'],
  ['resultado inválido', 'Invalid result'],
  ['fecha inválida', 'Invalid date'],
  ['fecha_destete inválida', 'Invalid weaning date'],
  ['tamaño de camada al destete no puede superar crías vivas al nacimiento', 'weaning litter size cannot exceed live births'],
  ['Envíe un arreglo de configuraciones', 'Send an array of settings'],
  ['fecha_inicio inválida', 'Invalid start date'],
  ['El email ya está registrado', 'Email already registered'],
  ['Solo puede editar cuentas que usted creó', 'You can only edit accounts you created'],
  ['El área no pertenece a la granja activa', 'Area does not belong to the active farm'],
  ['Ya existe una jaula con ese código en el área', 'A cage with that code already exists in the area'],
  ['Área inválida', 'Invalid area'],
  ['Jaula destino inválida en esta granja', 'Invalid destination cage in this farm'],
  ['Algunos animales no están activos en esta granja', 'Some animals are not active in this farm'],
  ['Algunos animales no corresponden al propósito del área destino', 'Some animals do not match destination area purpose'],
  ['Indique el motivo al confirmar un animal fuera de área', 'Provide a reason when confirming an out-of-area animal'],
  ['Granja inválida', 'Invalid farm'],
  ['Granja origen o destino inválida', 'Invalid origin or destination farm'],
  ['Jaula destino inválida', 'Invalid destination cage'],
  ['Algunos animales no están activos en origen', 'Some animals are not active at origin'],
  ['Categoría ya existe', 'Category already exists'],
  ['Categoría no encontrada', 'Category not found'],
  ['muertos no pueden superar el tamaño de camada', 'deaths cannot exceed litter size'],
  ['Hembra inválida', 'Invalid female'],
  ['motivo de anulación obligatorio', 'void reason is required'],
  ['Ya está anulado', 'Already voided'],
  ['Ya existe un área con ese nombre en la granja', 'An area with that name already exists in the farm'],
  ['Solo el superadmin puede crear cuentas admin', 'Only superadmin can create admin accounts'],
  ['La granja destino es de otra especie', 'Destination farm belongs to another species'],
  ['Solo se permite transferir entre granjas de la misma especie', 'Transfers only allowed between farms of the same species'],
  ['Use traslado interno dentro de la misma granja', 'Use internal relocate within the same farm'],
  ['La jaula destino supera su capacidad', 'Destination cage exceeds capacity'],
  ['fecha, id_granja_destino, id_jaula_destino e ids_animales son obligatorios', 'date, destination farm, destination cage and animal ids are required'],
  ['nombre y purpose are required', 'name and purpose are required'],
  ['Adaptador cuyes del puerto areaRulesPort (OCP / LSP).', 'Cuyes adapter for areaRulesPort (OCP / LSP).'],
  ['Alias legacy → canónico', 'Legacy alias → canonical'],
  ['¿El animal (sexo + proposito_area de su categoría) encaja en el área destino?', 'Does the animal (sex + category area purpose) fit the destination area?'],
  ['Empadre admite un macho junto a hembras.', 'Breeding allows one male with females.'],
  ['Entrega 1 — esquema unificado', 'Delivery 1 — unified schema'],
  ['Entrega 2/3: movimientos, pesajes, sanidad, alertas, ranking', 'Delivery 2/3: movements, weighings, health, alerts, ranking'],
  ['Rangos de peso por categoría, configurables y persistentes por granja', 'Weight ranges per category, configurable and persisted per farm'],
  ['Columnas / FKs idempotentes para DBs ya creadas', 'Idempotent columns / FKs for existing DBs'],
  ['Sistema de Control de Animales - UNAS', 'Animal Control System - UNAS'],
];

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  if (dir.endsWith('.js')) return [dir];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const f = path.join(dir, e.name);
    if (e.isDirectory()) walk(f, files);
    else if (/\.(js|sql)$/.test(e.name)) files.push(f);
  }
  return files;
}

const files = [];
for (const d of DIRS) {
  if (d.endsWith('.js')) files.push(d);
  else walk(d, files);
}

for (const file of files) {
  let c = fs.readFileSync(file, 'utf8');
  let n = c;
  for (const [from, to] of MSG) n = n.split(from).join(to);
  if (n !== c) {
    fs.writeFileSync(file, n, 'utf8');
    console.log('Updated', path.relative(ROOT, file));
  }
}

// Rename PROPOSITOS constant in areaPurpose
const areaPurpose = path.join(ROOT, 'modules', 'cuyes', 'domain', 'areaPurpose.js');
if (fs.existsSync(areaPurpose)) {
  let c = fs.readFileSync(areaPurpose, 'utf8');
  c = c.replace(/const PROPOSITOS/g, 'const PURPOSES');
  c = c.replace(/PROPOSITOS/g, 'PURPOSES');
  fs.writeFileSync(areaPurpose, c, 'utf8');
  console.log('Updated areaPurpose PURPOSES');
}

const adapter = path.join(ROOT, 'modules', 'cuyes', 'domain', 'areaRules.adapter.js');
if (fs.existsSync(adapter)) {
  let c = fs.readFileSync(adapter, 'utf8');
  c = c.replace('areaPurpose.PURPOSES', 'areaPurpose.PURPOSES');
  fs.writeFileSync(adapter, c, 'utf8');
}

console.log('Messages pass done.');
