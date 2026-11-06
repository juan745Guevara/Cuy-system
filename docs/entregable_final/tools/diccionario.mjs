/*
 * diccionario.mjs — Genera el diccionario de datos (sección 6 de la Entrega 2) desde PostgreSQL.
 *
 * Lee tipos, nulos, claves, restricciones CHECK/UNIQUE y valores por defecto de la base de datos
 * configurada en backend/.env y reemplaza el bloque entre los marcadores
 *   <!-- diccionario:inicio -->  …  <!-- diccionario:fin -->
 * de entrega_02/ENTREGA_02.md. Las descripciones se mantienen en este archivo (DESCRIPCIONES).
 *
 * Uso (con la base de datos migrada):  node tools/diccionario.mjs
 */

import { readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const BACKEND = path.resolve(ROOT, '..', '..', 'backend');
const E2 = path.join(ROOT, 'entrega_02', 'ENTREGA_02.md');

const req = createRequire(path.join(BACKEND, 'package.json'));
req('dotenv').config({ path: path.join(BACKEND, '.env') });
const { Client } = req('pg');

function databaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const u = encodeURIComponent(process.env.DB_USER || 'postgres');
  const p = encodeURIComponent(process.env.DB_PASSWORD || '');
  return `postgresql://${u}:${p}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || 'cuy_system'}`;
}

/** Grupos (mismo orden que las vistas del MER) y propósito de cada tabla. */
const GRUPOS = [
  ['Seguridad y estructura', [
    ['usuarios', 'Cuentas de acceso al sistema y su rol.'],
    ['usuario_granjas', 'Granjas en las que puede operar cada usuario (relación N:M).'],
    ['especies', 'Especies que maneja la plataforma (catálogo raíz).'],
    ['granjas', 'Unidades de crianza; cada una pertenece a una especie.'],
    ['areas', 'Agrupaciones de jaulas dentro de una granja según su propósito.'],
    ['recintos', 'Jaulas o pozas donde se alojan los animales.'],
    ['razas', 'Catálogo de razas o líneas genéticas por especie.'],
    ['categorias', 'Catálogo de etapas o categorías productivas por especie.'],
  ]],
  ['Animal y reproducción', [
    ['animales', 'Ficha individual de cada animal: identidad, ubicación, estado y origen.'],
    ['animal_particularidades', 'Notas fechadas sobre un animal (rasgos, eventos, observaciones).'],
    ['empadres', 'Lote de apareamiento de un macho en una jaula.'],
    ['empadre_hembras', 'Hembras que participan en cada empadre y su resultado.'],
    ['partos', 'Parto de una hembra con la camada nacida.'],
    ['destetes', 'Destete de la camada de un parto.'],
  ]],
  ['Eventos y salidas', [
    ['pesajes', 'Controles de peso individuales.'],
    ['tratamientos', 'Tratamientos sanitarios a un animal, jaula o área.'],
    ['movimientos', 'Traslados de animales entre jaulas o entre granjas.'],
    ['mortalidad', 'Bajas por muerte (individuales o por lote).'],
    ['ventas', 'Salidas comerciales respaldadas por comprobante.'],
    ['conteos_inventario', 'Conteos físicos de jaulas conciliados con lo registrado (CU-06).'],
  ]],
  ['Configuración y auditoría', [
    ['alerta_config', 'Plazos en días que disparan cada tipo de alerta, por granja.'],
    ['peso_rangos', 'Rango de peso esperado por categoría, por granja.'],
    ['ranking_config', 'Ponderaciones del ranking de reproductores, por granja.'],
    ['alertas_descarte', 'Alertas que un usuario ocultó del panel (descartadas) y por qué.'],
    ['audit_log', 'Bitácora de auditoría de todas las operaciones de escritura.'],
  ]],
];

