import { Injectable } from '@nestjs/common';
import { ok, fail, fromError } from '../../shared/kernel/service-result.kernel';
import { AnimalsRepository } from '../repositories/animals.repository';
import { CuyesDepsService } from '../cuyes-deps.service';

import { normalizeCodigo, isValidDateStr, esFechaFutura } from '../../shared/utils/helpers';

@Injectable()
export class AnimalsService {
  constructor(
    private readonly repository: AnimalsRepository,
    private readonly cuyesDeps: CuyesDepsService,
  ) {}

  private get audit() {
    return this.cuyesDeps.toDeps().audit;
  }

  async list({ farmId, query }: { farmId: number; query?: Record<string, unknown> }) {
    const filters = { ...(query || {}) } as Record<string, unknown>;
    if (filters.q) filters.q = normalizeCodigo(filters.q);
    const rows = await this.repository.list(farmId, filters);
    return ok({ total: rows.length, data: rows });
  }

  async findByCode({ farmId, codigoRaw }: { farmId: number; codigoRaw: string }) {
    const codigoNorm = normalizeCodigo(codigoRaw);
    const animal = await this.repository.findByCodigoNorm(farmId, codigoNorm);
    if (!animal) {
      return fail('Animal not found', 404, {
        sugerencia: 'register',
        codigo: codigoNorm,
      });
    }
    const [historial, tratamientos] = await Promise.all([
      this.repository.getHistorial(animal.id),
      this.repository.getTratamientos(animal.id),
    ]);
    return ok({ ...animal, historial, tratamientos });
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
    const data = body || {};
    if (!data.codigo || !data.sexo) return fail('code and sex are required');
    if (!['M', 'H'].includes(String(data.sexo))) return fail('sex must be M or H');
    if (!data.id_jaula) return fail('cage is required', 400, { campo: 'id_jaula' });
    if (!normalizeCodigo(data.codigo)) return fail('Invalid code');
    if (data.fecha_nacimiento && !isValidDateStr(data.fecha_nacimiento)) {
      return fail('Invalid birth_date', 400, { campo: 'fecha_nacimiento' });
    }
    if (esFechaFutura(data.fecha_nacimiento)) {
      return fail('birth_date cannot be in the future', 400, { campo: 'fecha_nacimiento' });
    }

    const codigo = String(data.codigo).trim();
    const codigoNorm = normalizeCodigo(codigo);

    const jaula = await this.repository.findJaulaActiva(farmId, Number(data.id_jaula));
    if (!jaula) return fail('Cage is outside the active farm');

    if (
      jaula.capacidad_maxima != null &&
      jaula.ocupacion + 1 > jaula.capacidad_maxima &&
      !data.confirmar_capacidad
    ) {
      return fail('Cage exceeds max capacity', 409, {
        requiere_confirmacion: 'capacidad',
        ocupacion_actual: jaula.ocupacion,
        capacidad_maxima: jaula.capacidad_maxima,
      });
    }

    const ex = await this.repository.findByCodigoNormRaw(farmId, codigoNorm);
    if (ex) {
      if (ex.estado === 'activo') {
        return fail('Duplicate code in farm', 409, { animal: ex });
      }
      if (!data.confirmar_reuso) {
        return fail('Code belongs to a removed animal. Confirm reuse.', 409, {
          requiere_confirmacion: true,
          animal: ex,
        });
      }
      const animal = await this.repository.reusarBaja({
        userId,
        existente: ex,
        codigo,
        data,
      });
      await this.audit.write({
        userId,
        farmId,
        accion: 'reusar',
        entidad: 'animal',
        idEntidad: animal.id,
        despues: animal,
        detalle: `Code reused: ${animal.codigo}`,
      });
      return ok(animal, 201);
    }

    try {
      const animal = await this.repository.insertNuevo({
        farmId,
        userId,
        codigo,
        codigoNorm,
        data,
      });
      await this.audit.write({
        userId,
        farmId,
        accion: 'crear',
        entidad: 'animal',
        idEntidad: animal.id,
        despues: animal,
        detalle: `Animal created: ${animal.codigo}`,
      });
      return ok(animal, 201);
    } catch (err: any) {
      if (err.code === '23505') {
        return fail('Duplicate code in farm', 409);
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
    const data = body || {};
    if (data.fecha_baja && !isValidDateStr(data.fecha_baja)) {
      return fail('Invalid removal date', 400, { campo: 'fecha_baja' });
    }
    if (esFechaFutura(data.fecha_baja)) {
      return fail('removal date cannot be in the future', 400, { campo: 'fecha_baja' });
    }

    const antes = await this.repository.findById(farmId, id);
    if (!antes) return fail('Animal not found', 404);

    const animal = await this.repository.update({ id, data });
    if (data.particularidad) {
      await this.repository.insertParticularidad({
        id,
        texto: String(data.particularidad),
        fecha: data.fecha_baja as string | undefined,
        userId,
      });
    }
    await this.audit.write({
      userId,
      farmId,
      accion: data.estado && data.estado !== 'activo' ? 'dar_de_baja' : 'editar',
      entidad: 'animal',
      idEntidad: id,
      antes,
      despues: animal,
      detalle: `Animal updated: ${animal.codigo}`,
    });
    return ok(animal);
  }
}
