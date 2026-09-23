const { ok } = require('../../shared/kernel/ServiceResult');

function createSpeciesService({ repository }) {
  return {
    async list() {
      return ok(await repository.listActive());
    },

    /** Species the user can access (from assigned farms). */
    listForUser(userFarms) {
      const map = new Map();
      for (const farm of userFarms || []) {
        if (farm.id_especie && !map.has(farm.id_especie)) {
          map.set(farm.id_especie, {
            id: farm.id_especie,
            name: farm.especie || farm.species || String(farm.id_especie),
          });
        }
      }
      return ok([...map.values()].sort((a, b) => a.name.localeCompare(b.name)));
    },
  };
}

module.exports = { createSpeciesService };
