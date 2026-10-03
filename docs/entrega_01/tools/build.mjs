/*
 * build.mjs — Ensambla la Entrega 1 y la convierte a Word.
 *
 * Pasos:
 *   1. Normaliza y concatena los capítulos 01.md ... 12.md.
 *   2. Escribe ENTREGA_01.md (markdown legible, con los diagramas en Mermaid).
 *   3. Convierte cada bloque ```mermaid y ```plantuml en una imagen PNG.
 *   4. Genera la carátula en OpenXML desde tools/caratula.json.
 *   5. Invoca a Pandoc para producir ENTREGA_01.docx.
 *
 * Uso:  node tools/build.mjs
 */

import { readFile, writeFile, mkdir, stat, open, rename } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const run = promisify(execFile);
const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const OUT = path.join(ROOT, 'ENTREGA_01.md');
const BUILD = path.join(ROOT, '.build');
const IMG = path.join(ROOT, 'img');
const DOCX = path.join(ROOT, 'ENTREGA_01.docx');
const REFERENCE = path.join(ROOT, 'reference.docx');
const MERMAID_CONFIG = path.join(HERE, 'mermaid.config.json');
const PLANTUML_JAR = path.join(HERE, 'plantuml.jar');

/** Tamaño de una imagen dentro de la hoja A4 con márgenes de 2.5 cm. */
const MAX_W = 6.2;
const MAX_H = 8.4;

/** Lee el ancho y alto de un PNG desde la cabecera IHDR. */
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

/** Ancho en pulgadas para la figura, respetando los límites de la hoja. */
async function figureWidth(file) {
  const { width, height } = await pngSize(file);
  let w = MAX_W;
  let h = (MAX_W * height) / width;
  if (h > MAX_H) {
    h = MAX_H;
    w = (MAX_H * width) / height;
  }
  return Math.round(w * 100) / 100;
}

const CAPITULOS = [
  '01.md', '02.md', '03.md', '04.md', '05.md', '06.md',
  '07.md', '08.md', '09.md', '10.md', '11.md', '12.md',
];

/* Pie de cada figura: clave "<capitulo>-<indice>". */
const FIGURAS = {
  '4-1': 'Modelo conceptual del dominio: estructura de alojamiento y razas',
  '4-2': 'Modelo conceptual del dominio: reproducción, camadas y genealogía',
  '4-3': 'Modelo conceptual del dominio: crecimiento biométrico, destete y sanidad',
  '4-4': 'Modelo conceptual del dominio: salidas (ventas, descartes, mortalidad) e inventario',
  '7-1': 'Diagrama general de casos de uso y actores del sistema',
  '7-2': 'Casos de uso del ciclo productivo y reproductivo',
  '7-3': 'Casos de uso del proceso de ventas y salidas definitivas',
  '7-4': 'Casos de uso de biometría, sanidad y manejo de jaulas',
  '7-5': 'Casos de uso de control de inventario, dashboard y reportes',
  '7-6': 'Diagrama de caso de uso detallado para el flujo del proceso de ventas',
  '9-1': 'Paquetes del frontend y sus dependencias',
  '9-2': 'Paquetes del backend y dependencias entre módulos',
  '9-3': 'Estructura interna de un módulo del backend',
  '9-4': 'Núcleo compartido (shared) y sus componentes',
  '10-1': 'Componentes de presentación: navegador y servidor frontend',
  '10-2': 'Componentes del servidor de API y base de datos',
};

/* ------------------------------------------------------------------ */
/* Utilidades                                                          */
/* ------------------------------------------------------------------ */

