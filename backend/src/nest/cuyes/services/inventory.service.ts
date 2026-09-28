import { Injectable } from '@nestjs/common';
import { ok } from '../../shared/kernel/service-result.kernel';
import { InventoryRepository } from '../repositories/inventory.repository';
import { UserFarm } from '../../shared/auth/auth-user.types';

function endOfMonth(year: number, month: number) {
  return new Date(year, month, 0).toISOString().slice(0, 10);
}

function startOfMonth(year: number, month: number) {
  return `${year}-${String(month).padStart(2, '0')}-01`;
}

@Injectable()
export class InventoryService {
  constructor(private readonly repository: InventoryRepository) {}

  async getPopulation({
    farmId,
    query,
  }: {
    farmId: number;
    query: Record<string, string>;
  }) {
    const fecha = query?.fecha || new Date().toISOString().slice(0, 10);
    const rows = (await this.repository.poblacionAt(farmId, fecha)) as any[];

    const matriz: Record<string, Record<string, { H: number; M: number; total: number }>> = {};
    for (const r of rows) {
      if (!matriz[r.raza]) matriz[r.raza] = {};
      const key = r.categoria;
      if (!matriz[r.raza][key]) matriz[r.raza][key] = { H: 0, M: 0, total: 0 };
      matriz[r.raza][key][r.sexo as 'H' | 'M'] = r.cantidad;
      matriz[r.raza][key].total += r.cantidad;
    }

    const detalle = await this.repository.detalleActivos(farmId);
    const total = rows.reduce((s, r) => s + r.cantidad, 0);

    return ok({
      fecha,
      total,
      por_categoria: rows,
      por_raza: Object.entries(matriz).map(([raza, cats]) => ({
        raza,
        categorias: cats,
        total: Object.values(cats).reduce((s, c) => s + c.total, 0),
      })),
      matriz,
      detalle,
    });
  }

  async getMonthlySummary({
    farmId,
    query,
  }: {
    farmId: number;
    query: Record<string, string>;
  }) {
    const year = Number(query?.anio) || new Date().getFullYear();
    const month = Number(query?.mes) || new Date().getMonth() + 1;
    const ini = startOfMonth(year, month);
    const fin = endOfMonth(year, month);
    const prevFin =
      month === 1 ? endOfMonth(year - 1, 12) : endOfMonth(year, month - 1);

    const pobIniRows = (await this.repository.poblacionAt(farmId, prevFin)) as any[];
    const pobFinRows = (await this.repository.poblacionAt(farmId, fin)) as any[];
    const sum = (rws: any[]) => rws.reduce((s, r) => s + r.cantidad, 0);

    const nac = await this.repository.nacimientosPeriodo(farmId, ini, fin);
    const mort = (await this.repository.mortalidadPeriodo(farmId, ini, fin)) as any[];
    const vent = (await this.repository.ventasPeriodo(farmId, ini, fin)) as any[];
    const mortTotal = mort.reduce((s, r) => s + Number(r.mortalidad), 0);
    const ventTotal = vent.reduce((s, r) => s + Number(r.ventas), 0);

    let transfers_in = 0;
    let transfers_out = 0;
    try {
      const tr = await this.repository.transfersPeriodo(farmId, ini, fin);
      transfers_in = tr?.tin || 0;
      transfers_out = tr?.tout || 0;
    } catch {
      /* movimientos table may be missing in old envs */
    }

    const desglose: Record<string, { categoria: string; H: number; M: number; total: number }> = {};
    for (const r of pobFinRows) {
      const k = r.categoria;
      if (!desglose[k]) desglose[k] = { categoria: k, H: 0, M: 0, total: 0 };
      desglose[k][r.sexo as 'H' | 'M'] += r.cantidad;
      desglose[k].total += r.cantidad;
    }

    const poblacion_inicial = sum(pobIniRows);
    const poblacion_final = sum(pobFinRows);
    const continuidadEsperada =
      poblacion_inicial +
      Number(nac.nacimientos) -
      mortTotal -
      ventTotal +
      (transfers_in - transfers_out);
    const continuidad_ok =
      continuidadEsperada === poblacion_final && Number(poblacion_inicial) >= 0;

    return ok({
      anio: year,
      mes: month,
      poblacion_inicial,
      nacimientos: nac.nacimientos,
      nacimientos_m: nac.nac_m,
      nacimientos_h: nac.nac_h,
      mortalidad: mortTotal,
      mortalidad_por_categoria: mort,
      ventas: ventTotal,
      ventas_por_categoria: vent,
      transfers_in,
      transfers_out,
      poblacion_final,
      poblacion_actual: poblacion_final,
      desglose_categorias: Object.values(desglose),
      continuidad_ok,
      continuidad_esperada: continuidadEsperada,
      continuidad_detalle: {
        poblacion_inicial,
        nacimientos: Number(nac.nacimientos),
        mortalidad: mortTotal,
        ventas: ventTotal,
        transfers_in,
        transfers_out,
      },
    });
  }

  async getByArea(farmId: number) {
    const rows = (await this.repository.porArea(farmId)) as any[];
    const byArea: Record<number, any> = {};
    for (const r of rows) {
      if (!byArea[r.id_area]) {
        byArea[r.id_area] = {
          id: r.id_area,
          nombre: r.area,
          proposito: r.proposito,
          total: 0,
          jaulas: [],
        };
      }
      if (r.id_jaula) {
        byArea[r.id_area].jaulas.push({
          id: r.id_jaula,
          codigo: r.jaula,
          capacidad_maxima: r.capacidad_maxima,
          ocupacion: r.ocupacion,
          vacia: r.ocupacion === 0,
          hembras: r.hembras,
          machos: r.machos,
        });
        byArea[r.id_area].total += r.ocupacion;
      }
    }
    return ok(Object.values(byArea));
  }

  async getByCategoryArea(farmId: number) {
    return ok(await this.repository.porCategoriaArea(farmId));
  }

  async getConsolidated({
    userFarms,
    query,
  }: {
    userFarms: UserFarm[];
    query: Record<string, string>;
  }) {
    const year = Number(query?.anio) || new Date().getFullYear();
    const month = Number(query?.mes) || new Date().getMonth() + 1;
    const farmIds = (userFarms || []).map((g) => g.id);
    if (!farmIds.length) {
      return ok({ granjas: [], por_especie: [], total: null });
    }

    const rows = (await this.repository.consolidadoGranjas(
      farmIds,
      year,
      month,
    )) as any[];
    const porEspecie: Record<string, any> = {};
    for (const r of rows) {
      if (!porEspecie[r.especie]) {
        porEspecie[r.especie] = {
          especie: r.especie,
          poblacion: 0,
          nacimientos: 0,
          mortalidad: 0,
          ventas: 0,
        };
      }
      porEspecie[r.especie].poblacion += r.poblacion;
      porEspecie[r.especie].nacimientos += r.nacimientos;
      porEspecie[r.especie].mortalidad += r.mortalidad;
      porEspecie[r.especie].ventas += r.ventas;
    }

    return ok({
      anio: year,
      mes: month,
      granjas: rows,
      por_especie: Object.values(porEspecie),
      total: {
        poblacion: rows.reduce((s, r) => s + r.poblacion, 0),
        nacimientos: rows.reduce((s, r) => s + r.nacimientos, 0),
        mortalidad: rows.reduce((s, r) => s + r.mortalidad, 0),
        ventas: rows.reduce((s, r) => s + r.ventas, 0),
      },
    });
  }
}
