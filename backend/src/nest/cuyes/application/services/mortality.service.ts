import { Injectable } from '@nestjs/common';
import { ok, fail, fromError } from '../../../shared/kernel/service-result.kernel';
import { MortalityRepositoryPort } from '../../domain/ports/mortality.repository.port';
import { CuyesDepsService } from '../cuyes-deps.service';

import { isValidDateStr, esFechaFutura } from '../../../shared/utils/helpers';

@Injectable()
export class MortalityService {
  constructor(
    private readonly repository: MortalityRepositoryPort,
    private readonly cuyesDeps: CuyesDepsService,
  ) {}

  private get audit() {
    return this.cuyesDeps.toDeps().audit;
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
    const { id_animal, fecha, clasificacion, categoria, cantidad, causa, id_jaula } =
      body || {};
    if (!fecha || !cantidad) return fail('date and quantity are required');
    if (!isValidDateStr(fecha)) return fail('Invalid date', 400, { campo: 'fecha' });
    if (esFechaFutura(fecha)) {
      return fail('date cannot be in the future', 400, { campo: 'fecha' });
    }
    const cant = Number(cantidad);
    if (!Number.isFinite(cant) || cant <= 0) {
      return fail('quantity must be greater than zero', 400, { campo: 'cantidad' });
    }

    if (!id_animal) {
      const disponible = await this.repository.countPoblacion(
        farmId,
        categoria ? String(categoria) : undefined,
      );
      if (cant > disponible) {
        return fail(
          `quantity (${cant}) exceeds available category population (${disponible})`,
          400,
          { campo: 'cantidad', disponible },
        );
      }
    }

    try {
      const row = await this.repository.create({
        farmId,
        userId,
        data: {
          id_animal,
          fecha,
          clasificacion,
          categoria,
          cantidad: cant,
          causa,
          id_jaula,
        },
      });
      await this.audit.write({
        userId,
        farmId,
        accion: 'crear',
        entidad: 'mortalidad',
        idEntidad: row.id,
        despues: row,
        detalle: `Mortality of ${cant} ${categoria || (id_animal ? `animal ${id_animal}` : 'animals')}`,
      });
      return ok(row, 201);
    } catch (err) {
      return fromError(err);
    }
  }

  async list(farmId: number) {
    return ok(await this.repository.list(farmId));
  }
}
