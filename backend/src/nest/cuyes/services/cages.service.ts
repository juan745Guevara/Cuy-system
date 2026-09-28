import { Injectable } from '@nestjs/common';
import { ok, fail, fromError } from '../../shared/kernel/service-result.kernel';
import { CagesRepository } from '../repositories/cages.repository';
import { CuyesDepsService } from '../cuyes-deps.service';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { normalizeCodigo } = require('../../../shared/utils/helpers');

@Injectable()
export class CagesService {
  constructor(
    private readonly repository: CagesRepository,
    private readonly cuyesDeps: CuyesDepsService,
  ) {}

  private get audit() {
    return this.cuyesDeps.toDeps().audit;
  }

  async list({ farmId, query }: { farmId: number; query?: Record<string, unknown> }) {
    const idArea = query?.id_area ? Number(query.id_area) : null;
    return ok(await this.repository.list(farmId, idArea));
  }

  async getOccupancy(farmId: number) {
    const rows = await this.repository.ocupacionRows(farmId);
    const areasMap: Record<
      number,
      {
        id: number;
        nombre: string;
        proposito: string;
        ocupacion: number;
        capacidad: number;
        jaulas: Array<Record<string, unknown>>;
      }
    > = {};
    let ocupacionGranja = 0;
    let capacidadGranja = 0;
    const sobrecupo: Array<Record<string, unknown>> = [];

    for (const r of rows) {
      if (!areasMap[r.id_area]) {
        areasMap[r.id_area] = {
          id: r.id_area,
          nombre: r.area,
          proposito: r.proposito,
          ocupacion: 0,
          capacidad: 0,
          jaulas: [],
        };
      }
      if (!r.id_jaula) continue;
      const item = {
        id: r.id_jaula,
        codigo: r.jaula,
        capacidad_maxima: r.capacidad_maxima,
        ocupacion: r.ocupacion,
        excedida: r.capacidad_maxima != null && r.ocupacion > r.capacidad_maxima,
      };
      areasMap[r.id_area].jaulas.push(item);
      areasMap[r.id_area].ocupacion += r.ocupacion;
      if (r.capacidad_maxima != null) {
        areasMap[r.id_area].capacidad += r.capacidad_maxima;
        capacidadGranja += r.capacidad_maxima;
      }
      ocupacionGranja += r.ocupacion;
      if (item.excedida) {
        sobrecupo.push({ ...item, area: r.area, id_area: r.id_area });
      }
    }

    return ok({
      granja: { ocupacion: ocupacionGranja, capacidad: capacidadGranja || null },
      areas: Object.values(areasMap),
      sobrecupo,
    });
  }

  async create({
    farmId,
    userId,
    body,
  }: {
    farmId: number;
    userId: number;
    body: Record<string, unknown>;
  }) {
    const { id_area, codigo, capacidad_maxima } = body || {};
    if (!id_area || !codigo) {
      return fail('id_area and codigo are required');
    }
    const area = await this.repository.findAreaInGranja(farmId, Number(id_area));
    if (!area) return fail('Area does not belong to the active farm');

    const codigoNorm = normalizeCodigo(codigo);
    const dup = await this.repository.findDuplicateCodigo(farmId, codigoNorm);
    if (dup) {
      return fail('A cage with that name already exists in the farm', 409);
    }

    try {
      const jaula = await this.repository.insert({
        idArea: Number(id_area),
        codigo: String(codigo).trim(),
        capacidadMaxima: capacidad_maxima,
      });
      await this.audit.write({
        userId,
        farmId,
        accion: 'crear',
        entidad: 'jaula',
        idEntidad: jaula.id,
        despues: jaula,
        detalle: `Cage created: ${jaula.codigo}`,
      });
      return ok(jaula, 201);
    } catch (err: any) {
      if (err.code === '23505') {
        return fail('A cage with that code already exists in the area', 409);
      }
      return fromError(err);
    }
  }

  async update({
    farmId,
    userId,
    id,
    body,
  }: {
    farmId: number;
    userId: number;
    id: number;
    body: Record<string, unknown>;
  }) {
    const { codigo, capacidad_maxima, id_area } = body || {};
    const cur = await this.repository.findInGranja(farmId, id);
    if (!cur) return fail('Cage not found', 404);

    if (id_area) {
      const area = await this.repository.findAreaInGranja(farmId, Number(id_area));
      if (!area) return fail('Invalid area');
    }
    if (codigo) {
      const codigoNorm = normalizeCodigo(codigo);
      const dup = await this.repository.findDuplicateCodigo(farmId, codigoNorm, id);
      if (dup) return fail('Duplicate cage name in the farm', 409);
    }

    const updated = await this.repository.update({
      id,
      codigo: codigo ? String(codigo).trim() : null,
      capacidadMaxima: capacidad_maxima ?? null,
      idArea: id_area ? Number(id_area) : null,
    });
    await this.audit.write({
      userId,
      farmId,
      accion: 'editar',
      entidad: 'jaula',
      idEntidad: id,
      antes: cur,
      despues: updated,
      detalle: `Cage updated: ${updated.codigo}`,
    });
    return ok(updated);
  }

  async deactivate({ farmId, userId, id }: { farmId: number; userId: number; id: number }) {
    const jaula = await this.repository.deactivate(farmId, id);
    if (!jaula) return fail('Cage not found', 404);
    await this.audit.write({
      userId,
      farmId,
      accion: 'deactivate',
      entidad: 'jaula',
      idEntidad: jaula.id,
      despues: jaula,
      detalle: `Cage deactivated: ${jaula.codigo}`,
    });
    return ok(jaula);
  }

  async getAnimals({ farmId, jaulaId }: { farmId: number; jaulaId: number }) {
    return ok(await this.repository.listAnimales(farmId, jaulaId));
  }
}
