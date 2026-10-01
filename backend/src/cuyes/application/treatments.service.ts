import { Injectable } from '@nestjs/common';
import { ok, fail, fromError } from '../../shared/kernel/service-result.kernel';
import { TreatmentsRepositoryPort } from '../domain/ports/treatments.repository.port';
import { CuyesDepsService } from './cuyes-deps.service';

import { isValidDateStr, esFechaFutura } from '../../shared/utils/helpers';

function addDays(fechaISO: string, dias: number) {
  const d = new Date(`${fechaISO}T00:00:00`);
  d.setDate(d.getDate() + Number(dias));
  return d.toISOString().slice(0, 10);
}

@Injectable()
export class TreatmentsService {
  constructor(
    private readonly repository: TreatmentsRepositoryPort,
    private readonly cuyesDeps: CuyesDepsService,
  ) {}

  private get audit() {
    return this.cuyesDeps.toDeps().audit;
  }

  async create({
    farmId,
    userId,
    user,
    body,
  }: {
    farmId: number;
    userId: number;
    user: { nombre?: string };
    body: Record<string, unknown>;
  }) {
    const {
      tipo = 'curativo',
      producto,
      dosis,
      via,
      fecha_inicio,
      duracion_dias,
      diagnostico,
      responsable,
      id_animal,
      id_jaula,
      id_area,
      ids_animales,
    } = body || {};

    if (!producto || !fecha_inicio || !duracion_dias) {
      return fail('producto, fecha_inicio and duracion_dias are required');
    }
    if (!['preventivo', 'curativo'].includes(String(tipo))) {
      return fail('tipo must be preventivo or curativo');
    }
    if (!isValidDateStr(fecha_inicio)) {
      return fail('Invalid start date', 400, { campo: 'fecha_inicio' });
    }
    if (esFechaFutura(fecha_inicio)) {
      return fail('fecha_inicio cannot be in the future', 400, { campo: 'fecha_inicio' });
    }
    if (!Number.isFinite(Number(duracion_dias)) || Number(duracion_dias) <= 0) {
      return fail('duracion_dias must be greater than zero', 400, { campo: 'duracion_dias' });
    }

    const termino = addDays(String(fecha_inicio), Number(duracion_dias));
    let animalIds = Array.isArray(ids_animales) ? ids_animales.map(Number) : [];
    if (id_animal) animalIds = [Number(id_animal)];

    if (id_jaula && !animalIds.length) {
      animalIds = await this.repository.getAnimalsByCage(Number(id_jaula), farmId);
    }
    if (id_area && !animalIds.length) {
      animalIds = await this.repository.getAnimalsByArea(Number(id_area), farmId);
    }

    const targets = animalIds.length ? animalIds : [null];
    try {
      const creados = [];
      for (const aid of targets) {
        creados.push(
          await this.repository.insert({
            farmId,
            idAnimal: aid,
            id_jaula: id_jaula != null ? Number(id_jaula) : undefined,
            id_area: id_area != null ? Number(id_area) : undefined,
            tipo: String(tipo),
            producto: String(producto),
            dosis: dosis != null ? String(dosis) : undefined,
            via: via != null ? String(via) : undefined,
            fecha_inicio: String(fecha_inicio),
            duracion_dias: Number(duracion_dias),
            termino,
            diagnostico: diagnostico != null ? String(diagnostico) : undefined,
            responsable: responsable ? String(responsable) : user.nombre || null,
            userId,
          }),
        );
      }
      await this.audit.write({
        userId,
        farmId,
        accion: 'crear',
        entidad: 'tratamiento',
        idEntidad: creados[0].id,
        despues: creados,
        detalle: `Treatment ${tipo} "${producto}" for ${creados.length} record(s)`,
      });
      return ok({ registrados: creados.length, tratamientos: creados }, 201);
    } catch (err) {
      return fromError(err);
    }
  }

  async list({ farmId, query }: { farmId: number; query?: Record<string, unknown> }) {
    return ok(await this.repository.list(farmId, query || {}));
  }

  async listActive({ farmId, query }: { farmId: number; query?: Record<string, unknown> }) {
    const idArea = query?.id_area ? Number(query.id_area) : null;
    return ok(await this.repository.listOngoing(farmId, idArea));
  }

  async complete({
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
    const { motivo_cierre } = body || {};
    const row = await this.repository.complete(
      farmId,
      id,
      motivo_cierre != null ? String(motivo_cierre) : undefined,
    );
    if (!row) return fail('Treatment not found', 404);
    await this.audit.write({
      userId,
      farmId,
      accion: 'finalizar',
      entidad: 'tratamiento',
      idEntidad: row.id,
      despues: row,
      detalle: `Treatment completed #${row.id} (${row.producto})`,
    });
    return ok(row);
  }
}
