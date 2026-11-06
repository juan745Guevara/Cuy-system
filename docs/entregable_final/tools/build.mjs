/*
 * build.mjs — Ensambla el Documento de Diseño Detallado (entregable final) y lo convierte a Word.
 *
 * Fuentes (ver README.md, "Mapa de ensamblaje"):
 *   - secciones/*.md            Secciones 1–3 y 5–8 y anexos del documento final.
 *   - entrega_02/ENTREGA_02.md  Sección 4 (Diseño de datos), reordenada según la estructura oficial.
 *
 * Salidas:
 *   - ENTREGABLE_FINAL.md    Markdown consolidado (legible, con las figuras como imágenes).
 *   - ENTREGABLE_FINAL.docx  Documento Word con carátula, índice y secciones numeradas.
 *
 * Estilos: tools/reference.docx (generado con tools/make_reference.py).
 * Reutiliza de entrega_01: tools/plantuml.jar y tools/mermaid.config.json.
 *
 * Uso:  node tools/build.mjs
 */

import { readFile, writeFile, mkdir, stat, open, rename } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { promisify } from 'node:util';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const run = promisify(execFile);
const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const E1 = path.join(ROOT, 'entrega_01');
const E2_FILE = path.join(ROOT, 'entrega_02', 'ENTREGA_02.md');
const BUILD = path.join(ROOT, '.build');
const IMG = path.join(ROOT, 'img');
const OUT_MD = path.join(ROOT, 'ENTREGABLE_FINAL.md');
// `node tools/build.mjs --out ruta.docx` escribe en otra ruta (útil si el Word está abierto).
const argOut = process.argv.indexOf('--out');
const DOCX = argOut > -1 ? path.resolve(process.argv[argOut + 1]) : path.join(ROOT, 'ENTREGABLE_FINAL.docx');
const REFERENCE = path.join(HERE, 'reference.docx'); // generado con tools/make_reference.py
const PLANTUML_JAR = path.join(E1, 'tools', 'plantuml.jar');
const MERMAID_CONFIG = path.join(E1, 'tools', 'mermaid.config.json');

/** Orden del documento. `SECCION_4` se genera desde la Entrega 2. */
const SECCION_4 = Symbol('seccion-4');
const ORDEN = [
  'secciones/01-introduccion.md',
  'secciones/02-modelo-dominio.md',
  'secciones/03-diseno-aplicacion.md',
  SECCION_4,
  'secciones/05-referencias.md',
  'secciones/06-anexos.md',
];

/** Límites de una figura en la hoja A4 (pulgadas). */
const MAX_W = 6.2;
const MAX_H = 7.5;

/* ------------------------------------------------------------------ */
/* Sección 4 desde la Entrega 2                                        */
/* ------------------------------------------------------------------ */