/** Descripción por atributo. Las claves "*.col" aplican a cualquier tabla. */
const DESCRIPCIONES = {
  '*.id': 'Identificador interno autoincremental.',
  '*.id_granja': 'Granja a la que pertenece el registro.',
  '*.id_especie': 'Especie a la que pertenece.',
  '*.id_animal': 'Animal involucrado.',
  '*.id_jaula': 'Jaula involucrada.',
  '*.id_area': 'Área involucrada.',
  '*.created_by': 'Usuario que creó el registro.',
  '*.created_at': 'Fecha y hora de creación.',
  '*.updated_at': 'Fecha y hora de la última modificación.',
  '*.activo': 'Falso si fue dado de baja (borrado lógico).',
  '*.activa': 'Falso si fue dada de baja (borrado lógico).',
  '*.nombre': 'Nombre visible.',
  '*.fecha': 'Fecha del evento.',
  '*.observaciones': 'Comentarios libres.',
  '*.anulado': 'Verdadero si el registro fue anulado (no cuenta en los cálculos).',
  '*.motivo_anulacion': 'Justificación de la anulación.',
  '*.clasificacion': 'Clasificación del lote (raza o grupo) tal como se registró.',
  '*.categoria': 'Categoría productiva tal como se registró (texto histórico).',
  '*.cantidad': 'Número de animales del registro.',
  '*.tipo': 'Tipo de registro.',

  'usuarios.email': 'Correo de inicio de sesión (único).',
  'usuarios.password_hash': 'Contraseña cifrada con bcrypt; nunca se guarda en texto plano.',
  'usuarios.rol': 'Rol que determina los permisos.',
  'usuarios.created_by': 'Usuario que creó la cuenta.',
  'usuario_granjas.id_usuario': 'Usuario autorizado.',
  'usuario_granjas.id_granja': 'Granja a la que tiene acceso.',
  'granjas.id_especie': 'Especie que se cría en la granja.',
  'granjas.ubicacion': 'Ubicación física de la granja.',
  'areas.proposito': 'Uso del área (maternidad, recría, engorde, empadre…).',
  'recintos.id_area': 'Área a la que pertenece la jaula (opcional).',
  'recintos.codigo': 'Código visible de la jaula, único dentro del área.',
  'recintos.capacidad_maxima': 'Animales que admite; superarla exige confirmación.',
  'categorias.proposito_area': 'Propósito de área donde debe ubicarse esta categoría.',
  'animales.codigo': 'Código del animal tal como se escribió.',
  'animales.codigo_norm': 'Código normalizado (mayúsculas, sin espacios) para búsqueda y unicidad.',
  'animales.sexo': 'M = macho, H = hembra.',
  'animales.id_raza': 'Raza del animal.',
  'animales.id_categoria': 'Categoría productiva actual.',
  'animales.id_jaula': 'Jaula donde se encuentra.',
  'animales.fecha_nacimiento': 'Fecha de nacimiento.',
  'animales.estado': 'Situación del animal en la población.',
  'animales.fecha_baja': 'Fecha en que salió de la población activa.',
  'animales.motivo_baja': 'Causa de la baja.',
  'animales.destino_descarte': 'Destino del animal descartado (venta, consumo…).',
  'animales.id_parto_origen': 'Parto en el que nació (genealogía: madre y empadre).',
  'animal_particularidades.fecha': 'Fecha de la nota.',
  'animal_particularidades.texto': 'Contenido de la nota.',
  'empadres.id_macho': 'Macho reproductor del lote.',
  'empadres.id_jaula': 'Jaula del empadre.',
  'empadres.fecha_empadre': 'Inicio del empadre; base para proyectar el parto (+67 días).',
  'empadres.peso_antes': 'Peso del macho al iniciar (g).',
  'empadres.peso_despues': 'Peso del macho al cerrar (g).',
  'empadres.cantidad_hembras': 'Hembras del lote al cerrar (copia para el ranking).',
  'empadres.cantidad_prenadas': 'Hembras preñadas al cerrar (copia para el ranking).',
  'empadres.notas': 'Comentarios del empadre.',
  'empadre_hembras.id_empadre': 'Empadre al que pertenece.',
  'empadre_hembras.id_hembra': 'Hembra participante.',
  'empadre_hembras.resultado': 'Resultado reproductivo de la hembra en el lote.',
  'partos.id_hembra': 'Madre.',
  'partos.id_empadre': 'Empadre que originó el parto (padre).',
  'partos.fecha_parto': 'Fecha del parto.',
  'partos.vivos_m': 'Crías macho nacidas vivas.',
  'partos.vivos_h': 'Crías hembra nacidas vivas.',
  'partos.muertos': 'Crías nacidas muertas.',
  'destetes.id_parto': 'Parto cuya camada se desteta.',
  'destetes.fecha_destete': 'Fecha del destete.',
  'destetes.destetados_m': 'Machos destetados.',
  'destetes.destetados_h': 'Hembras destetadas.',
  'destetes.muertos': 'Crías muertas antes del destete.',
  'destetes.peso_promedio': 'Peso promedio de la camada (g).',
  'destetes.id_jaula_m': 'Jaula de recría de los machos.',
  'destetes.id_jaula_h': 'Jaula de recría de las hembras.',
  'pesajes.peso_gramos': 'Peso registrado en gramos.',
  'pesajes.fuera_rango': 'Verdadero si quedó fuera del rango de su categoría (se confirmó).',
  'tratamientos.id_animal': 'Animal tratado (si es individual).',
  'tratamientos.id_jaula': 'Jaula tratada (si es colectivo).',
  'tratamientos.id_area': 'Área tratada (si es colectivo).',
  'tratamientos.tipo': 'Preventivo o curativo.',
  'tratamientos.producto': 'Medicamento o producto aplicado.',
  'tratamientos.dosis': 'Dosis aplicada.',
  'tratamientos.via': 'Vía de administración.',
  'tratamientos.fecha_inicio': 'Inicio del tratamiento.',
  'tratamientos.duracion_dias': 'Duración en días.',
  'tratamientos.fecha_termino': 'Fin previsto (inicio + duración).',
  'tratamientos.diagnostico': 'Diagnóstico que motivó el tratamiento.',
  'tratamientos.responsable': 'Persona que lo indicó o aplicó.',
  'tratamientos.estado': 'En curso o terminado.',
  'tratamientos.motivo_cierre': 'Observación al finalizar.',
  'movimientos.tipo': 'relocate = dentro de la granja; transfer = a otra granja.',
  'movimientos.id_granja_origen': 'Granja de origen.',
  'movimientos.id_granja_destino': 'Granja de destino.',
  'movimientos.id_jaula_origen': 'Jaula de origen.',
  'movimientos.id_jaula_destino': 'Jaula de destino.',
  'movimientos.motivo': 'Motivo del traslado.',
  'movimientos.excedio_capacidad': 'Verdadero si se confirmó un sobrecupo.',
  'movimientos.aviso_area': 'Verdadero si el animal quedó fuera del área de su categoría.',
  'mortalidad.id_animal': 'Animal fallecido (vacío si es un lote).',
  'mortalidad.causa': 'Causa probable de la muerte.',
  'mortalidad.tipo': 'Tipo de baja (general, perinatal, destete…).',
  'mortalidad.id_jaula': 'Jaula donde ocurrió.',
  'ventas.id_animal': 'Animal vendido (vacío si es un lote).',
  'ventas.comprador': 'Nombre del comprador.',
  'ventas.precio': 'Importe total (S/).',
  'ventas.tipo_comprobante': 'Tipo de comprobante emitido por la caja UNAS.',
  'ventas.serie': 'Serie del comprobante.',
  'ventas.numero': 'Número del comprobante.',
  'ventas.estado': 'Estado de la venta.',
  'conteos_inventario.id_jaula': 'Jaula contada.',
  'conteos_inventario.fecha': 'Fecha del conteo.',
  'conteos_inventario.machos_contados': 'Machos contados físicamente.',
  'conteos_inventario.hembras_contadas': 'Hembras contadas físicamente.',
  'conteos_inventario.machos_sistema': 'Machos registrados en el sistema al momento del conteo.',
  'conteos_inventario.hembras_sistema': 'Hembras registradas en el sistema al momento del conteo.',
  'conteos_inventario.peso_muestra1': 'Peso de la muestra 1 (g).',
  'conteos_inventario.peso_muestra2': 'Peso de la muestra 2 (g).',
  'conteos_inventario.peso_muestra3': 'Peso de la muestra 3 (g).',
  'conteos_inventario.observaciones': 'Causa probable de la diferencia (obligatoria si faltan animales).',
  'alerta_config.tipo': 'Tipo de alerta (parto, destete, pesaje…).',
  'alerta_config.dias': 'Días que deben pasar para disparar la alerta.',
  'alerta_config.activo': 'Si la alerta está habilitada.',
  'peso_rangos.categoria': 'Categoría a la que aplica el rango.',
  'peso_rangos.min': 'Peso mínimo esperado (g).',
  'peso_rangos.max': 'Peso máximo esperado (g).',
  'peso_rangos.updated_by': 'Usuario que actualizó el rango.',
  'ranking_config.peso_partos': 'Ponderación del número de partos (%).',
  'ranking_config.peso_camada': 'Ponderación del tamaño de camada (%).',
  'ranking_config.peso_destete': 'Ponderación de crías destetadas (%).',
  'ranking_config.peso_mortalidad': 'Ponderación de la mortalidad de crías (%).',
  'ranking_config.peso_peso_nac': 'Ponderación del peso al nacer (%).',
  'ranking_config.peso_peso_dest': 'Ponderación del peso al destete (%).',
  'ranking_config.peso_prenez_macho': 'Ponderación de la tasa de preñez del macho (%).',
  'alertas_descarte.tipo': 'Tipo de alerta ocultada.',
  'alertas_descarte.id_animal': 'Animal al que se refería la alerta.',
  'alertas_descarte.id_referencia': 'Registro que originó la alerta (empadre, parto…).',
  'alertas_descarte.motivo': 'Por qué se ocultó.',
  'audit_log.id_usuario': 'Usuario que realizó la acción.',
  'audit_log.accion': 'Acción (crear, editar, anular, login…).',
  'audit_log.detalle': 'Resumen legible de la operación.',
  'audit_log.entidad': 'Tipo de registro afectado.',
  'audit_log.id_entidad': 'Identificador del registro afectado.',
  'audit_log.id_granja': 'Granja donde ocurrió.',
  'audit_log.antes': 'Copia del registro antes del cambio (JSONB).',
  'audit_log.despues': 'Copia del registro después del cambio (JSONB).',
};

