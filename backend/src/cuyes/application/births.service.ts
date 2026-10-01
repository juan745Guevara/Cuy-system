import { Injectable } from '@nestjs/common';
import { ok, fail, fromError } from '../../shared/kernel/service-result.kernel';
import { BirthsRepositoryPort } from '../domain/ports/births.repository.port';
import { CuyesDepsService } from './cuyes-deps.service';

import {
  normalizeCodigo,
  isValidDateStr,
  promedioPesos,
  esFechaFutura,
} from '../../shared/utils/helpers';

@Injectable()
export class BirthsService {
  constructor(
    private readonly repository: BirthsRepositoryPort,
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
      id_hembra,
      id_empadre,
      fecha_parto,
      vivos_m = 0,
      vivos_h = 0,
      muertos = 0,
      peso_m1,
      peso_m2,
      peso_m3,
      peso_h1,
      peso_h2,
      peso_h3,
    } = body || {};
    if (!id_hembra || !fecha_parto) {
      return fail('id_hembra and fecha_parto are required', 400, {
        campo: 'fecha_parto',
      });
    }
    if (!isValidDateStr(fecha_parto)) {
      return fail('Invalid fecha_parto', 400, { campo: 'fecha_parto' });
    }
    if (esFechaFutura(fecha_parto)) {
      return fail('fecha_parto cannot be in the future', 400, {
        campo: 'fecha_parto',
      });
    }
    const vm = Number(vivos_m) || 0;
    const vh = Number(vivos_h) || 0;
    const mu = Number(muertos) || 0;
    if (vm < 0 || vh < 0 || mu < 0) {
      return fail('quantities must be ≥ 0');
    }
    const tamanoCamada = vm + vh + mu;
    if (tamanoCamada <= 0) {
      return fail('specify live or dead counts');
    }
    if (mu > tamanoCamada) {
      return fail('deaths cannot exceed litter size', 400, { campo: 'muertos' });
    }

    const madre = await this.repository.findActiveFemale(
      farmId,
      Number(id_hembra),
    );
    if (!madre) return fail('Invalid female');

    try {
      const { parto, crias } = await this.repository.createBirth({
        farmId,
        userId,
        data: {
          id_hembra,
          id_empadre,
          fecha_parto,
          vm,
          vh,
          mu,
          peso_m1,
          peso_m2,
          peso_m3,
          peso_h1,
          peso_h2,
          peso_h3,
          madre,
          normalizeCodigo,
        },
      });
      await this.audit.write({
        userId,
        farmId,
        accion: 'crear',
        entidad: 'parto',
        idEntidad: parto.id,
        despues: { ...parto, crias },
        detalle: `Birth #${parto.id}: ${vm}M/${vh}H (${(crias as any[]).length} pups)`,
      });
      return ok(
        {
          ...parto,
          peso_promedio_nacimiento: promedioPesos(
            peso_m1,
            peso_m2,
            peso_m3,
            peso_h1,
            peso_h2,
            peso_h3,
          ),
          gazapos: crias,
        },
        201,
      );
    } catch (err) {
      return fromError(err);
    }
  }

  async list(farmId: number) {
    const rows = await this.repository.listBirths(farmId);
    return ok(
      (rows as any[]).map((p) => ({
        ...p,
        peso_promedio_nacimiento: promedioPesos(
          p.peso_m1,
          p.peso_m2,
          p.peso_m3,
          p.peso_h1,
          p.peso_h2,
          p.peso_h3,
        ),
      })),
    );
  }
}
