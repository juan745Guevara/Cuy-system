/*
 * anexo-api.mjs — Genera el Anexo A (especificación de la API REST) desde el OpenAPI del backend.
 *
 * Lee la especificación que publica Swagger (backend en modo desarrollo) y reemplaza el bloque
 *   <!-- api:inicio -->  …  <!-- api:fin -->
 * de secciones/06-anexos.md, para que el anexo coincida siempre con las rutas reales.
 *
 * Uso (con el backend corriendo: npm run dev):
 *   node tools/anexo-api.mjs                         lee http://localhost:3001/api-docs-json
 *   node tools/anexo-api.mjs --url <url-del-json>    otra dirección
 */

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ANEXOS = path.resolve(HERE, '..', 'secciones', '06-anexos.md');
const argUrl = process.argv.indexOf('--url');
const URL_SPEC = argUrl > -1 ? process.argv[argUrl + 1] : 'http://localhost:3001/api-docs-json';

/** Orden y título de cada grupo (tag de Swagger → módulo del backend). */
const MODULOS = [
  ['Módulo Platform', ['Autenticación', 'Usuarios', 'Granjas', 'Especies', 'Áreas', 'Recintos (jaulas)', 'Animales', 'Pesajes', 'Tratamientos', 'Mortalidad', 'Auditoría']],
  ['Módulo Cuyes', ['Cuyes · Catálogos', 'Cuyes · Empadres', 'Cuyes · Partos', 'Cuyes · Destetes', 'Cuyes · Movimientos', 'Cuyes · Ventas', 'Cuyes · Inventario', 'Cuyes · Alertas', 'Cuyes · Ranking', 'Cuyes · Reportes', 'Cuyes · Procesos BPMN']],
];

const ORDEN_METODO = { get: 0, post: 1, put: 2, patch: 3, delete: 4 };

function parametros(op) {
  const partes = [];
  const enRuta = (op.parameters || []).filter((p) => p.in === 'path').map((p) => `\`${p.name}\``);
  const enQuery = (op.parameters || []).filter((p) => p.in === 'query').map((p) => `\`${p.name}\``);
  if (enRuta.length) partes.push(`ruta: ${enRuta.join(', ')}`);
  if (enQuery.length) partes.push(`query: ${enQuery.join(', ')}`);
  const schema = op.requestBody?.content?.['application/json']?.schema;
  if (schema?.properties) {
    const req = new Set(schema.required || []);
    const campos = Object.keys(schema.properties).map((k) => `\`${k}\`${req.has(k) ? '\\*' : ''}`);
    partes.push(`body: ${campos.join(', ')}`);
  }
  return partes.join('; ') || '—';
}

const res = await fetch(URL_SPEC);
if (!res.ok) throw new Error(`No se pudo leer ${URL_SPEC} (HTTP ${res.status}). ¿Está corriendo el backend en modo desarrollo?`);
const spec = await res.json();

const porTag = new Map();
for (const [ruta, ops] of Object.entries(spec.paths)) {
  for (const [metodo, op] of Object.entries(ops)) {
    const tag = (op.tags || ['Otros'])[0];
    if (tag === 'Salud') continue;
    if (!porTag.has(tag)) porTag.set(tag, []);
    porTag.get(tag).push({
      metodo: metodo.toUpperCase(),
      orden: ORDEN_METODO[metodo] ?? 9,
      ruta: ruta.replace(/^\/api\/v1/, '').replace(/\{(\w+)\}/g, ':$1'),
      params: parametros(op),
      desc: (op.summary || '').trim(),
    });
  }
}

const conocidos = new Set(MODULOS.flatMap(([, tags]) => tags));
const sinGrupo = [...porTag.keys()].filter((t) => !conocidos.has(t));
if (sinGrupo.length) MODULOS.push(['Otros', sinGrupo]);

const salida = [];
let total = 0;
for (const [modulo, tags] of MODULOS) {
  salida.push(`### ${modulo} {.unnumbered}`, '');
  for (const tag of tags) {
    const ops = porTag.get(tag);
    if (!ops?.length) continue;
    ops.sort((a, b) => a.ruta.localeCompare(b.ruta) || a.orden - b.orden);
    total += ops.length;
    salida.push(`**${tag.replace(/^Cuyes · /, '')}**`, '');
    salida.push('| Método | Ruta | Parámetros (\\* obligatorio) | Descripción |');
    salida.push('|----------|--------------------------|--------------------------|----------------------|');
    for (const o of ops) salida.push(`| ${o.metodo} | \`${o.ruta}\` | ${o.params} | ${o.desc} |`);
    salida.push('');
  }
}

const md = await readFile(ANEXOS, 'utf8');
const ini = '<!-- api:inicio -->';
const fin = '<!-- api:fin -->';
if (!md.includes(ini) || !md.includes(fin)) throw new Error('Faltan los marcadores <!-- api:inicio/fin --> en 06-anexos.md');
await writeFile(ANEXOS, md.replace(new RegExp(`${ini}[\\s\\S]*?${fin}`), `${ini}\n\n${salida.join('\n')}\n${fin}`), 'utf8');
console.log(`Anexo A: ${total} operaciones escritas en ${ANEXOS}`);