/** Divide ENTREGA_02.md en sus secciones "## N. Título". */
function seccionesE2(md) {
  const mapa = new Map();
  let actual = null;
  for (const linea of md.split('\n')) {
    const m = linea.match(/^##\s+(\d+)\.\s+(.*\S)\s*$/);
    if (m) {
      actual = { titulo: m[2], cuerpo: [] };
      mapa.set(Number(m[1]), actual);
      continue;
    }
    if (!actual) continue;
    if (/^---\s*$/.test(linea)) continue; // separadores
    if (/^>/.test(linea)) continue; // notas internas ("Fuente:", estado)
    actual.cuerpo.push(linea);
  }
  return mapa;
}

/** Quita la numeración propia de la entrega y baja los títulos `nivel` posiciones. */
function reubicar(cuerpo, desplazamiento) {
  return cuerpo
    .map((linea) => {
      const m = linea.match(/^(#{2,6})\s+(?:\d+(?:\.\d+)*\.?\s+)?(.*\S)\s*$/);
      if (!m) return linea;
      const nivel = Math.min(m[1].length + desplazamiento, 6);
      return `${'#'.repeat(nivel)} ${m[2]}`;
    })
    .join('\n')
    .trim();
}

/**
 * Estructura oficial de la sección 4 y su fuente en la Entrega 2.
 * nivel: nivel del título en el documento final; titulo: si se omite, se usa el de la Entrega 2.
 */
const MAPA_SECCION_4 = [
  { e2: 1, nivel: 2 },
  { e2: 2, nivel: 3 },
  { e2: 9, nivel: 3 },
  { e2: 3, nivel: 2 },
  { e2: 4, nivel: 3 },
  { e2: 5, nivel: 2 },
  { e2: 6, nivel: 2 },
  { e2: 7, nivel: 2, titulo: 'Dimensionamiento de almacenamiento' },
  { e2: 8, nivel: 2 },
];

function construirSeccion4(md) {
  const e2 = seccionesE2(md.replace(/\r\n?/g, '\n'));
  const partes = ['# Diseño de datos'];
  for (const { e2: num, nivel, titulo } of MAPA_SECCION_4) {
    const s = e2.get(num);
    if (!s) throw new Error(`ENTREGA_02.md no tiene la sección ${num}.`);
    // Los subtítulos de la Entrega 2 son "###" (nivel 3) y deben quedar un nivel debajo del título.
    partes.push(`${'#'.repeat(nivel)} ${titulo ?? s.titulo}`, reubicar(s.cuerpo, nivel + 1 - 3));
  }
  return partes.join('\n\n');
}

/* ------------------------------------------------------------------ */
/* Carátula e índice (OpenXML)                                         */
/* ------------------------------------------------------------------ */

const escapeXml = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const AZUL = '1B3A8C';
const AZUL_OSCURO = '0F2557';
const GRIS = '5A6478';

function wParagraph({ text = '', size = 24, bold = false, italic = false, caps = false, align = 'center', before = 0, after = 0, color = '1E2433', font = 'Cambria', rule = false }) {
  const runs = String(text)
    .split('\n')
    .map((line, i) => {
      const brk = i === 0 ? '' : '<w:br />';
      const rpr =
        `<w:rPr><w:rFonts w:ascii="${font}" w:hAnsi="${font}" w:cs="${font}" />` +
        `${bold ? '<w:b />' : ''}${italic ? '<w:i />' : ''}${caps ? '<w:caps />' : ''}` +
        `<w:color w:val="${color}" /><w:sz w:val="${size}" /><w:szCs w:val="${size}" /></w:rPr>`;
      return `<w:r>${rpr}${brk}<w:t xml:space="preserve">${escapeXml(line)}</w:t></w:r>`;
    })
    .join('');
  const borde = rule ? `<w:pBdr><w:bottom w:val="single" w:sz="18" w:space="1" w:color="${AZUL}" /></w:pBdr>` : '';
  return `<w:p><w:pPr>${borde}<w:spacing w:before="${before}" w:after="${after}" w:line="240" w:lineRule="auto" /><w:jc w:val="${align}" /></w:pPr>${runs}</w:p>`;
}

const wPageBreak = '<w:p><w:r><w:br w:type="page" /></w:r></w:p>';

/** Línea horizontal azul (párrafo vacío con borde inferior). */
const regla = (before, after) => wParagraph({ text: '', size: 4, rule: true, before, after });

/** Logotipo de la carrera en la carátula (vacío si no existe el archivo). */
const LOGO = path.join(HERE, 'logo-fiis.png');

/**
 * Carátula en dos partes: el encabezado institucional y el resto.
 * Entre ambas se inserta el logotipo como imagen Markdown (Pandoc gestiona el archivo).
 */
function buildCaratula(c) {
  const p = (t, opts) => (t ? wParagraph({ text: t, ...opts }) : '');
  const etiqueta = (t) => p(t, { size: 18, caps: true, color: GRIS, font: 'Calibri', after: 20 });
  const dato = (t, after = 220) => p(t, { size: 23, bold: true, color: AZUL_OSCURO, font: 'Calibri', after });
  const encabezado = [
    p(c.institucion, { size: 30, bold: true, color: AZUL_OSCURO, after: 80 }),
    p(c.facultad, { size: 22, bold: true, color: AZUL_OSCURO, after: 40 }),
    p(c.departamento, { size: 21, italic: true, color: GRIS, after: 0 }),
  ].filter(Boolean).join('\n');
  const cuerpo = [
    regla(120, 500),
    p(c.titulo, { size: 40, bold: true, caps: true, color: AZUL, after: 240 }),
    p(c.subtitulo, { size: 28, color: AZUL_OSCURO, after: 120 }),
    p(c.titulo_documento, { size: 22, italic: true, color: GRIS, after: 0 }),
    regla(500, 700),
    etiqueta('Integrantes'),
    ...c.autores.map((a, i) => p(a, { size: 22, color: '1E2433', font: 'Calibri', after: i === c.autores.length - 1 ? 260 : 10 })),
    etiqueta('Curso'),
    dato(c.curso),
    etiqueta('Docente'),
    dato(c.docente),
    etiqueta('Semestre académico'),
    dato(c.semestre, 0),
    p(c.institucion_guia ? `Caso de estudio: ${c.institucion_guia}` : '', { size: 19, italic: true, color: GRIS, font: 'Calibri', before: 700, after: 80 }),
    p([c.lugar, c.fecha].filter(Boolean).join(' · '), { size: 21, bold: true, color: AZUL_OSCURO, font: 'Calibri' }),
    wPageBreak,
  ].filter(Boolean).join('\n');
  return { encabezado, cuerpo };
}

function buildIndice() {
  return [
    '<w:p><w:pPr><w:pStyle w:val="TOCHeading" /></w:pPr><w:r><w:t>Índice</w:t></w:r></w:p>',
    '<w:p>' +
      '<w:r><w:fldChar w:fldCharType="begin" w:dirty="true" /></w:r>' +
      '<w:r><w:instrText xml:space="preserve"> TOC \\o "1-3" \\h \\z \\u </w:instrText></w:r>' +
      '<w:r><w:fldChar w:fldCharType="separate" /></w:r>' +
      '<w:r><w:rPr><w:i /></w:rPr><w:t xml:space="preserve">' +
      'Si el índice aparece vacío, seleccione todo el documento (Ctrl + E) y pulse F9.' +
      '</w:t></w:r>' +
      '<w:r><w:fldChar w:fldCharType="end" /></w:r></w:p>',
  ].join('\n');
}

/* ------------------------------------------------------------------ */
/* Diagramas -> PNG                                                    */
/* ------------------------------------------------------------------ */

async function pngSize(file) {
  const fh = await open(file, 'r');
  try {
    const buf = Buffer.alloc(24);
    await fh.read(buf, 0, 24, 0);
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  } finally {
    await fh.close();
  }
}

async function figureWidth(file) {
  const { width, height } = await pngSize(file);
  const w = (MAX_W * height) / width > MAX_H ? (MAX_H * width) / height : MAX_W;
  return Math.round(w * 100) / 100;
}

const existe = (f) => stat(f).then(() => true, () => false);

/** Genera (o reutiliza) el PNG de un diagrama. El nombre es el hash del código. */
async function renderizar(lenguaje, codigo) {
  const nombre = createHash('sha1').update(`${lenguaje}\n${codigo}`).digest('hex').slice(0, 12);
  const png = path.join(IMG, `${nombre}.png`);
  if (await existe(png)) return { png, nuevo: false };

  if (lenguaje === 'plantuml') {
    if (!(await existe(PLANTUML_JAR))) {
      throw new Error(`Falta ${PLANTUML_JAR}. Ejecute entrega_01\\tools\\fetch-plantuml.ps1.`);
    }
    const fuente = path.join(BUILD, `${nombre}.puml`);
    await writeFile(fuente, codigo, 'utf8');
    await run('java', ['-DPLANTUML_LIMIT_SIZE=16384', '-jar', PLANTUML_JAR, '-tpng', '-charset', 'UTF-8', '-o', BUILD, fuente], {
      maxBuffer: 1024 * 1024 * 32,
    });
    await rename(path.join(BUILD, `${nombre}.png`), png);
  } else {
    const fuente = path.join(BUILD, `${nombre}.mmd`);
    await writeFile(fuente, codigo, 'utf8');
    const config = (await existe(MERMAID_CONFIG)) ? `-c "${MERMAID_CONFIG}"` : '';
    const bat = path.join(BUILD, 'render-mermaid.cmd');
    const cmd = `npx -y @mermaid-js/mermaid-cli@11 -i "${fuente}" -o "${png}" ${config} -b white -s 2 -w 2400`;
    await writeFile(bat, ['@echo off', cmd, ''].join('\r\n'), 'utf8');
    await run('cmd.exe', ['/d', '/c', bat], { maxBuffer: 1024 * 1024 * 32 });
  }
  if (!(await existe(png))) throw new Error(`No se pudo generar ${png}`);
  return { png, nuevo: true };
}

/* ------------------------------------------------------------------ */
/* Ensamblaje                                                          */
/* ------------------------------------------------------------------ */

await mkdir(BUILD, { recursive: true });
await mkdir(IMG, { recursive: true });

const caratula = JSON.parse(await readFile(path.join(HERE, 'caratula.json'), 'utf8'));

const partes = [];
for (const item of ORDEN) {
  const md = item === SECCION_4
    ? construirSeccion4(await readFile(E2_FILE, 'utf8'))
    : (await readFile(path.join(ROOT, item), 'utf8')).replace(/\r\n?/g, '\n');
  partes.push(md.trim());
}
let cuerpo = partes.join('\n\n');

// Diagramas: ```plantuml {caption="..."} ... ``` -> imagen numerada.
const DIAGRAMA = /```(plantuml|mermaid)([^\n]*)\n([\s\S]*?)```/g;
const bloques = [...cuerpo.matchAll(DIAGRAMA)];
let figura = 0;
let nuevos = 0;
for (const b of bloques) {
  figura++;
  const caption = b[2].match(/caption="([^"]*)"/)?.[1] ?? 'Diagrama';
  const { png, nuevo } = await renderizar(b[1], b[3]);
  if (nuevo) nuevos++;
  const ancho = await figureWidth(png);
  const rel = path.relative(ROOT, png).split(path.sep).join('/');
  cuerpo = cuerpo.replace(b[0], `![Figura ${figura}. ${caption}](${rel}){ width=${ancho}in }`);
}
console.log(`Figuras: ${bloques.length} (${nuevos} generadas, ${bloques.length - nuevos} reutilizadas).`);

await writeFile(
  OUT_MD,
  `# ${caratula.titulo}\n\n**${caratula.subtitulo}** · ${caratula.curso} · ${caratula.semestre}\n\n---\n\n${cuerpo.replace(/^# /gm, '# ')}\n`,
  'utf8',
);
console.log(`Markdown consolidado: ${OUT_MD}`);

const portada = buildCaratula(caratula);
const logo = (await existe(LOGO))
  ? ['::: {custom-style="Logo"}', '![](tools/logo-fiis.png){ width=1.45in }', ':::', '']
  : [];
const render = [
  '```{=openxml}', portada.encabezado, '```', '',
  ...logo,
  '```{=openxml}', portada.cuerpo, '```', '',
  '```{=openxml}', buildIndice(), '```', '',
  cuerpo,
].join('\n');
const renderMd = path.join(BUILD, 'ENTREGABLE_FINAL.render.md');
await writeFile(renderMd, render, 'utf8');

const args = [
  renderMd,
  '-o', DOCX,
  '--from', 'markdown+raw_attribute',
  '--number-sections',
  '--resource-path', ROOT,
  '--metadata', 'lang=es-PE',
];
if (await existe(REFERENCE)) args.push('--reference-doc', REFERENCE);
await run('pandoc', args, { maxBuffer: 1024 * 1024 * 64 });
console.log(`Word: ${DOCX}`);
