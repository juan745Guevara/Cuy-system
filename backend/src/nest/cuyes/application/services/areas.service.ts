import { Injectable } from '@nestjs/common';
import { ok, fail, fromError } from '../../../shared/kernel/service-result.kernel';
import { AreasRepositoryPort } from '../../domain/ports/areas.repository.port';
import { CuyesDepsService } from '../cuyes-deps.service';

@Injectable()
export class AreasService {
  constructor(
    private readonly repository: AreasRepositoryPort,
    private readonly cuyesDeps: CuyesDepsService,
  ) {}

  private areaRules() {
    return this.cuyesDeps.toDeps().areaRules;
  }

  private get audit() {
    return this.cuyesDeps.toDeps().audit;
  }

  async list(farmId: number) {
    return ok(await this.repository.list(farmId));
  }

  async getSummary(farmId: number) {
    return ok(await this.repository.resumen(farmId));
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
    const { nombre, proposito, jaula_ids = [] } = body || {};
    if (!nombre || !proposito) {
      return fail('name and purpose are required');
    }
    const rules = this.areaRules();
    const PURPOSES = rules.getPurposes();
    const prop = rules.normalizePurpose(proposito);
    if (!prop || !(PURPOSES as readonly string[]).includes(prop)) {
      return fail('Invalid purpose', 400, { propositos: PURPOSES });
    }
    const jaulaIds = (Array.isArray(jaula_ids) ? jaula_ids : [])
      .map(Number)
      .filter(Boolean);
    try {
      const area = await this.repository.createWithJaulas({
        farmId,
        nombre: String(nombre),
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

  async deactivate({
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
    const { id_area_destino } = body || {};
    const antes = await this.repository.findById(farmId, id);
    if (!antes) return fail('Area not found', 404);

    const jaulas = await this.repository.countActiveJaulas(id);
    if (jaulas.length && !id_area_destino) {
      return fail('Move cages to another area before deactivating', 400, {
        jaulas: jaulas.length,
      });
    }

    try {
      const result = await this.repository.deactivate({
        farmId,
        id,
        idAreaDestino: id_area_destino
          ? Number(id_area_destino)
          : undefined,
      });
      if (result.error) return fail(result.error);
      await this.audit.write({
        userId,
        farmId,
        accion: 'deactivate',
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
