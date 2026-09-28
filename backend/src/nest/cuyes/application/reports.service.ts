// @ts-nocheck
import { Injectable } from '@nestjs/common';
import { ok, fail } from '../../shared/kernel/service-result.kernel';
import { ReportsRepositoryPort } from '../domain/ports/reports.repository.port';
import { promedioPesos } from '../../shared/utils/helpers';
import ExcelJS from 'exceljs';

const MONTH_NAMES = [
  '',
  'JANUARY',
  'FEBRUARY',
  'MARCH',
  'APRIL',
  'MAY',
  'JUNE',
  'JULY',
  'AUGUST',
  'SEPTEMBER',
  'OCTOBER',
  'NOVEMBER',
  'DECEMBER',
];

function headerUnidad(ws, titulo) {
  ws.mergeCells('A1:V1');
  ws.getCell('A1').value = 'UNIDAD DE CUYES Y CONEJOS - FACULTAD DE ZOOTECNIA - UNAS';
  ws.getCell('A1').font = { bold: true, size: 12 };
  ws.mergeCells('A2:V2');
  ws.getCell('A2').value = titulo;
  ws.getCell('A2').font = { bold: true, size: 11 };
}

async function buildWorkbookBuffer(build) {
  const wb = new ExcelJS.Workbook();
  await build(wb);
  if (wb.worksheets.length === 0) return null;
  const buffer = await wb.xlsx.writeBuffer();
  return buffer;
}

