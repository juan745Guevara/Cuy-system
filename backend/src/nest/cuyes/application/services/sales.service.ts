import { Injectable } from '@nestjs/common';
import { ok, fail, fromError } from '../../../shared/kernel/service-result.kernel';
import { SalesRepositoryPort } from '../../domain/ports/sales.repository.port';
import { CuyesDepsService } from '../cuyes-deps.service';

import { isValidDateStr, esFechaFutura } from '../../../shared/utils/helpers';

@Injectable()
export class SalesService {
  constructor(
    private readonly repository: SalesRepositoryPort,
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
    const { id_animal, fecha, clasificacion, categoria, cantidad, comprador, precio } =
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
          `quantity (${cant}) exceeds available population (${disponible})`,
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
          comprador,
          precio,
        },
      });
      await this.audit.write({
        userId,
        farmId,
        accion: 'crear',
        entidad: 'venta',
        idEntidad: row.id,
        despues: row,
        detalle: `Sale of ${cant} ${categoria || (id_animal ? `animal ${id_animal}` : 'animals')}`,
      });
      return ok(row, 201);
    } catch (err) {
      return fromError(err);
    }
  }

  async listDiscards(farmId: number) {
    return ok(await this.repository.listDiscards(farmId));
  }

  async sellDiscards({
    farmId,
    userId,
    body,
  }: {
    farmId: number;
    userId: number;
    body: Record<string, unknown>;
  }) {
    const { fecha, comprador, precio, id_animales } = body || {};
    if (!fecha) return fail('date is required', 400, { campo: 'fecha' });
    if (!Array.isArray(id_animales) || !id_animales.length) {
      return fail('id_animales[] is required', 400, { campo: 'id_animales' });
    }
    if (!isValidDateStr(fecha)) return fail('Invalid date', 400, { campo: 'fecha' });
    if (esFechaFutura(fecha)) {
      return fail('date cannot be in the future', 400, { campo: 'fecha' });
    }
    const ids = [...new Set((id_animales as number[]).map(Number).filter((n) => Number.isFinite(n)))];

    try {
      const result = await this.repository.sellDiscards({
        farmId,
        userId,
        fecha: String(fecha),
        comprador: comprador ? String(comprador) : undefined,
        precio: precio != null ? Number(precio) : undefined,
        ids,
      });
      if (result.error) {
        return fail(result.error, 400, { animales: result.animales });
      }
      const ventas = result.ventas as any[];
      await this.audit.write({
        userId,
        farmId,
        accion: 'crear',
        entidad: 'venta',
        idEntidad: ventas[0]?.id,
        despues: ventas,
        detalle: `Bulk sale of ${ventas.length} discards`,
      });
      return ok({ registradas: ventas.length, ventas }, 201);
    } catch (err) {
      return fromError(err);
    }
  }

  async list(farmId: number) {
    return ok(await this.repository.list(farmId));
  }
}
