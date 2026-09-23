const { ok, fail, fromError } = require('../../shared/kernel/ServiceResult');

function createFarmsService({ repository, audit }) {
  return {
    list(userFarms) {
      return ok(userFarms);
    },

    async create({ userId, farmId, body }) {
      const { nombre, id_especie, ubicacion, responsable, fecha_inicio } = body || {};
      if (!nombre || !id_especie) {
        return fail('name and species_id are required');
      }
      try {
        const granja = await repository.insert({
          nombre,
          id_especie,
          ubicacion: ubicacion || null,
          responsable: responsable || null,
          fecha_inicio: fecha_inicio || null,
        });
        await audit.write({
          userId,
          farmId,
          accion: 'crear',
          entidad: 'granja',
          idEntidad: granja.id,
          despues: granja,
          detalle: `Farm created: ${granja.nombre}`,
        });
        return ok(granja, 201);
      } catch (err) {
        if (err.code === '23505') return fail('A farm with that name already exists', 409);
        return fromError(err);
      }
    },

    async deactivate({ userId, farmId, id }) {
      const granja = await repository.deactivate(id);
      if (!granja) return fail('Farm not found', 404);
      await audit.write({
        userId,
        farmId,
        accion: 'deactivate',
        entidad: 'granja',
        idEntidad: granja.id,
        despues: granja,
        detalle: `Farm deactivated: ${granja.nombre}`,
      });
      return ok(granja);
    },

    async assignUsers({ userId, userRol, userFarms, farmId, usuario_ids }) {
      const allowed = userFarms.map((g) => g.id);
      if (userRol !== 'superadmin' && !allowed.includes(farmId)) {
        return fail('Farm is outside your scope', 403);
      }
      const ids = (usuario_ids || []).map(Number);
      await repository.assignUsers(farmId, ids);
      await audit.write({
        userId,
        farmId,
        accion: 'configurar',
        entidad: 'granja',
        idEntidad: farmId,
        despues: { id_granja: farmId, usuarios: ids },
        detalle: `Farm user configuration: ${farmId}`,
      });
      return ok({ ok: true, id_granja: farmId, usuarios: ids });
    },
  };
}

module.exports = { createFarmsService };