const escapeXml = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Párrafo en OpenXML para la carátula. */
function wParagraph({ text = '', size = 24, bold = false, italic = false, caps = false, align = 'center', before = 0, after = 0 }) {
  const runs = String(text)
    .split('\n')
    .map((line, i) => {
      const brk = i === 0 ? '' : '<w:br />';
      const rpr =
        '<w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman" />' +
        `${bold ? '<w:b />' : ''}${italic ? '<w:i />' : ''}${caps ? '<w:caps />' : ''}` +
        `<w:sz w:val="${size}" /><w:szCs w:val="${size}" /></w:rPr>`;
      return `<w:r>${rpr}${brk}<w:t xml:space="preserve">${escapeXml(line)}</w:t></w:r>`;
    })
    .join('');
  return `<w:p><w:pPr><w:spacing w:before="${before}" w:after="${after}" w:line="240" w:lineRule="auto" /><w:jc w:val="${align}" /></w:pPr>${runs}</w:p>`;
}

const wPageBreak = '<w:p><w:r><w:br w:type="page" /></w:r></w:p>';

/** Índice (campo TOC de Word) que se coloca después de la carátula.
 *  Se marca como "dirty" para que Word lo actualice al abrir el documento. */
function buildIndice() {
  const titulo =
    '<w:p><w:pPr><w:pStyle w:val="TOCHeading" /><w:jc w:val="center" /></w:pPr>' +
    '<w:r><w:rPr><w:color w:val="000000" /></w:rPr><w:t>Índice</w:t></w:r></w:p>';
  const campo =
    '<w:p><w:pPr><w:tabs><w:tab w:val="right" w:leader="dot" w:pos="9060" /></w:tabs></w:pPr>' +
    '<w:r><w:fldChar w:fldCharType="begin" w:dirty="true" /></w:r>' +
    '<w:r><w:instrText xml:space="preserve"> TOC \\o "1-3" \\h \\z \\u </w:instrText></w:r>' +
    '<w:r><w:fldChar w:fldCharType="separate" /></w:r>' +
    '<w:r><w:rPr><w:i /></w:rPr><w:t xml:space="preserve">' +
    'Si el índice se muestra vacío o desactualizado, seleccione todo el documento (Ctrl + E) y pulse F9 para actualizar los campos.' +
    '</w:t></w:r>' +
    '<w:r><w:fldChar w:fldCharType="end" /></w:r></w:p>';
  return [titulo, campo, wPageBreak].join('\n');
}

/** Carátula en OpenXML a partir de tools/caratula.json. Los campos entre
 *  corchetes se consideran pendientes y se omiten. */
function buildCaratula(c) {
  const usable = (t) => t && !String(t).trim().startsWith('[') && String(t).trim().length > 0;
  const p = (t, opts) => (usable(t) ? wParagraph({ text: t, ...opts }) : '');

  const autoresParrafos = Array.isArray(c.autores) && c.autores.length > 0
    ? [
        p('Autores', { size: 22, italic: true, after: 60 }),
        ...c.autores.map((a, idx) => p(a, { size: 22, bold: true, after: idx === c.autores.length - 1 ? 300 : 30 })),
      ]
    : [
        p('Autor', { size: 22, italic: true, after: 60 }),
        p(c.autor, { size: 24, bold: true, after: 0 }),
        p(c.codigo, { size: 22, after: 360 }),
      ];

  return [
    wParagraph({ text: c.institucion || '', size: 30, bold: true, after: 120 }),
    p(c.facultad, { size: 26, bold: true, after: 60 }),
    p(c.departamento, { size: 22, italic: true, after: 240 }),
    p(c.institucion_guia, { size: 20, italic: true, after: 480 }),
    wParagraph({ text: c.titulo || '', size: 34, bold: true, caps: true, before: 180, after: 180 }),
    p(c.subtitulo, { size: 24, bold: true, after: 240 }),
    p(c.titulo_documento, { size: 22, italic: true, after: 480 }),
    ...autoresParrafos,
    p('Docente', { size: 22, italic: true, after: 40 }),
    p(c.docente, { size: 22, bold: true, after: 240 }),
    p('Curso', { size: 22, italic: true, after: 40 }),
    p(c.curso, { size: 22, bold: true, after: 480 }),
    wParagraph({ text: [c.lugar, c.fecha].filter(usable).join(' — '), size: 22, bold: true, before: 180 }),
    wPageBreak,
  ].filter(Boolean).join('\n');
}

