import { Injectable } from '@nestjs/common';
import { ok, fail, fromError } from '../../shared/kernel/service-result.kernel';
import { AreasRepositoryPort } from '../domain/ports/areas.repository.port';
import { SharedDepsService } from '../../shared/deps/shared-deps.service';

@Injectable()
export class AreasService {
  constructor(
    private readonly repository: AreasRepositoryPort,
    private readonly sharedDeps: SharedDepsService,
  ) {}

  private get audit() {
    return this.sharedDeps.audit;
  }

  async list(farmId: number) {
    return ok(await this.repository.list(farmId));
  }

  async getSummary(farmId: number) {
    return ok(await this.repository.summary(farmId));
  }

  async create({
    farmId,
    userId,
    speciesNombre,
    body,
  }: {
    farmId: number;
    userId: number;
    speciesNombre?: string;
    body: Record<string, unknown>;
  }) {
    const parsed = this.parseBody(body);
    if ('error' in parsed) return parsed.error;
    const { nombre, prop, jaulaIds } = parsed;
    try {
      const existing = await this.repository.findByName(farmId, nombre);
      const takenErr = await this.checkTaken(farmId, existing?.id ?? null, jaulaIds);
      if (takenErr) return takenErr;
      if (existing && existing.activa === false) {
        const area = await this.repository.updateWithCages({
          farmId,
          id: existing.id,
          nombre,
          proposito: prop,
          activa: true,
          jaulaIds,
        });
        await this.audit.write({
          userId,
          farmId,
          accion: 'reactivar',
          entidad: 'area',
          idEntidad: area.id,
          antes: existing,
          despues: area,
          detalle: `Area reactivated: ${area.nombre}`,
        });
        return ok({ ...area, reactivada: true }, 200);
      }
      const area = await this.repository.createWithCages({
        farmId,
        nombre,
        proposito: prop,
        jaulaIds,
      });
      await this.audit.write({
        userId,
        farmId,
        accion: 'crear',
        entidad: 'area',
        idEntidad: area.id,
        despues: area,
        detalle: `Area created: ${area.nombre}`,
      });
      return ok(area, 201);
    } catch (err: any) {
      if (err.code === '23505') {
        return fail('An area with that name already exists in the farm', 409);
      }
      return fromError(err);
    }
  }

  private async checkTaken(farmId: number, areaId: number | null, jaulaIds: number[]) {
    const taken = await this.repository.findTakenCages(farmId, areaId, jaulaIds);
    if (!taken.length) return null;
    const lista = taken.map((j: any) => `${j.codigo} (${j.area})`).join(', ');
    return fail(`Estas jaulas ya tienen área: ${lista}`, 409, { jaulas: taken });
  }

  private parseBody(body: Record<string, unknown>) {
    const { nombre, proposito, jaula_ids = [] } = body || {};
    const nombreStr = String(nombre ?? '').trim();
    if (!nombreStr) {
      return { error: fail('name is required') };
    }
    const prop = String(proposito ?? '').trim();
    if (prop.length > 50) {
      return { error: fail('Purpose is too long (max 50 characters)') };
    }
    const jaulaIds = (Array.isArray(jaula_ids) ? jaula_ids : [])
      .map(Number)
      .filter(Boolean);
    return { nombre: nombreStr, prop, jaulaIds };
  }

  async update({
    farmId,
    userId,
    speciesNombre,
    id,
    body,
  }: {
    farmId: number;
    userId: number;
    speciesNombre?: string;
    id: number;
    body: Record<string, unknown>;
  }) {
    const antes = await this.repository.findById(farmId, id);
    if (!antes || antes.activa === false) return fail('Area not found', 404);
    const parsed = this.parseBody(body);
    if ('error' in parsed) return parsed.error;
    const takenErr = await this.checkTaken(farmId, id, parsed.jaulaIds);
    if (takenErr) return takenErr;
    try {
      const area = await this.repository.updateWithCages({
        farmId,
        id,
        nombre: parsed.nombre,
        proposito: parsed.prop,
        jaulaIds: parsed.jaulaIds,
      });
      await this.audit.write({
        userId,
        farmId,
        accion: 'editar',
        entidad: 'area',
        idEntidad: id,
        antes,
        despues: { ...area, jaula_ids: parsed.jaulaIds },
        detalle: `Area updated: ${area.nombre}`,
      });
      return ok(area);
    } catch (err: any) {
      if (err.code === '23505') {
        return fail('An area with that name already exists in the farm', 409);
      }
      return fromError(err);
    }
  }

  async deactivate({
    farmId,
    userId,
    id,
  }: {
    farmId: number;
    userId: number;
    id: number;
  }) {
    const antes = await this.repository.findById(farmId, id);
    if (!antes || antes.activa === false) return fail('Area not found', 404);

    try {
      const result = await this.repository.deactivate({ farmId, id });
      await this.audit.write({
        userId,
        farmId,
        accion: 'eliminar',
        entidad: 'area',
        idEntidad: result.area.id,
        antes,
        despues: result.area,
        detalle: `Area deactivated: ${antes.nombre}`,
      });
      return ok(result.area);
    } catch (err) {
      return fromError(err);
    }
  }
}
