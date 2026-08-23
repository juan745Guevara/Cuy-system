const express = require('express');
const ExcelJS = require('exceljs');
const { pool } = require('../config/database');
const { asyncHandler, promedioPesos } = require('../utils/helpers');
const { authRequired, loadUserFarms, requireFarmAccess } = require('../middleware/auth');

const router = express.Router();
router.use(authRequired, loadUserFarms, requireFarmAccess);

async function workbookResponse(res, filename, build) {
  const wb = new ExcelJS.Workbook();
  await build(wb);
  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  await wb.xlsx.write(res);
  res.end();
}

function headerUnidad(ws, titulo) {
  ws.mergeCells('A1:V1');
  ws.getCell('A1').value = 'UNIDAD DE CUYES Y CONEJOS - FACULTAD DE ZOOTECNIA - UNAS';
  ws.getCell('A1').font = { bold: true, size: 12 };
  ws.mergeCells('A2:V2');
  ws.getCell('A2').value = titulo;
  ws.getCell('A2').font = { bold: true, size: 11 };
}

// CUY-22
router.get(
  '/hembras',
  asyncHandler(async (req, res) => {
    const idAnimal = req.query.id_animal ? Number(req.query.id_animal) : null;
    const params = [req.granjaId];
    let filter = `a.id_granja = $1 AND a.sexo = 'H'`;
    if (idAnimal) {
      params.push(idAnimal);
      filter += ` AND a.id = $${params.length}`;
    } else {
      filter += ` AND a.estado = 'activo'`;
    }

    const { rows: hembras } = await pool.query(
      `SELECT a.*, r.nombre AS raza, j.codigo AS jaula,
              (SELECT string_agg(ap.texto, '; ' ORDER BY ap.fecha)
                 FROM animal_particularidades ap WHERE ap.id_animal = a.id) AS particularidades
       FROM animales a
       LEFT JOIN razas r ON r.id = a.id_raza
       LEFT JOIN jaulas j ON j.id = a.id_jaula
       WHERE ${filter}
       ORDER BY a.codigo`,
      params
    );

    if (!hembras.length) {
      return res.status(400).json({ error: 'No hay datos de hembras para exportar en el periodo/alcance' });
    }

    const ids = hembras.map((h) => h.id);
    const ciclos = await pool.query(
      `SELECT eh.id_hembra, e.id AS id_empadre, e.fecha_empadre, eh.resultado,
              m.codigo AS macho_codigo,
              p.id AS id_parto, p.fecha_parto, p.vivos_m, p.vivos_h, p.muertos,
              p.peso_m1, p.peso_m2, p.peso_m3, p.peso_h1, p.peso_h2, p.peso_h3,
              d.fecha_destete, d.destetados_m, d.destetados_h, d.muertos AS muertos_destete,
              d.peso_m1 AS dm1, d.peso_m2 AS dm2, d.peso_m3 AS dm3,
              d.peso_h1 AS dh1, d.peso_h2 AS dh2, d.peso_h3 AS dh3
       FROM empadre_hembras eh
       JOIN empadres e ON e.id = eh.id_empadre
       LEFT JOIN animales m ON m.id = e.id_macho
       LEFT JOIN partos p ON p.id_empadre = e.id AND p.id_hembra = eh.id_hembra
       LEFT JOIN destetes d ON d.id_parto = p.id
       WHERE eh.id_hembra = ANY($1::int[])
       ORDER BY eh.id_hembra, e.fecha_empadre, p.fecha_parto`,
      [ids]
    );
    const byHembra = {};
    for (const c of ciclos.rows) {
      if (!byHembra[c.id_hembra]) byHembra[c.id_hembra] = [];
      byHembra[c.id_hembra].push(c);
    }

    await workbookResponse(res, 'registro-hembras.xlsx', async (wb) => {
      const ws = wb.addWorksheet('Registro Hembras');
      headerUnidad(ws, 'Registro Individual de Cuyes');
      let row = 4;
      for (const h of hembras) {
        ws.getCell(row, 1).value = 'Código Reproductora:';
        ws.getCell(row, 3).value = h.codigo;
        ws.getCell(row, 5).value = h.jaula ? `Jaula: ${h.jaula}` : '';
        ws.getCell(row, 7).value = 'Raza';
        ws.getCell(row, 9).value = h.raza || '';
        ws.getCell(row, 15).value = 'Fecha de Nacimiento:';
        ws.getCell(row, 17).value = h.fecha_nacimiento
          ? String(h.fecha_nacimiento).slice(0, 10)
          : '';
        row += 1;
        ws.getCell(row, 1).value = 'Particularidades:';
        ws.getCell(row, 3).value = h.particularidades || '';
        row += 1;
        const headers = [
          'Parto',
          'Código Macho Empadre',
          'Fecha Empadre',
          'Fecha Nacimiento',
          'Tamaño Camada Nacimiento',
          'Muertos al Nacimiento',
          'Peso M1',
          'Peso M2',
          'Peso M3',
          'Peso H1',
          'Peso H2',
          'Peso H3',
          'Peso Promedio Nac.',
          'Fecha Destete',
          'Tamaño Camada Destete',
          'Muertos al Destete',
          'Peso Dest M1',
          'Peso Dest M2',
          'Peso Dest M3',
          'Peso Dest H1',
          'Peso Dest H2',
          'Peso Dest H3',
          'Peso Promedio Dest.',
        ];
        headers.forEach((t, i) => {
          ws.getCell(row, i + 1).value = t;
          ws.getCell(row, i + 1).font = { bold: true };
        });
        row += 1;
        const ciclosH = byHembra[h.id] || [];
        let n = 1;
        for (const c of ciclosH) {
          if (c.resultado === 'vacia' || c.resultado === 'aborto') {
            ws.getCell(row, 1).value = n;
            ws.getCell(row, 2).value = c.macho_codigo || '';
            ws.getCell(row, 3).value = c.fecha_empadre
              ? String(c.fecha_empadre).slice(0, 10)
              : '';
            ws.getCell(row, 4).value = String(c.resultado).toUpperCase();
            row += 1;
            n += 1;
            continue;
          }
          if (!c.id_parto && c.resultado === 'abierto') continue;
          const vivos = (c.vivos_m || 0) + (c.vivos_h || 0);
          const promN = promedioPesos(
            c.peso_m1,
            c.peso_m2,
            c.peso_m3,
            c.peso_h1,
            c.peso_h2,
            c.peso_h3
          );
          const promD = promedioPesos(c.dm1, c.dm2, c.dm3, c.dh1, c.dh2, c.dh3);
          const vals = [
            n,
            c.macho_codigo || '',
            c.fecha_empadre ? String(c.fecha_empadre).slice(0, 10) : '',
            c.fecha_parto ? String(c.fecha_parto).slice(0, 10) : '',
            vivos || '',
            c.muertos ?? '',
            c.peso_m1,
            c.peso_m2,
            c.peso_m3,
            c.peso_h1,
            c.peso_h2,
            c.peso_h3,
            promN,
            c.fecha_destete ? String(c.fecha_destete).slice(0, 10) : '',
            c.fecha_destete ? (c.destetados_m || 0) + (c.destetados_h || 0) : '',
            c.muertos_destete ?? '',
            c.dm1,
            c.dm2,
            c.dm3,
            c.dh1,
            c.dh2,
            c.dh3,
            promD,
          ];
          vals.forEach((v, i) => {
            ws.getCell(row, i + 1).value = v == null ? '' : v;
          });
          row += 1;
          n += 1;
        }
        row += 2;
      }
    });
  })
);

