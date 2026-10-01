import { Injectable } from '@nestjs/common';
import { ok, fail, fromError } from '../../shared/kernel/service-result.kernel';
import { AnimalsRepositoryPort } from '../domain/ports/animals.repository.port';
import { SharedDepsService } from '../../shared/deps/shared-deps.service';
import { NewAnimal } from '../domain/entities/animal.entity';
import { PastDate } from '../domain/value-objects/past-date.vo';
import { NormalizedCode } from '../domain/value-objects/normalized-code.vo';
import { DomainValidationError } from '../domain/errors/domain-validation.error';

@Injectable()
export class AnimalsService {
  constructor(
    private readonly repository: AnimalsRepositoryPort,
    private readonly sharedDeps: SharedDepsService,
  ) {}

  private get audit() {
    return this.sharedDeps.audit;
  }

  async list({ farmId, query }: { farmId: number; query?: Record<string, unknown> }) {
    const filters = { ...(query || {}) } as Record<string, unknown>;
    if (filters.q) filters.q = NormalizedCode.normalize(filters.q);
    const rows = await this.repository.list(farmId, filters);
    return ok({ total: rows.length, data: rows });
  }

  async findByCode({ farmId, codigoRaw }: { farmId: number; codigoRaw: string }) {
    const codigoNorm = NormalizedCode.normalize(codigoRaw);
    const animal = await this.repository.findByNormalizedCode(farmId, codigoNorm);
    if (!animal) {
      return fail('Animal not found', 404, {
        sugerencia: 'register',
        codigo: codigoNorm,
      });
    }
    const [historial, tratamientos] = await Promise.all([
      this.repository.getHistory(animal.id),
      this.repository.getTreatments(animal.id),
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
    let newAnimal: NewAnimal;
    try {
      newAnimal = NewAnimal.register(body || {});
    } catch (err) {
      if (err instanceof DomainValidationError) {
        return fail(err.message, 400, err.field ? { campo: err.field } : {});
      }
      throw err;
    }

    const jaula = await this.repository.findActiveCage(farmId, newAnimal.cageId);
    if (!jaula) return fail('Cage is outside the active farm');

    if (
      jaula.capacidad_maxima != null &&
      jaula.ocupacion + 1 > jaula.capacidad_maxima &&
      !newAnimal.confirmCapacity
    ) {
      return fail('Cage exceeds max capacity', 409, {
        requiere_confirmacion: 'capacidad',
        ocupacion_actual: jaula.ocupacion,
        capacidad_maxima: jaula.capacidad_maxima,
      });
    }

    const ex = await this.repository.findByNormalizedCodeRaw(farmId, newAnimal.code.normalized);
    if (ex) {
      if (ex.estado === 'activo') {
        return fail('Duplicate code in farm', 409, { animal: ex });
      }
      if (!newAnimal.confirmReuse) {
        return fail('Code belongs to a removed animal. Confirm reuse.', 409, {
          requiere_confirmacion: true,
          animal: ex,
        });
      }
      const animal = await this.repository.reuseDischargedCode({
        userId,
        existente: ex,
        animal: newAnimal,
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
      const animal = await this.repository.insertNew({
        farmId,
        userId,
        animal: newAnimal,
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
    try {
      PastDate.createOptional(data.fecha_baja, 'fecha_baja', 'removal date');
    } catch (err) {
      if (err instanceof DomainValidationError) {
        return fail(err.message, 400, { campo: err.field });
      }
      throw err;
    }

    const antes = await this.repository.findById(farmId, id);
    if (!antes) return fail('Animal not found', 404);

    const animal = await this.repository.update({ id, data });
    if (data.particularidad) {
      await this.repository.insertNote({
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
