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
    const { nombre, id_especie, ubicacion, responsable, fecha_inicio } =
      body || {};
    if (!nombre || !id_especie) {
      return fail('name and species_id are required');
    }
    try {
      const granja = await this.repository.insert({
        nombre: String(nombre),
        id_especie: Number(id_especie),
        ubicacion: (ubicacion as string) || null,
        responsable: (responsable as string) || null,
        fecha_inicio: (fecha_inicio as string) || null,
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
      if (err.code === '23505') {
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
      accion: 'deactivate',
      entidad: 'granja',
      idEntidad: granja.id,
      despues: granja,
      detalle: `Farm deactivated: ${granja.nombre}`,
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