/** Pesos de crías: se describen en bloque. */
for (const t of ['partos', 'destetes']) {
  for (const s of ['m', 'h']) {
    for (const n of [1, 2, 3]) {
      DESCRIPCIONES[`${t}.peso_${s}${n}`] = `Peso de la cría ${s === 'm' ? 'macho' : 'hembra'} ${n} (g).`;
    }
  }
}

function tipo(c) {
  const t = c.data_type;
  if (t === 'character varying') return `VARCHAR(${c.character_maximum_length})`;
  if (t === 'character') return `CHAR(${c.character_maximum_length})`;
  if (t === 'numeric') return `NUMERIC(${c.numeric_precision},${c.numeric_scale})`;
  if (t === 'timestamp without time zone') return 'TIMESTAMP';
  if (t === 'integer' && /nextval/.test(c.column_default || '')) return 'SERIAL';
  return t.toUpperCase();
}

function defecto(c) {
  const d = c.column_default;
  if (!d || /nextval/.test(d)) return '';
  return d
    .replace(/::[a-z ]+(\(\d+\))?/gi, '')
    .replace(/^'(.*)'$/, "'$1'")
    .replace('CURRENT_TIMESTAMP', 'fecha y hora actual')
    .replace('now()', 'fecha y hora actual')
    .replace('CURRENT_DATE', 'fecha actual');
}