/** Normaliza la jerarquía de títulos: cada capítulo pasa a nivel 2. */
function normalizeHeadings(md) {
  let first = true;
  return md
    .split('\n')
    .map((line) => {
      const m = line.match(/^(#{1,6})\s+(.*\S)\s*$/);
      if (!m) return line;
      const text = m[2];
      if (first) {
        first = false;
        return `## ${text}`;
      }
      if (/^\d+\.\d+\.\d+/.test(text)) return `#### ${text}`;
      if (/^\d+\.\d+/.test(text)) return `### ${text}`;
      return `${'#'.repeat(Math.min(m[1].length + 1, 6))} ${text}`;
    })
    .join('\n');
}

/* ------------------------------------------------------------------ */
/* 1. Consolidar los capítulos                                         */
/* ------------------------------------------------------------------ */

await mkdir(BUILD, { recursive: true });
await mkdir(IMG, { recursive: true });

const caratulaRaw = JSON.parse(await readFile(path.join(HERE, 'caratula.json'), 'utf8'));
const caratula = { ...caratulaRaw };
delete caratula._comentario;
delete caratula._nota;

let cuerpo = '';
for (const archivo of CAPITULOS) {
  const raw = await readFile(path.join(ROOT, archivo), 'utf8');
  cuerpo += `${normalizeHeadings(raw.replace(/\r\n?/g, '\n').replace(/\s+$/, ''))}\n\n`;
}

// 2. Markdown legible (los diagramas se quedan como código Mermaid).
const listaAutores = Array.isArray(caratula.autores)
  ? caratula.autores.map((a) => `- ${a}`).join('\n')
  : `- ${caratula.autor ?? ''}`;

const encabezado = [
  '# Entregable 1 — Unidad I: Fundamentos y Estrategias de Diseño',
  '',
  '**Título:** Modelo del Dominio, Casos de Uso y Diseño de Aplicación Preliminar',
  '',
  `**Institución:** ${caratula.institucion ?? ''} — ${caratula.facultad ?? ''}`,
  `**Entorno de aplicación:** ${caratula.institucion_guia ?? ''}`,
  '',
  '**Autores:**',
  listaAutores,
  '',
  `**Docente:** ${caratula.docente ?? ''} · **Fecha:** ${caratula.fecha ?? ''}`,
  '',
  '---',
  '',
].join('\n');
await writeFile(OUT, `${encabezado}${cuerpo}`, 'utf8');
console.log(`Markdown consolidado: ${OUT}`);

/* ------------------------------------------------------------------ */
/* 2. Diagramas Mermaid / PlantUML -> PNG                             */
/* ------------------------------------------------------------------ */

const DIAGRAMA = /```(mermaid|plantuml)\n([\s\S]*?)```/g;
const bloques = [...cuerpo.matchAll(DIAGRAMA)];

/** Capítulo (número sin cero) al que pertenece una posición del texto. */
function capituloDe(md, indice) {
  const antes = md.slice(0, indice);
  const m = [...antes.matchAll(/^##\s+(\d+)\.\s/gm)].pop();
  return m?.[1] ?? '0';
}

/** Posición del diagrama dentro de su capítulo (1, 2, ...). */
function indiceDe(capitulo, md, indice) {
  const desde = md.lastIndexOf(`## ${capitulo}. `, indice);
  return (md.slice(desde, indice).match(/```(?:mermaid|plantuml)/g) || []).length + 1;
}

let conImagenes = cuerpo;
let regenerados = 0;

for (const bloque of bloques) {
  const lenguaje = bloque[1];
  const capitulo = capituloDe(cuerpo, bloque.index);
  const orden = indiceDe(capitulo, cuerpo, bloque.index);
  const nombre = `${String(capitulo).padStart(2, '0')}-${orden}`;
  const clave = `${capitulo}-${orden}`;
  const extension = lenguaje === 'plantuml' ? 'puml' : 'mmd';
  const fuente = path.join(BUILD, `${nombre}.${extension}`);
  const png = path.join(IMG, `${nombre}.png`);
  const bat = path.join(BUILD, 'render-diagrama.cmd');

  await writeFile(fuente, bloque[2], 'utf8');
  await writeFile(path.join(IMG, `${nombre}.${extension}`), bloque[2], 'utf8');

  const previa = await stat(png).catch(() => null);
  if (!previa || previa.mtimeMs < (await stat(fuente)).mtimeMs) {
    if (lenguaje === 'plantuml') {
      if (!(await stat(PLANTUML_JAR).catch(() => null))) {
        throw new Error(
          `Falta ${PLANTUML_JAR}. Ejecute tools\\fetch-plantuml.ps1 para descargarlo.`,
        );
      }
      await run(
        'java',
        [
          `-DPLANTUML_LIMIT_SIZE=16384`,
          '-jar', PLANTUML_JAR,
          '-tpng',
          '-charset', 'UTF-8',
          '-o', BUILD,
          fuente,
        ],
        { maxBuffer: 1024 * 1024 * 32 },
      );
      await rename(path.join(BUILD, `${nombre}.png`), png);
    } else {
      const config = await stat(MERMAID_CONFIG).catch(() => null);
      const cmd = [
        'npx -y @mermaid-js/mermaid-cli@11',
        `-i "${fuente}"`,
        `-o "${png}"`,
        config ? `-c "${MERMAID_CONFIG}"` : '',
        '-b white -s 2 -w 2400',
      ]
        .filter(Boolean)
        .join(' ');
      await writeFile(bat, ['@echo off', cmd, ''].join('\r\n'), 'utf8');
      await run('cmd.exe', ['/d', '/c', bat], { maxBuffer: 1024 * 1024 * 32 });
    }
    if (!(await stat(png).catch(() => null))) {
      throw new Error(`No se pudo generar la imagen ${png}`);
    }
    regenerados++;
  }

  const pie = FIGURAS[clave] ?? `Diagrama del capítulo ${capitulo}`;
  const ancho = await figureWidth(png);
  conImagenes = conImagenes.replace(
    bloque[0],
    `![Figura ${capitulo}.${orden}. ${pie}](img/${nombre}.png){ width=${ancho}in }`,
  );
}

console.log(
  `Diagramas: ${bloques.length} encontrados, ${regenerados} regenerados ` +
  `(${bloques.filter((b) => b[1] === 'plantuml').length} PlantUML, ` +
  `${bloques.filter((b) => b[1] === 'mermaid').length} Mermaid).`,
);

/* ------------------------------------------------------------------ */
/* 3. Markdown intermedio para Pandoc (carátula + saltos + imágenes)   */
/* ------------------------------------------------------------------ */

const conSaltos = conImagenes.replace(
  /^(##\s+\d+\.\s)/gm,
  (_m, h) => `\`\`\`{=openxml}\n${wPageBreak}\n\`\`\`\n\n${h}`,
);

const render = [
  '```{=openxml}',
  buildCaratula(caratula),
  '```',
  '',
  '```{=openxml}',
  buildIndice(),
  '```',
  '',
  conSaltos,
].join('\n');
await writeFile(path.join(BUILD, 'ENTREGA_01.render.md'), render, 'utf8');

/* ------------------------------------------------------------------ */
/* 4. Pandoc -> DOCX                                                   */
/* ------------------------------------------------------------------ */

const args = [
  path.join(BUILD, 'ENTREGA_01.render.md'),
  '-o', DOCX,
  '--from', 'markdown+raw_attribute',
  '--resource-path', ROOT,
  '--metadata', 'lang=es-PE',
];
if (await stat(REFERENCE).catch(() => null)) args.push('--reference-doc', REFERENCE);

await run('pandoc', args, { maxBuffer: 1024 * 1024 * 64 });

console.log(`Word: ${DOCX}`);