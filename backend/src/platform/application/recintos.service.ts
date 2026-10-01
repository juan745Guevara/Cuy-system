import { Injectable } from '@nestjs/common';
import { ok, fail, fromError } from '../../shared/kernel/service-result.kernel';
import { RecintosRepositoryPort } from '../domain/ports/recintos.repository.port';
import { SharedDepsService } from '../../shared/deps/shared-deps.service';
import { normalizeCodigo } from '../../shared/utils/helpers';

/** Núcleo: alta, edición y ocupación de recintos (jaula/corral/poza según la especie). */
@Injectable()
export class RecintosService {
  constructor(
    private readonly repository: RecintosRepositoryPort,
    private readonly sharedDeps: SharedDepsService,
  ) {}

  private get audit() {
    return this.sharedDeps.audit;
  }

  async list({ farmId, query }: { farmId: number; query?: Record<string, unknown> }) {
    const idArea = query?.id_area ? Number(query.id_area) : null;
    return ok(await this.repository.list(farmId, idArea));
  }

  async getOccupancy(farmId: number) {
    const rows = await this.repository.occupancyRows(farmId);
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
    if (!codigo) {
      return fail('codigo is required');
    }
    if (id_area) {
      const area = await this.repository.findAreaInFarm(farmId, Number(id_area));
      if (!area) return fail('Area does not belong to the active farm');
    }

    const codigoNorm = normalizeCodigo(codigo);
    const dup = await this.repository.findDuplicateCode(farmId, codigoNorm);
    if (dup) {
      return fail('A cage with that name already exists in the farm', 409);
    }

    try {
      const recinto = await this.repository.insert({
        farmId,
        idArea: id_area ? Number(id_area) : null,
        codigo: String(codigo).trim(),
        capacidadMaxima: capacidad_maxima,
      });
      await this.audit.write({
        userId,
        farmId,
        accion: 'crear',
        entidad: 'recinto',
        idEntidad: recinto.id,
        despues: recinto,
        detalle: `Cage created: ${recinto.codigo}`,
      });
      return ok(recinto, 201);
    } catch (err: any) {
      if (err.code === '23505') {
        return fail('A cage with that code already exists in the farm', 409);
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
    const cur = await this.repository.findInFarm(farmId, id);
    if (!cur) return fail('Cage not found', 404);

    if (id_area) {
      const area = await this.repository.findAreaInFarm(farmId, Number(id_area));
      if (!area) return fail('Invalid area');
    }
    if (codigo) {
      const codigoNorm = normalizeCodigo(codigo);
      const dup = await this.repository.findDuplicateCode(farmId, codigoNorm, id);
      if (dup) return fail('Duplicate cage name in the farm', 409);
    }

    const updated = await this.repository.update({
      id,
      codigo: codigo ? String(codigo).trim() : null,
      capacidadMaxima: capacidad_maxima ?? null,
      idArea: id_area === undefined ? undefined : id_area ? Number(id_area) : null,
    });
    await this.audit.write({
      userId,
      farmId,
      accion: 'editar',
      entidad: 'recinto',
      idEntidad: id,
      antes: cur,
      despues: updated,
      detalle: `Cage updated: ${updated.codigo}`,
    });
    return ok(updated);
  }

  async deactivate({ farmId, userId, id }: { farmId: number; userId: number; id: number }) {
    const animales = await this.repository.listAnimals(farmId, id);
    if (animales.length) {
      return fail(`La jaula tiene ${animales.length} animal(es). Muévalos antes de eliminarla.`, 409);
    }
    const recinto = await this.repository.deactivate(farmId, id);
    if (!recinto) return fail('Cage not found', 404);
    await this.audit.write({
      userId,
      farmId,
      accion: 'eliminar',
      entidad: 'recinto',
      idEntidad: recinto.id,
      despues: recinto,
      detalle: `Cage deactivated: ${recinto.codigo}`,
    });
    return ok(recinto);
  }

  async getAnimals({ farmId, jaulaId }: { farmId: number; jaulaId: number }) {
    return ok(await this.repository.listAnimals(farmId, jaulaId));
  }
}
