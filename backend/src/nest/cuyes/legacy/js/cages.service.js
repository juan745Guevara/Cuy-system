const { normalizeCodigo } = require('../../../../shared/utils/helpers');
const { ok, fail, fromError } = require('../../../../shared/kernel/ServiceResult');

function createCagesService({ repository, audit }) {
  return {
    async list({ farmId, query }) {
      const idArea = query?.id_area ? Number(query.id_area) : null;
      return ok(await repository.list(farmId, idArea));
    },

    async getOccupancy(farmId) {
      const rows = await repository.ocupacionRows(farmId);
      const areasMap = {};
      let ocupacionGranja = 0;
      let capacidadGranja = 0;
      const sobrecupo = [];

      for (const r of rows) {
        if (!areasMap[r.id_area]) {
          areasMap[r.id_area] = {
            id: r.id_area,
            nombre: r.area,
            proposito: r.proposito,
            ocupacion: 0,
            capacidad: 0,
            jaulas: [],
          };
        }
        if (!r.id_jaula) continue;
        const item = {
          id: r.id_jaula,
          codigo: r.jaula,
          capacidad_maxima: r.capacidad_maxima,
          ocupacion: r.ocupacion,
          excedida: r.capacidad_maxima != null && r.ocupacion > r.capacidad_maxima,
        };
        areasMap[r.id_area].jaulas.push(item);
        areasMap[r.id_area].ocupacion += r.ocupacion;
        if (r.capacidad_maxima != null) {
          areasMap[r.id_area].capacidad += r.capacidad_maxima;
          capacidadGranja += r.capacidad_maxima;
        }
        ocupacionGranja += r.ocupacion;
        if (item.excedida) {
          sobrecupo.push({ ...item, area: r.area, id_area: r.id_area });
        }
      }

      return ok({
        granja: { ocupacion: ocupacionGranja, capacidad: capacidadGranja || null },
        areas: Object.values(areasMap),
        sobrecupo,
      });
    },

    async create({ farmId, userId, body }) {
      const { id_area, codigo, capacidad_maxima } = body || {};
      if (!id_area || !codigo) {
        return fail('id_area and codigo are required');
      }
      const area = await repository.findAreaInGranja(farmId, id_area);
      if (!area) return fail('Area does not belong to the active farm');

      const codigoNorm = normalizeCodigo(codigo);
      const dup = await repository.findDuplicateCodigo(farmId, codigoNorm);
      if (dup) {
        return fail('A cage with that name already exists in the farm', 409);
      }

      try {
        const jaula = await repository.insert({
          idArea: id_area,
          codigo: String(codigo).trim(),
          capacidadMaxima: capacidad_maxima,
        });
        await audit.write({
          userId,
          farmId,
          accion: 'crear',
          entidad: 'jaula',
          idEntidad: jaula.id,
          despues: jaula,
          detalle: `Cage created: ${jaula.codigo}`,
        });
        return ok(jaula, 201);
      } catch (err) {
        if (err.code === '23505') {
          return fail('A cage with that code already exists in the area', 409);
        }
        return fromError(err);
      }
    },

    async update({ farmId, userId, id, body }) {
      const { codigo, capacidad_maxima, id_area } = body || {};
      const cur = await repository.findInGranja(farmId, id);
      if (!cur) return fail('Cage not found', 404);

      if (id_area) {
        const area = await repository.findAreaInGranja(farmId, id_area);
        if (!area) return fail('Invalid area');
      }
      if (codigo) {
        const codigoNorm = normalizeCodigo(codigo);
        const dup = await repository.findDuplicateCodigo(farmId, codigoNorm, id);
        if (dup) return fail('Duplicate cage name in the farm', 409);
      }

      const updated = await repository.update({
        id,
        codigo: codigo ? String(codigo).trim() : null,
        capacidadMaxima: capacidad_maxima ?? null,
        idArea: id_area || null,
      });
      await audit.write({
        userId,
        farmId,
        accion: 'editar',
        entidad: 'jaula',
        idEntidad: id,
        antes: cur,
        despues: updated,
        detalle: `Cage updated: ${updated.codigo}`,
      });
      return ok(updated);
    },

    async deactivate({ farmId, userId, id }) {
      const jaula = await repository.deactivate(farmId, id);
      if (!jaula) return fail('Cage not found', 404);
      await audit.write({
        userId,
        farmId,
        accion: 'deactivate',
        entidad: 'jaula',
        idEntidad: jaula.id,
        despues: jaula,
        detalle: `Cage deactivated: ${jaula.codigo}`,
      });
      return ok(jaula);
    },

    async getAnimals({ farmId, jaulaId }) {
      return ok(await repository.listAnimales(farmId, jaulaId));
    },
  };
}

module.exports = { createCagesService };
