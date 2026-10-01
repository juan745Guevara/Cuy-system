import { Injectable } from '@nestjs/common';
import { ok, fail, fromError } from '../../shared/kernel/service-result.kernel';
import { FarmsRepositoryPort } from '../domain/ports/farms.repository.port';
import { SharedDepsService } from '../../shared/deps/shared-deps.service';
import { UserFarm } from '../../shared/auth/auth-user.types';

@Injectable()
export class FarmsService {
  constructor(
    private readonly repository: FarmsRepositoryPort,
    private readonly sharedDeps: SharedDepsService,
  ) {}

  private get audit() {
    return this.sharedDeps.audit;
  }

  list(userFarms: UserFarm[]) {
    return ok(userFarms);
  }

  async create({
    userId,
    farmId,
    body,
  }: {
    userId: number;
    farmId?: number;
    body: Record<string, unknown>;
  }) {
    const { nombre, id_especie, ubicacion } = body || {};
    if (!nombre || !id_especie) {
      return fail('name and species_id are required');
    }
    const details = {
      ubicacion: (ubicacion as string) || null,
    };
    try {
      const existing = await this.repository.findByName(String(nombre));
      if (existing && existing.activa === false) {
        if (existing.id_especie !== Number(id_especie)) {
          return fail(
            'Ya existe una granja eliminada con ese nombre de otra especie',
            409,
          );
        }
        const granja = await this.repository.reactivate(existing.id, details);
        await this.audit.write({
          userId,
          farmId,
          accion: 'reactivar',
          entidad: 'granja',
          idEntidad: granja.id,
          antes: existing,
          despues: granja,
          detalle: `Farm reactivated: ${granja.nombre}`,
        });
        return ok({ ...granja, reactivada: true }, 200);
      }

      const granja = await this.repository.insert({
        nombre: String(nombre),
        id_especie: Number(id_especie),
        ...details,
      });
      await this.audit.write({
        userId,
        farmId,
        accion: 'crear',
        entidad: 'granja',
        idEntidad: granja.id,
        despues: granja,
        detalle: `Farm created: ${granja.nombre}`,
      });
      return ok(granja, 201);
    } catch (err: any) {
      if (err.code === '23505' || err.code === 'P2002') {
        return fail('A farm with that name already exists', 409);
      }
      return fromError(err);
    }
  }

  async update({
    userId,
    id,
    body,
  }: {
    userId: number;
    id: number;
    body: Record<string, unknown>;
  }) {
    const nombre = String(body?.nombre ?? '').trim();
    if (!nombre) return fail('name is required');
    const existing = await this.repository.findById(id);
    if (!existing || existing.activa === false) return fail('Farm not found', 404);
    try {
      const granja = await this.repository.update(id, {
        nombre,
        ubicacion: String(body?.ubicacion ?? '').trim() || null,
      });
      await this.audit.write({
        userId,
        farmId: id,
        accion: 'editar',
        entidad: 'granja',
        idEntidad: id,
        antes: existing,
        despues: granja,
        detalle: `Farm updated: ${granja.nombre}`,
      });
      return ok(granja);
    } catch (err: any) {
      if (err.code === '23505' || err.code === 'P2002') {
        return fail('A farm with that name already exists', 409);
      }
      return fromError(err);
    }
  }

  async deactivate({
    userId,
    farmId,
    id,
  }: {
    userId: number;
    farmId?: number;
    id: number;
  }) {
    const granja = await this.repository.deactivate(id);
    if (!granja) return fail('Farm not found', 404);
    await this.audit.write({
      userId,
      farmId,
      accion: 'eliminar',
      entidad: 'granja',
      idEntidad: granja.id,
      despues: granja,
      detalle: `Farm deleted (inactive): ${granja.nombre}`,
    });
    return ok(granja);
  }

  async assignUsers({
    userId,
    userRol,
    userFarms,
    farmId,
    usuario_ids,
  }: {
    userId: number;
    userRol: string;
    userFarms: UserFarm[];
    farmId: number;
    usuario_ids?: number[];
  }) {
    const allowed = userFarms.map((g) => g.id);
    if (userRol !== 'superadmin' && !allowed.includes(farmId)) {
      return fail('Farm is outside your scope', 403);
    }
    const ids = (usuario_ids || []).map(Number);
    await this.repository.assignUsers(farmId, ids);
    await this.audit.write({
      userId,
      farmId,
      accion: 'configurar',
      entidad: 'granja',
      idEntidad: farmId,
      despues: { id_granja: farmId, usuarios: ids },
      detalle: `Farm user configuration: ${farmId}`,
    });
    return ok({ ok: true, id_granja: farmId, usuarios: ids });
  }
}
