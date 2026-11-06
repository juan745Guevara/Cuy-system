# Entregable final — Documento de Diseño Detallado de Software

Documento integrador del curso. Reúne las entregas en la **estructura mínima oficial** (sección IV de `docs/INIDCACIONES TRABAJO FINAL.pdf`) y se genera en Word con un solo comando.

## Estructura de la carpeta

```text
entregable_final/
├── README.md                ← este mapa
├── ENTREGABLE_FINAL.docx    ← documento generado (no editar a mano)
├── ENTREGABLE_FINAL.md      ← misma versión en Markdown, para revisión rápida
├── secciones/               ← texto del documento (versión resumida de la Entrega 1, referencias y anexos)
├── entrega_01/              ← Entrega 1 tal como se entregó (archivo histórico; no se edita)
├── entrega_02/              ← Entrega 2: ENTREGA_02.md (fuente de la sección 4)
└── tools/                   ← build.mjs, caratula.json, make_reference.py (formato), diccionario.mjs
```

## Cómo generar el Word

```bash
cd docs/entregable_final
node tools/build.mjs
```

Requiere Node.js, Pandoc, Java (PlantUML) y conexión para `npx @mermaid-js/mermaid-cli` la primera vez. Los diagramas se escriben como bloques ` ```plantuml {caption="…"} ` o ` ```mermaid {caption="…"} `; el script los convierte en figuras numeradas y solo vuelve a dibujar los que cambian. Al abrir el Word, si el índice aparece vacío: **Ctrl + E** y **F9**.

## Regla de trabajo

- **Una sola fuente por contenido.** Lo que corresponde a la Entrega 2 (o 3) se escribe en su carpeta; el script lo integra en la sección 4 (o 5). El resto se escribe en `secciones/`.
- **La Entrega 1 no se edita.** `secciones/01–03` es su versión resumida y corregida; las observaciones del docente se aplican ahí.
- Sin redundancia entre secciones: el modelo conceptual (2.1) se cita desde el diseño de datos (4), no se repite.

## Mapa de ensamblaje

El documento contiene **solo lo entregado hasta ahora (Entregas 1 y 2)**. Las secciones de las Entregas 3 y 4 se agregan cuando se trabajen (nuevo archivo en `secciones/` y una línea en `ORDEN` de `tools/build.mjs`); la numeración se ajusta sola.

| Sección del documento | Fuente | Estado |
|---|---|---|
| Carátula e índice | `tools/caratula.json` (índice automático) | ✅ |
| 1. Introducción (caso de negocio, objetivos, alcance) | `secciones/01-introduccion.md` | ✅ |
| 2. Modelo del dominio (conceptual, casos de uso, glosario) | `secciones/02-modelo-dominio.md` | ✅ |
| 3. Diseño de aplicación (arquitectura + ISO 25010, paquetes, componentes, SOLID) | `secciones/03-diseno-aplicacion.md` | ✅ |
| 4. Diseño de datos | `entrega_02/ENTREGA_02.md` (reordenada por el script) | ✅ |
| Referencias bibliográficas (APA) | `secciones/05-referencias.md` | ✅ |
| Anexo A (API REST) y B (puertos) | `secciones/06-anexos.md` | ✅ |

Correspondencia de la sección 4 con la Entrega 2: 4.1 ← §1 + §2 (ciclo de vida) + §9 (justificación) · 4.2 ← §3 + §4 (normalización) · 4.3 ← §5 · 4.4 ← §6 · 4.5 ← §7 · 4.6 ← §8.

## Formato

El estilo del Word (azul institucional de Ingeniería en Informática y Sistemas, logotipo `tools/logo-fiis.png`, tipografía Cambria/Calibri, tablas, encabezado y numeración de páginas) se define en `tools/make_reference.py`, que genera `tools/reference.docx`. Para cambiar el formato: editar ese script, ejecutar `python tools/make_reference.py` y luego `node tools/build.mjs`.

Si el Word está abierto, el script no puede sobrescribirlo: ciérrelo o use `node tools/build.mjs --out otra-ruta.docx`.

## Notas para la Entrega 2

- El script toma `ENTREGA_02.md` por sus títulos `## N.`: **mantener los 9 números** del enunciado; los subtítulos `### N.M.` se renumeran solos.
- Las líneas que empiezan con `>` (notas internas y `Fuente:`) no pasan al documento final.
- Evitar referencias como "§9": en el documento final esa sección es otra (4.1.6). Mejor citar por nombre.
- El diccionario de datos (4.4.2) se genera desde la base de datos real: con PostgreSQL migrado (`npm run db:migrate` en `backend/`), ejecutar `node tools/diccionario.mjs`. Reescribe solo el bloque entre `<!-- diccionario:inicio -->` y `<!-- diccionario:fin -->`; las descripciones de cada atributo están en ese script.
