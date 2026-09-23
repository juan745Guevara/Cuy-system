const { ok, fail, fromError } = require('../../../shared/kernel/ServiceResult');

function createAreasService({ repository, audit, areaRules }) {
  const PURPOSES = areaRules.getPurposes();
  const normalizePurpose = areaRules.normalizePurpose;

  return {
    async list(farmId) {
      return ok(await repository.list(farmId));
    },

    async getSummary(farmId) {
      return ok(await repository.resumen(farmId));
    },

    async create({ farmId, userId, body }) {
      const { nombre, proposito, jaula_ids = [] } = body || {};
      if (!nombre || !proposito) {
        return fail('name and purpose are required');
      }
      const prop = normalizePurpose(proposito);
      if (!PURPOSES.includes(prop)) {
        return fail('Invalid purpose', 400, { propositos: PURPOSES });
      }
      const jaulaIds = jaula_ids.map(Number).filter(Boolean);
      try {
        const area = await repository.createWithJaulas({
          farmId,
          nombre,
          proposito: prop,
          jaulaIds,
        });
        await audit.write({
          userId,
          farmId,
          accion: 'crear',
          entidad: 'area',
          idEntidad: area.id,
          despues: area,
          detalle: `Area created: ${area.nombre}`,
        });
        return ok(area, 201);
      } catch (err) {
        if (err.code === '23505') {
          return fail('An area with that name already exists in the farm', 409);
        }
        return fromError(err);
      }
    },

    async deactivate({ farmId, userId, id, body }) {
      const { id_area_destino } = body || {};
      const antes = await repository.findById(farmId, id);
      if (!antes) return fail('Area not found', 404);

      const jaulas = await repository.countActiveJaulas(id);
      if (jaulas.length && !id_area_destino) {
        return fail('Move cages to another area before deactivating', 400, {
          jaulas: jaulas.length,
        });
      }

      try {
        const result = await repository.deactivate({
          farmId,
          id,
          idAreaDestino: id_area_destino,
        });
        if (result.error) return fail(result.error);
        await audit.write({
          userId,
          farmId,
          accion: 'deactivate',
          entidad: 'area',
          idEntidad: result.area.id,
          antes,
          despues: result.area,
          detalle: `Area deactivated: ${antes.nombre}`,
        });
        return ok(result.area);
      } catch (err) {
        return fromError(err);
      }
    },
  };
}

module.exports = { createAreasService };
