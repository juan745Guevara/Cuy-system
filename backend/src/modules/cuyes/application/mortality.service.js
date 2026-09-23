const { isValidDateStr, esFechaFutura } = require('../../../shared/utils/helpers');
const { ok, fail, fromError } = require('../../../shared/kernel/ServiceResult');

function createMortalityService({ repository, audit }) {
  return {
    async create({ farmId, userId, body }) {
      const { id_animal, fecha, clasificacion, categoria, cantidad, causa, id_jaula } = body || {};
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
        const disponible = await repository.countPoblacion(farmId, categoria);
        if (cant > disponible) {
          return fail(
            `quantity (${cant}) exceeds available category population (${disponible})`,
            400,
            { campo: 'cantidad', disponible }
          );
        }
      }

      try {
        const row = await repository.create({
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
        await audit.write({
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
    },

    async list(farmId) {
      return ok(await repository.list(farmId));
    },
  };
}

module.exports = { createMortalityService };
