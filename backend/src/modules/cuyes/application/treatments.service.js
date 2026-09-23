const { isValidDateStr, esFechaFutura } = require('../../../shared/utils/helpers');
const { ok, fail, fromError } = require('../../../shared/kernel/ServiceResult');

function addDays(fechaISO, dias) {
  const d = new Date(`${fechaISO}T00:00:00`);
  d.setDate(d.getDate() + Number(dias));
  return d.toISOString().slice(0, 10);
}

function createTreatmentsService({ repository, audit }) {
  return {
    async create({ farmId, userId, user, body }) {
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
      if (!['preventivo', 'curativo'].includes(tipo)) {
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

      const termino = addDays(fecha_inicio, Number(duracion_dias));
      let animalIds = Array.isArray(ids_animales) ? ids_animales.map(Number) : [];
      if (id_animal) animalIds = [Number(id_animal)];

      if (id_jaula && !animalIds.length) {
        animalIds = await repository.getAnimalesByJaula(id_jaula, farmId);
      }
      if (id_area && !animalIds.length) {
        animalIds = await repository.getAnimalesByArea(id_area, farmId);
      }

      const targets = animalIds.length ? animalIds : [null];
      try {
        const creados = [];
        for (const aid of targets) {
          creados.push(
            await repository.insert({
              farmId,
              idAnimal: aid,
              id_jaula,
              id_area,
              tipo,
              producto,
              dosis,
              via,
              fecha_inicio,
              duracion_dias: Number(duracion_dias),
              termino,
              diagnostico,
              responsable: responsable || user.nombre || null,
              userId,
            })
          );
        }
        await audit.write({
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
    },

    async list({ farmId, query }) {
      return ok(await repository.list(farmId, query || {}));
    },

    async listActive({ farmId, query }) {
      const idArea = query?.id_area ? Number(query.id_area) : null;
      return ok(await repository.listEnCurso(farmId, idArea));
    },

    async complete({ farmId, userId, id, body }) {
      const { motivo_cierre } = body || {};
      const row = await repository.complete(farmId, id, motivo_cierre);
      if (!row) return fail('Treatment not found', 404);
      await audit.write({
        userId,
        farmId,
        accion: 'finalizar',
        entidad: 'tratamiento',
        idEntidad: row.id,
        despues: row,
        detalle: `Treatment completed #${row.id} (${row.producto})`,
      });
      return ok(row);
    },
  };
}

module.exports = { createTreatmentsService };