/** CHECK de una columna en lenguaje simple. */
function checkLegible(def) {
  const inList = def.match(/ANY \(\(?ARRAY\[(.*)\]\)?/);
  if (inList) {
    const vals = [...inList[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
    return `Valores: ${vals.join(', ')}`;
  }
  const cmp = def.match(/\((\w+) (>=|>) \(?(\d+)/);
  if (cmp) return `${cmp[2] === '>' ? '> ' : '≥ '}${cmp[3]}`;
  return def;
}

const esc = (s) => String(s).replace(/\|/g, '\\|');

const c = new Client({ connectionString: databaseUrl() });
await c.connect();
const { rows: cols } = await c.query(`
  SELECT table_name, column_name, data_type, character_maximum_length, numeric_precision, numeric_scale,
         is_nullable, column_default, ordinal_position
    FROM information_schema.columns WHERE table_schema = 'public'
   ORDER BY table_name, ordinal_position`);
const { rows: cons } = await c.query(`
  SELECT rel.relname AS tabla, con.contype AS tipo, pg_get_constraintdef(con.oid) AS def,
         ARRAY(SELECT att.attname FROM unnest(con.conkey) k JOIN pg_attribute att
               ON att.attrelid = con.conrelid AND att.attnum = k)::text[] AS columnas,
         frel.relname AS ref_tabla
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = rel.relnamespace AND n.nspname = 'public'
    LEFT JOIN pg_class frel ON frel.oid = con.confrelid`);
await c.end();

const salida = [];
const faltan = [];
for (const [grupo, tablas] of GRUPOS) {
  salida.push(`#### ${grupo}`, '');
  for (const [tabla, proposito] of tablas) {
    const columnas = cols.filter((x) => x.table_name === tabla);
    if (!columnas.length) throw new Error(`La tabla ${tabla} no existe en la base de datos.`);
    const deTabla = cons.filter((x) => x.tabla === tabla);
    const uniqueCompuestos = deTabla.filter((x) => x.tipo === 'u' && x.columnas.length > 1);

    salida.push(`**\`${tabla}\`** — ${proposito}`, '');
    salida.push('| Atributo | Tipo | Nulo | Clave | Restricción / defecto | Descripción |');
    salida.push('|--------------------|---------------|------|-----------|-------------------|--------------------------|');
    for (const col of columnas) {
      const n = col.column_name;
      const claves = [];
      const restric = [];
      for (const k of deTabla) {
        if (!k.columnas.includes(n)) continue;
        if (k.tipo === 'p') claves.push('PK');
        if (k.tipo === 'f') claves.push(`FK → ${k.ref_tabla}`);
        if (k.tipo === 'u' && k.columnas.length === 1) restric.push('Único');
        if (k.tipo === 'c') restric.push(checkLegible(k.def));
        const del = k.tipo === 'f' && k.def.match(/ON DELETE (CASCADE|SET NULL)/);
        if (del) restric.push(del[1] === 'CASCADE' ? 'Borra en cascada' : 'Queda nulo al borrar');
      }
      const d = defecto(col);
      if (d) restric.push(`Defecto: ${d}`);
      const desc = DESCRIPCIONES[`${tabla}.${n}`] ?? DESCRIPCIONES[`*.${n}`];
      if (!desc) faltan.push(`${tabla}.${n}`);
      salida.push(
        `| \`${n}\` | ${tipo(col)} | ${col.is_nullable === 'YES' ? 'Sí' : 'No'} | ${claves.join(', ') || '—'} | ${esc(restric.join('; ') || '—')} | ${desc ?? ''} |`,
      );
    }
    salida.push('');
    if (uniqueCompuestos.length) {
      salida.push(
        `Unicidad compuesta: ${uniqueCompuestos.map((u) => `(${u.columnas.map((x) => `\`${x}\``).join(', ')})`).join('; ')}.`,
        '',
      );
    }
  }
}

if (faltan.length) console.warn(`Atributos sin descripción: ${faltan.join(', ')}`);

const md = await readFile(E2, 'utf8');
const ini = '<!-- diccionario:inicio -->';
const fin = '<!-- diccionario:fin -->';
if (!md.includes(ini) || !md.includes(fin)) throw new Error('Faltan los marcadores del diccionario en ENTREGA_02.md');
const nuevo = md.replace(new RegExp(`${ini}[\\s\\S]*?${fin}`), `${ini}\n\n${salida.join('\n')}\n${fin}`);
await writeFile(E2, nuevo, 'utf8');
console.log(`Diccionario: ${GRUPOS.reduce((s, g) => s + g[1].length, 0)} tablas escritas en ${E2}`);