@Injectable()
export class ReportsService {
  constructor(private readonly repository: ReportsRepositoryPort) {}

private async hojaMensual(wb, farmId, year, month) {
    const mesNombre = MONTH_NAMES[month] || String(month);
    const pob = await this.repository.getActivePopulation(farmId);
    if (!pob.length) return false;

    const nac = await this.repository.getMonthlyBirths(farmId, year, month);
    const mort = await this.repository.getMonthlyMortality(farmId, year, month);
    const vent = await this.repository.getMonthlySales(farmId, year, month);
    const mortMap = Object.fromEntries(mort.map((r) => [r.categoria, r.n]));
    const ventMap = Object.fromEntries(vent.map((r) => [r.categoria, r.n]));

    const ws = wb.addWorksheet(mesNombre);
    headerUnidad(ws, 'MONTHLY MORTALITY AND SALES RECORD');
    ws.getCell('A3').value = `MONTH ${mesNombre} ${year}`;
    ws.getCell('A3').font = { bold: true };

    ws.getCell('A5').value = 'CLASSIFICATION';
    ws.getCell('B5').value = 'FEMALES';
    ws.getCell('C5').value = 'MALES';
    ws.getCell('D5').value = 'GAZAPOS';
    ws.getCell('E5').value = 'TOTAL';
    ['A', 'B', 'C', 'D', 'E'].forEach((c) => {
      ws.getCell(`${c}5`).font = { bold: true };
    });

    const byRaza = {};
    for (const r of pob) {
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
    ws.getCell(row, 1).value = 'Monthly movement';
    ws.getCell(row, 1).font = { bold: true };
    row += 1;
    ws.getCell(row, 1).value = 'Births (cavies)';
    ws.getCell(row, 2).value = nac;
    row += 1;
    ws.getCell(row, 1).value = 'Pup mortality';
    ws.getCell(row, 2).value = mortMap.gazapo || 0;
    row += 1;
    ws.getCell(row, 1).value = 'Rearing mortality';
    ws.getCell(row, 2).value = (mortMap.recria || 0) + (mortMap.reemplazo || 0);
    row += 1;
    ws.getCell(row, 1).value = 'Breeder mortality';
    ws.getCell(row, 2).value = (mortMap.reproductor || 0) + (mortMap.reproductora || 0);
    row += 1;
    ws.getCell(row, 1).value = 'Rearing sales';
    ws.getCell(row, 2).value = (ventMap.recria || 0) + (ventMap.reemplazo || 0);
    row += 1;
    ws.getCell(row, 1).value = 'Culling sales';
    ws.getCell(row, 2).value = ventMap.descarte || 0;

    row += 2;
    ws.getCell(row, 1).value = 'Population by category';
    ws.getCell(row, 1).font = { bold: true };
    row += 1;
    const cats = {};
    for (const r of pob) {
      const k = r.categoria;
      if (!cats[k]) cats[k] = { H: 0, M: 0 };
      cats[k][r.sexo] += r.n;
    }
    ws.getCell(row, 1).value = 'Category';
    ws.getCell(row, 2).value = 'Females';
    ws.getCell(row, 3).value = 'Males';
    row += 1;
    for (const [cat, v] of Object.entries(cats)) {
      ws.getCell(row, 1).value = cat;
      ws.getCell(row, 2).value = v.H;
      ws.getCell(row, 3).value = v.M;
      row += 1;
    }
    return true;
  }


    async exportFemales({ farmId, query }) {
      const idAnimal = query?.id_animal ? Number(query.id_animal) : null;
      const hembras = await this.repository.getFemales(farmId, idAnimal);
      if (!hembras.length) {
        return fail('No female data to export for the period/scope');
      }

      const ids = hembras.map((h) => h.id);
      const ciclos = await this.repository.getFemaleCycles(ids);
      const byHembra = {};
      for (const c of ciclos) {
        if (!byHembra[c.id_hembra]) byHembra[c.id_hembra] = [];
        byHembra[c.id_hembra].push(c);
      }

      const buffer = await buildWorkbookBuffer(async (wb) => {
        const ws = wb.addWorksheet('Female record');
        headerUnidad(ws, 'Individual cavy record');
        let row = 4;
        for (const h of hembras) {
          ws.getCell(row, 1).value = 'Breeder code:';
          ws.getCell(row, 3).value = h.codigo;
          ws.getCell(row, 5).value = h.jaula ? `Cage: ${h.jaula}` : '';
          ws.getCell(row, 7).value = 'Breed';
          ws.getCell(row, 9).value = h.raza || '';
          ws.getCell(row, 15).value = 'Birth date:';
          ws.getCell(row, 17).value = h.fecha_nacimiento
            ? String(h.fecha_nacimiento).slice(0, 10)
            : '';
          row += 1;
          ws.getCell(row, 1).value = 'Notes:';
          ws.getCell(row, 3).value = h.particularidades || '';
          row += 1;
          const headers = [
            'Birth',
            'Breeding male code',
            'Breeding date',
            'Birth date',
            'Litter size at birth',
            'Stillborn',
            'Weight M1',
            'Weight M2',
            'Weight M3',
            'Weight H1',
            'Weight H2',
            'Weight H3',
            'Avg birth weight',
            'Weaning date',
            'Litter size at weaning',
            'Deaths at weaning',
            'Wean weight M1',
            'Wean weight M2',
            'Wean weight M3',
            'Wean weight H1',
            'Wean weight H2',
            'Wean weight H3',
            'Avg weaning weight',
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

      return ok({
        buffer,
        filename: 'registro-hembras.xlsx',
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
    }
    async exportMales(farmId) {
      const machos = await this.repository.getMales(farmId);
      if (!machos.length) return fail('No male data to export');

      const ids = machos.map((m) => m.id);
      const ev = await this.repository.getMaleBreedings(ids);
      const byMacho = {};
      for (const e of ev) {
        if (!byMacho[e.id_macho]) byMacho[e.id_macho] = [];
        byMacho[e.id_macho].push(e);
      }

      const buffer = await buildWorkbookBuffer(async (wb) => {
        const ws = wb.addWorksheet('Male record');
        headerUnidad(ws, 'Individual breeder record');
        let row = 4;
        for (const m of machos) {
          ws.getCell(row, 1).value = 'Breeder code:';
          ws.getCell(row, 3).value = m.codigo;
          ws.getCell(row, 5).value = 'Breed';
          ws.getCell(row, 6).value = m.raza || '';
          ws.getCell(row, 8).value = 'Birth date:';
          ws.getCell(row, 10).value = m.fecha_nacimiento
            ? String(m.fecha_nacimiento).slice(0, 10)
            : '';
          row += 1;
          ws.getCell(row, 1).value = 'Notes:';
          ws.getCell(row, 3).value = m.particularidades || '';
          row += 1;
          [
            'Breeding',
            'Breeding date',
            'Female codes',
            'Female count',
            'Pregnant count',
            'Litter size at birth',
            'Births M',
            'Births H',
            'Weight before breeding',
            'Weight after breeding',
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

      return ok({
        buffer,
        filename: 'registro-machos.xlsx',
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
    }
    async exportMonthlyInventory({ farmId, query }) {
      const year = Number(query?.anio) || new Date().getFullYear();
      const mes =
        query?.mes != null && query?.mes !== '' ? Number(query.mes) : null;

      let filename;
      let buffer;
      if (mes == null || Number.isNaN(mes)) {
        buffer = await buildWorkbookBuffer(async (wb) => {
          for (let m = 1; m <= 12; m++) await this.hojaMensual(wb, farmId, year, m);
        });
        filename = `inventario-anual-${year}.xlsx`;
      } else {
        buffer = await buildWorkbookBuffer(async (wb) => {
          await this.hojaMensual(wb, farmId, year, mes);
        });
        filename = `inventario-${year}-${mes}.xlsx`;
      }

      if (!buffer) return fail('No inventory data to export');

      return ok({
        buffer,
        filename,
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
    }
    async exportAnimals({ farmId, query }) {
      const year = Number(query?.anio) || new Date().getFullYear();
      const month = Number(query?.mes) || new Date().getMonth() + 1;
      const estado = query?.estado && query.estado !== 'todos' ? query.estado : null;
      const rows = await this.repository.listAnimalsForExport(farmId, {
        estado,
        idArea: query?.id_area ? Number(query.id_area) : null,
        idRaza: query?.id_raza ? Number(query.id_raza) : null,
        idCategoria: query?.id_categoria ? Number(query.id_categoria) : null,
      });
      if (!rows.length) {
        return fail('No animals to export in the selected scope');
      }

      const buffer = await buildWorkbookBuffer(async (wb) => {
        const ws = wb.addWorksheet('Animales');
        headerUnidad(ws, `Animal list — ${month}/${year}`);
        ws.addRow([]);
        ws.addRow(['Code', 'Sex', 'Breed', 'Category', 'Area', 'Cage', 'Birth', 'Status']);
        for (const r of rows) {
          ws.addRow([
            r.codigo,
            r.sexo,
            r.raza,
            r.categoria,
            r.area,
            r.jaula,
            r.fecha_nacimiento,
            r.estado,
          ]);
        }
      });

      return ok({
        buffer,
        filename: `animales-${year}-${month}.xlsx`,
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
    }
    async exportConsolidated({ user, query }) {
      const year = Number(query?.anio) || new Date().getFullYear();
      const mes =
        query?.mes != null && query?.mes !== '' ? Number(query.mes) : null;
      const isSuper = user?.rol === 'superadmin';
      const granjas = await this.repository.getUserFarms(isSuper, user.id);
      if (!granjas.length) return fail('No farms to consolidate');

      const filas = [];
      let totH = 0,
        totM = 0,
        totG = 0,
        totNac = 0,
        totMort = 0,
        totVent = 0;
      const mesFilter = mes && !Number.isNaN(mes) ? ` AND EXTRACT(MONTH FROM {{col}})=$3` : '';

      for (const g of granjas) {
        const pob = await this.repository.getFarmPopulation(g.id);
        let H = 0,
          M = 0,
          G = 0;
        for (const r of pob) {
          const cat = String(r.categoria).toLowerCase();
          if (cat.includes('gazapo')) G += r.n;
          else if (r.sexo === 'H') H += r.n;
          else M += r.n;
        }
        const metricas = await this.repository.getFarmMetrics(
          g.id,
          year,
          mes,
          mesFilter
        );
        filas.push({
          granja: g.nombre,
          H,
          M,
          G,
          total: H + M + G,
          nacimientos: metricas.nacimientos,
          mortalidad: metricas.mortalidad,
          ventas: metricas.ventas,
        });
        totH += H;
        totM += M;
        totG += G;
        totNac += metricas.nacimientos;
        totMort += metricas.mortalidad;
        totVent += metricas.ventas;
      }

      const buffer = await buildWorkbookBuffer(async (wb) => {
        const ws = wb.addWorksheet('Consolidated');
        headerUnidad(ws, 'CONSOLIDATED FARM REPORT');
        ws.getCell('A3').value = `PERIOD ${mes && !Number.isNaN(mes) ? MONTH_NAMES[mes] + ' ' : 'YEAR '}${year}`;
        ws.getCell('A3').font = { bold: true };

        const headers = [
          'FARM',
          'FEMALES',
          'MALES',
          'PUPS',
          'TOTAL POPULATION',
          'BIRTHS',
          'MORTALITY',
          'SALES',
        ];
        let row = 5;
        headers.forEach((t, i) => {
          ws.getCell(row, i + 1).value = t;
          ws.getCell(row, i + 1).font = { bold: true };
        });
        row += 1;
        for (const f of filas) {
          [f.granja, f.H, f.M, f.G, f.total, f.nacimientos, f.mortalidad, f.ventas].forEach(
            (v, i) => {
              ws.getCell(row, i + 1).value = v;
            }
          );
          row += 1;
        }
        [
          'TOTAL',
          totH,
          totM,
          totG,
          filas.reduce((s, f) => s + f.total, 0),
          totNac,
          totMort,
          totVent,
        ].forEach((v, i) => {
          ws.getCell(row, i + 1).value = v;
          ws.getCell(row, i + 1).font = { bold: true };
        });
        ws.getColumn(1).width = 30;
        for (let c = 2; c <= 8; c++) ws.getColumn(c).width = 16;
      });

      if (!buffer) return fail('No data to consolidate');

      return ok({
        buffer,
        filename: `consolidado-${year}.xlsx`,
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
  }
}
