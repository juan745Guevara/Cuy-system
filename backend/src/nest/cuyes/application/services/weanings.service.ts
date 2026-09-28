import { Injectable } from '@nestjs/common';
import { ok, fail, fromError } from '../../../shared/kernel/service-result.kernel';
import { WeaningsRepositoryPort } from '../../domain/ports/weanings.repository.port';
import { CuyesDepsService } from '../cuyes-deps.service';

import { isValidDateStr, promedioPesos, esFechaFutura } from '../../../shared/utils/helpers';

@Injectable()
export class WeaningsService {
  constructor(
    private readonly repository: WeaningsRepositoryPort,
    private readonly cuyesDeps: CuyesDepsService,
  ) {}

  private get audit() {
    return this.cuyesDeps.toDeps().audit;
  }

  async register({
    farmId,
    userId,
    body,
  }: {
    farmId: number;
    userId: number;
    body: Record<string, unknown>;
  }) {
    const {
      id_parto,
      fecha_destete,
      destetados_m = 0,
      destetados_h = 0,
      muertos = 0,
      peso_m1,
      peso_m2,
      peso_m3,
      peso_h1,
      peso_h2,
      peso_h3,
      id_jaula_m,
      id_jaula_h,
    } = body || {};
    if (!id_parto || !fecha_destete) {
      return fail('id_parto and fecha_destete are required');
    }
    if (!isValidDateStr(fecha_destete)) {
      return fail('Invalid weaning date', 400, { campo: 'fecha_destete' });
    }
    if (esFechaFutura(fecha_destete)) {
      return fail('fecha_destete cannot be in the future', 400, {
        campo: 'fecha_destete',
      });
    }

    const parto = await this.repository.findParto(farmId, Number(id_parto));
    if (!parto) return fail('Birth record not found', 404);
    if (String(fecha_destete) <= String(parto.fecha_parto).slice(0, 10)) {
      return fail('fecha_destete must be after the birth date', 400, {
        campo: 'fecha_destete',
      });
    }

    const dm = Number(destetados_m) || 0;
    const dh = Number(destetados_h) || 0;
    const mu = Number(muertos) || 0;
    const vivosNac = (parto.vivos_m || 0) + (parto.vivos_h || 0);
    if (dm + dh > vivosNac) {
      return fail('weaning litter size cannot exceed live births', 400, {
        campo: 'destetados_m',
      });
    }
    if (dm + dh + mu > vivosNac) {
      return fail('weaned + dead cannot exceed live births');
    }

    try {
      const { destete, gazaposCount } = await this.repository.createDestete({
        farmId,
        userId,
        parto,
        data: {
          id_parto,
          fecha_destete,
          dm,
          dh,
          mu,
          peso_m1,
          peso_m2,
          peso_m3,
          peso_h1,
          peso_h2,
          peso_h3,
          id_jaula_m,
          id_jaula_h,
        },
      });
      await this.audit.write({
        userId,
        farmId,
        accion: 'crear',
        entidad: 'destete',
        idEntidad: destete.id,
        despues: destete,
        detalle: `Weaning #${destete.id}: ${dm}M/${dh}H from birth #${id_parto}`,
      });
      return ok(
        {
          ...destete,
          peso_promedio_destete: promedioPesos(
            peso_m1,
            peso_m2,
            peso_m3,
            peso_h1,
            peso_h2,
            peso_h3,
          ),
          crias_actualizadas: gazaposCount,
        },
        201,
      );
    } catch (err) {
      return fromError(err);
    }
  }

  async list(farmId: number) {
    const rows = await this.repository.listDestetes(farmId);
    return ok(
      (rows as any[]).map((d) => ({
        ...d,
        peso_promedio_destete: promedioPesos(
          d.peso_m1,
          d.peso_m2,
          d.peso_m3,
          d.peso_h1,
          d.peso_h2,
          d.peso_h3,
        ),
      })),
    );
  }
}
