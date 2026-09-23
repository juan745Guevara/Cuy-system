const { isValidDateStr, esFechaFutura } = require('../../../shared/utils/helpers');
const { ok, fail, fromError } = require('../../../shared/kernel/ServiceResult');

function createSalesService({ repository, audit }) {
  return {
    async create({ farmId, userId, body }) {
      const { id_animal, fecha, clasificacion, categoria, cantidad, comprador, precio } = body || {};
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
            `quantity (${cant}) exceeds available population (${disponible})`,
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
            comprador,
            precio,
          },
        });
        await audit.write({
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
    },

    async listDiscards(farmId) {
      return ok(await repository.listDiscards(farmId));
    },

    async sellDiscards({ farmId, userId, body }) {
      const { fecha, comprador, precio, id_animales } = body || {};
      if (!fecha) return fail('date is required', 400, { campo: 'fecha' });
      if (!Array.isArray(id_animales) || !id_animales.length) {
        return fail('id_animales[] is required', 400, { campo: 'id_animales' });
      }
      if (!isValidDateStr(fecha)) return fail('Invalid date', 400, { campo: 'fecha' });
      if (esFechaFutura(fecha)) {
        return fail('date cannot be in the future', 400, { campo: 'fecha' });
      }
      const ids = [...new Set(id_animales.map(Number).filter((n) => Number.isFinite(n)))];

      try {
        const result = await repository.sellDiscards({
          farmId,
          userId,
          fecha,
          comprador,
          precio,
          ids,
        });
        if (result.error) {
          return fail(result.error, 400, { animales: result.animales });
        }
        await audit.write({
          userId,
          farmId,
          accion: 'crear',
          entidad: 'venta',
          idEntidad: result.ventas[0]?.id,
          despues: result.ventas,
          detalle: `Bulk sale of ${result.ventas.length} discards`,
        });
        return ok({ registradas: result.ventas.length, ventas: result.ventas }, 201);
      } catch (err) {
        return fromError(err);
      }
    },

    async list(farmId) {
      return ok(await repository.list(farmId));
    },
  };
}

module.exports = { createSalesService };
