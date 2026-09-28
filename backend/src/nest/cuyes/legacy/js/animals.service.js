const {
  normalizeCodigo,
  isValidDateStr,
  esFechaFutura,
} = require('../../../../shared/utils/helpers');
const { ok, fail, fromError } = require('../../../../shared/kernel/ServiceResult');

function createAnimalsService({ repository, audit }) {
  return {
    async list({ farmId, query }) {
      const filters = { ...(query || {}) };
      if (filters.q) filters.q = normalizeCodigo(filters.q);
      const rows = await repository.list(farmId, filters);
      return ok({ total: rows.length, data: rows });
    },

    async findByCode({ farmId, codigoRaw }) {
      const codigoNorm = normalizeCodigo(codigoRaw);
      const animal = await repository.findByCodigoNorm(farmId, codigoNorm);
      if (!animal) {
        return fail('Animal not found', 404, {
          sugerencia: 'register',
          codigo: codigoNorm,
        });
      }
      const [historial, tratamientos] = await Promise.all([
        repository.getHistorial(animal.id),
        repository.getTratamientos(animal.id),
      ]);
      return ok({ ...animal, historial, tratamientos });
    },

    async create({ farmId, userId, body }) {
      const data = body || {};
      if (!data.codigo || !data.sexo) return fail('code and sex are required');
      if (!['M', 'H'].includes(data.sexo)) return fail('sex must be M or H');
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

      const jaula = await repository.findJaulaActiva(farmId, data.id_jaula);
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

      const ex = await repository.findByCodigoNormRaw(farmId, codigoNorm);
      if (ex) {
        if (ex.estado === 'activo') {
          return fail('Duplicate code in farm', 409, { animal: ex });
        }
        if (!data.confirmar_reuso) {
          return fail(
            'Code belongs to a removed animal. Confirm reuse.',
            409,
            { requiere_confirmacion: true, animal: ex }
          );
        }
        const animal = await repository.reusarBaja({
          userId,
          existente: ex,
          codigo,
          data,
        });
        await audit.write({
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
        const animal = await repository.insertNuevo({
          farmId,
          userId,
          codigo,
          codigoNorm,
          data,
        });
        await audit.write({
          userId,
          farmId,
          accion: 'crear',
          entidad: 'animal',
          idEntidad: animal.id,
          despues: animal,
          detalle: `Animal created: ${animal.codigo}`,
        });
        return ok(animal, 201);
      } catch (err) {
        if (err.code === '23505') {
          return fail('Duplicate code in farm', 409);
        }
        return fromError(err);
      }
    },

    async update({ farmId, userId, id, body }) {
      const data = body || {};
      if (data.fecha_baja && !isValidDateStr(data.fecha_baja)) {
        return fail('Invalid removal date', 400, { campo: 'fecha_baja' });
      }
      if (esFechaFutura(data.fecha_baja)) {
        return fail('removal date cannot be in the future', 400, { campo: 'fecha_baja' });
      }

      const antes = await repository.findById(farmId, id);
      if (!antes) return fail('Animal not found', 404);

      const animal = await repository.update({ id, data });
      if (data.particularidad) {
        await repository.insertParticularidad({
          id,
          texto: data.particularidad,
          fecha: data.fecha_baja,
          userId,
        });
      }
      await audit.write({
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
    },
  };
}

module.exports = { createAnimalsService };
