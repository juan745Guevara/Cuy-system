import { Injectable } from '@nestjs/common';
import { ok, fail, fromError } from '../../shared/kernel/service-result.kernel';
import { SalesRepositoryPort } from '../domain/ports/sales.repository.port';
import { CuyesDepsService } from './cuyes-deps.service';

import { isValidDateStr, esFechaFutura } from '../../shared/utils/helpers';

type Comprobante = { tipo: string; serie: string; numero: string };

/**
 * CU-03: toda venta se respalda con el comprobante emitido por la caja UNAS.
 * Devuelve el comprobante normalizado o el campo que falta.
 */
function leerComprobante(body: Record<string, unknown>): { comprobante?: Comprobante; campo?: string } {
  const limpio = (v: unknown) => (v == null ? '' : String(v).trim());
  const tipo = limpio(body?.tipo_comprobante);
  const serie = limpio(body?.serie).toUpperCase();
  const numero = limpio(body?.numero);
  if (!tipo) return { campo: 'tipo_comprobante' };
  if (!serie) return { campo: 'serie' };
  if (!numero) return { campo: 'numero' };
  return { comprobante: { tipo, serie, numero } };
}

const comprobanteDuplicado = (c: Comprobante, previa: { id: number; fecha: unknown; granja: string }) =>
  fail(`receipt ${c.serie}-${c.numero} was already used in sale #${previa.id}`, 409, {
    campo: 'numero',
    venta_previa: previa,
  });

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
    const {
      id_animal,
      fecha,
      clasificacion,
      categoria,
      cantidad,
      comprador,
      precio,
      observaciones,
    } = body || {};
    if (!fecha || !cantidad) return fail('date and quantity are required');
    if (!isValidDateStr(fecha)) return fail('Invalid date', 400, { campo: 'fecha' });
    if (esFechaFutura(fecha)) {
      return fail('date cannot be in the future', 400, { campo: 'fecha' });
    }
    const cant = Number(cantidad);
    if (!Number.isFinite(cant) || cant <= 0) {
      return fail('quantity must be greater than zero', 400, { campo: 'cantidad' });
    }
    const { comprobante, campo } = leerComprobante(body);
    if (!comprobante) {
      return fail(`${campo} is required (receipt issued by the UNAS cashier)`, 400, { campo });
    }

    if (!id_animal) {
      const disponible = await this.repository.countPopulation(
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
      const result = await this.repository.create({
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
          tipo_comprobante: comprobante.tipo,
          serie: comprobante.serie,
          numero: comprobante.numero,
          observaciones,
        },
      });
      if (result.error === 'COMPROBANTE_DUPLICADO') {
        return comprobanteDuplicado(comprobante, result.venta_previa);
      }
      if (result.error === 'ANIMAL_NO_DISPONIBLE') {
        return fail('the animal is no longer active (sold, dead or discarded)', 409, {
          campo: 'id_animal',
        });
      }
      const row = result.venta;
      await this.audit.write({
        userId,
        farmId,
        accion: 'crear',
        entidad: 'venta',
        idEntidad: row.id,
        despues: row,
        detalle: `Sale of ${cant} ${
          categoria || (id_animal ? `animal ${id_animal}` : 'animals')
        } - ${comprobante.tipo} ${comprobante.serie}-${comprobante.numero}`,
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
    const { comprobante, campo } = leerComprobante(body);
    if (!comprobante) {
      return fail(`${campo} is required (receipt issued by the UNAS cashier)`, 400, { campo });
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
        comprobante,
      });
      if (result.error === 'COMPROBANTE_DUPLICADO') {
        return comprobanteDuplicado(comprobante, result.venta_previa);
      }
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
        detalle: `Bulk sale of ${ventas.length} discards - ${comprobante.tipo} ${comprobante.serie}-${comprobante.numero}`,
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