// CUY-23
router.get(
  '/machos',
  asyncHandler(async (req, res) => {
    const { rows: machos } = await pool.query(
      `SELECT a.*, r.nombre AS raza,
              (SELECT string_agg(ap.texto, '; ') FROM animal_particularidades ap WHERE ap.id_animal = a.id) AS particularidades
       FROM animales a
       LEFT JOIN razas r ON r.id = a.id_raza
       WHERE a.id_granja = $1 AND a.sexo = 'M' AND a.estado = 'activo'
       ORDER BY a.codigo`,
      [req.granjaId]
    );
    if (!machos.length) {
      return res.status(400).json({ error: 'No hay datos de machos para exportar' });
    }

    const ids = machos.map((m) => m.id);
    const ev = await pool.query(
      `SELECT e.*, 
              (SELECT string_agg(a.codigo, ', ') FROM empadre_hembras eh
                JOIN animales a ON a.id = eh.id_hembra WHERE eh.id_empadre = e.id) AS hembras_codigos,
              (SELECT COUNT(*)::int FROM empadre_hembras eh WHERE eh.id_empadre = e.id) AS cant_hembras,
              (SELECT COUNT(*)::int FROM empadre_hembras eh WHERE eh.id_empadre = e.id AND eh.resultado IN ('prenez','abierto')) AS cant_prenadas,
              (SELECT COALESCE(SUM(p.vivos_m+p.vivos_h),0)::int FROM partos p
                JOIN empadre_hembras eh ON eh.id_empadre = e.id AND p.id_hembra = eh.id_hembra
                WHERE p.id_empadre = e.id) AS camada,
              (SELECT COALESCE(SUM(p.vivos_m),0)::int FROM partos p WHERE p.id_empadre = e.id) AS nac_m,
              (SELECT COALESCE(SUM(p.vivos_h),0)::int FROM partos p WHERE p.id_empadre = e.id) AS nac_h
       FROM empadres e
       WHERE e.id_macho = ANY($1::int[])
       ORDER BY e.id_macho, e.fecha_empadre`,
      [ids]
    );
    const byMacho = {};
    for (const e of ev.rows) {
      if (!byMacho[e.id_macho]) byMacho[e.id_macho] = [];
      byMacho[e.id_macho].push(e);
    }

    await workbookResponse(res, 'registro-machos.xlsx', async (wb) => {
      const ws = wb.addWorksheet('Registro Machos');
      headerUnidad(ws, 'Registro Individual de Reproductores');
      let row = 4;
      for (const m of machos) {
        ws.getCell(row, 1).value = 'Código Reproductor:';
        ws.getCell(row, 3).value = m.codigo;
        ws.getCell(row, 5).value = 'Raza';
        ws.getCell(row, 6).value = m.raza || '';
        ws.getCell(row, 8).value = 'Fecha de Nacimiento:';
        ws.getCell(row, 10).value = m.fecha_nacimiento
          ? String(m.fecha_nacimiento).slice(0, 10)
          : '';
        row += 1;
        ws.getCell(row, 1).value = 'Particularidades:';
        ws.getCell(row, 3).value = m.particularidades || '';
        row += 1;
        [
          'Empadre',
          'Fecha de empadre',
          'Código Hembras',
          'Cantidad de Hembras',
          'Cantidad preñadas',
          'Tamaño de camada al nacimiento',
          'Nacimientos M',
          'Nacimientos H',
          'Peso antes del empadre',
          'Peso después del empadre',
        ].forEach((t, i) => {
          ws.getCell(row, i + 1).value = t;
          ws.getCell(row, i + 1).font = { bold: true };
        });
        row += 1;
        const list = byMacho[m.id] || [];
        list.forEach((e, idx) => {
          const vals = [
            idx + 1,
            e.fecha_empadre ? String(e.fecha_empadre).slice(0, 10) : '',
            e.hembras_codigos || '',
            e.cantidad_hembras ?? e.cant_hembras,
            e.cantidad_prenadas ?? e.cant_prenadas,
            e.camada,
            e.nac_m,
            e.nac_h,
            e.peso_antes,
            e.peso_despues,
          ];
          vals.forEach((v, i) => {
            ws.getCell(row, i + 1).value = v == null ? '' : v;
          });
          row += 1;
        });
        row += 2;
      }
    });
  })
);

// CUY-24 + NUC-36
router.get(
  '/inventario-mensual',
  asyncHandler(async (req, res) => {
    const year = Number(req.query.anio) || new Date().getFullYear();
    const month = Number(req.query.mes) || new Date().getMonth() + 1;
    const mesNombre = [
      '',
      'ENERO',
      'FEBRERO',
      'MARZO',
      'ABRIL',
      'MAYO',
      'JUNIO',
      'JULIO',
      'AGOSTO',
      'SEPTIEMBRE',
      'OCTUBRE',
      'NOVIEMBRE',
      'DICIEMBRE',
    ][month];

    const pob = await pool.query(
      `SELECT COALESCE(r.nombre,'sin_raza') AS raza,
              COALESCE(c.nombre,'sin_categoria') AS categoria,
              a.sexo, COUNT(*)::int AS n
       FROM animales a
       LEFT JOIN razas r ON r.id = a.id_raza
       LEFT JOIN categorias c ON c.id = a.id_categoria
       WHERE a.id_granja = $1 AND a.estado = 'activo'
       GROUP BY r.nombre, c.nombre, a.sexo`,
      [req.granjaId]
    );
    if (!pob.rows.length) {
      return res.status(400).json({ error: 'No hay datos de inventario para exportar' });
    }

    const nac = await pool.query(
      `SELECT COALESCE(SUM(vivos_m+vivos_h),0)::int AS n FROM partos
       WHERE id_granja=$1 AND EXTRACT(YEAR FROM fecha_parto)=$2 AND EXTRACT(MONTH FROM fecha_parto)=$3`,
      [req.granjaId, year, month]
    );
    const mort = await pool.query(
      `SELECT LOWER(COALESCE(categoria,'')) AS categoria, COALESCE(SUM(cantidad),0)::int AS n
       FROM mortalidad WHERE id_granja=$1
         AND EXTRACT(YEAR FROM fecha)=$2 AND EXTRACT(MONTH FROM fecha)=$3
       GROUP BY LOWER(COALESCE(categoria,''))`,
      [req.granjaId, year, month]
    );
    const vent = await pool.query(
      `SELECT LOWER(COALESCE(categoria,'')) AS categoria, COALESCE(SUM(cantidad),0)::int AS n
       FROM ventas WHERE id_granja=$1
         AND EXTRACT(YEAR FROM fecha)=$2 AND EXTRACT(MONTH FROM fecha)=$3
       GROUP BY LOWER(COALESCE(categoria,''))`,
      [req.granjaId, year, month]
    );

    const mortMap = Object.fromEntries(mort.rows.map((r) => [r.categoria, r.n]));
    const ventMap = Object.fromEntries(vent.rows.map((r) => [r.categoria, r.n]));

    await workbookResponse(res, `inventario-${year}-${month}.xlsx`, async (wb) => {
      const ws = wb.addWorksheet(String(year));
      headerUnidad(ws, 'REGISTRO DE MORTALIDAD Y VENTA MENSUAL');
      ws.getCell('A3').value = `MES ${mesNombre} ${year}`;
      ws.getCell('A3').font = { bold: true };

      ws.getCell('A5').value = 'CLASIFICACION';
      ws.getCell('B5').value = 'HEMBRAS';
      ws.getCell('C5').value = 'MACHOS';
      ws.getCell('D5').value = 'GAZAPOS';
      ws.getCell('E5').value = 'TOTAL';
      ['A', 'B', 'C', 'D', 'E'].forEach((c) => {
        ws.getCell(`${c}5`).font = { bold: true };
      });

      const byRaza = {};
      for (const r of pob.rows) {
        if (!byRaza[r.raza]) byRaza[r.raza] = { H: 0, M: 0, gazapos: 0 };
        const cat = String(r.categoria).toLowerCase();
        if (cat.includes('gazapo')) byRaza[r.raza].gazapos += r.n;
        else if (r.sexo === 'H') byRaza[r.raza].H += r.n;
        else byRaza[r.raza].M += r.n;
      }
      let row = 6;
      for (const [raza, v] of Object.entries(byRaza)) {
        ws.getCell(row, 1).value = raza;
        ws.getCell(row, 2).value = v.H;
        ws.getCell(row, 3).value = v.M;
        ws.getCell(row, 4).value = v.gazapos;
        ws.getCell(row, 5).value = v.H + v.M + v.gazapos;
        row += 1;
      }

      row += 2;
      ws.getCell(row, 1).value = 'Movimiento del mes';
      ws.getCell(row, 1).font = { bold: true };
      row += 1;
      ws.getCell(row, 1).value = 'Nacimientos (cuyes)';
      ws.getCell(row, 2).value = nac.rows[0].n;
      row += 1;
      ws.getCell(row, 1).value = 'Mortalidad Gazapos';
      ws.getCell(row, 2).value = mortMap.gazapo || 0;
      row += 1;
      ws.getCell(row, 1).value = 'Mortalidad Recría';
      ws.getCell(row, 2).value = (mortMap.recria || 0) + (mortMap.reemplazo || 0);
      row += 1;
      ws.getCell(row, 1).value = 'Mortalidad Reproductor';
      ws.getCell(row, 2).value =
        (mortMap.reproductor || 0) + (mortMap.reproductora || 0);
      row += 1;
      ws.getCell(row, 1).value = 'Ventas Recría';
      ws.getCell(row, 2).value = (ventMap.recria || 0) + (ventMap.reemplazo || 0);
      row += 1;
      ws.getCell(row, 1).value = 'Ventas Descarte';
      ws.getCell(row, 2).value = ventMap.descarte || 0;

      row += 2;
      ws.getCell(row, 1).value = 'Población por categoría';
      ws.getCell(row, 1).font = { bold: true };
      row += 1;
      const cats = {};
      for (const r of pob.rows) {
        const k = r.categoria;
        if (!cats[k]) cats[k] = { H: 0, M: 0 };
        cats[k][r.sexo] += r.n;
      }
      ws.getCell(row, 1).value = 'Categoría';
      ws.getCell(row, 2).value = 'Hembras';
      ws.getCell(row, 3).value = 'Machos';
      row += 1;
      for (const [cat, v] of Object.entries(cats)) {
        ws.getCell(row, 1).value = cat;
        ws.getCell(row, 2).value = v.H;
        ws.getCell(row, 3).value = v.M;
        row += 1;
      }
    });
  })
);

module.exports = router;
