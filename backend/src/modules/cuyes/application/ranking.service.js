const { ok, fail } = require('../../../shared/kernel/ServiceResult');

const DEFAULT_CFG = {
  peso_partos: 20,
  peso_camada: 25,
  peso_destete: 20,
  peso_mortalidad: 15,
  peso_peso_nac: 10,
  peso_peso_dest: 10,
  peso_prenez_macho: 30,
};

function createRankingService({ repository, audit }) {
  async function getCfg(farmId) {
    const row = await repository.findConfig(farmId);
    if (row) return row;
    return repository.insertDefaultConfig(farmId);
  }

  return {
    async getConfig(farmId) {
      return ok(await getCfg(farmId));
    },

    async updateConfig({ farmId, userId, body }) {
      const b = { ...DEFAULT_CFG, ...(body || {}) };
      const current = await getCfg(farmId);
      const row = await repository.upsertConfig(farmId, b);
      await audit.write({
        userId,
        farmId,
        accion: 'configurar',
        entidad: 'ranking',
        idEntidad: farmId,
        antes: current,
        despues: row,
        detalle: 'Breeding ranking configuration',
      });
      return ok(row);
    },

    async list({ farmId, query }) {
      const sexo = query.sexo || 'H';
      const idRaza = query.id_raza ? Number(query.id_raza) : null;
      const idCategoria = query.id_categoria ? Number(query.id_categoria) : null;
      const cfg = await getCfg(farmId);

      if (sexo === 'H') {
        const rows = await repository.findRankingHembras(farmId, idRaza, idCategoria);
        const ranked = rows.map((row) => {
          const insuficientes = row.partos < 2;
          const score = insuficientes
            ? null
            : Number(row.partos) * Number(cfg.peso_partos) +
              Number(row.camada_promedio) * Number(cfg.peso_camada) +
              Number(row.destete_promedio) * Number(cfg.peso_destete) -
              Number(row.mortalidad_camada) * Number(cfg.peso_mortalidad) +
              Number(row.peso_nac_promedio) * Number(cfg.peso_peso_nac) +
              Number(row.peso_dest_promedio) * Number(cfg.peso_peso_dest);
          return {
            ...row,
            puntaje: score == null ? null : Number(score.toFixed(2)),
            datos_insuficientes: insuficientes,
          };
        });
        ranked.sort((a, b) => {
          if (a.datos_insuficientes !== b.datos_insuficientes) {
            return a.datos_insuficientes ? 1 : -1;
          }
          return (b.puntaje || 0) - (a.puntaje || 0);
        });
        return ok({ sexo: 'H', config: cfg, ranking: ranked });
      }

      const rows = await repository.findRankingMachos(farmId, idRaza, idCategoria);
      const ranked = rows.map((row) => {
        const insuficientes = row.empadres < 2;
        const pctPrenez = row.hembras > 0 ? (100 * Number(row.prenadas)) / Number(row.hembras) : 0;
        const score = insuficientes
          ? null
          : pctPrenez * Number(cfg.peso_prenez_macho) +
            Number(row.camada_promedio) * Number(cfg.peso_camada) +
            Number(row.empadres) * Number(cfg.peso_partos);
        return {
          ...row,
          pct_prenez: Number(pctPrenez.toFixed(1)),
          puntaje: score == null ? null : Number(score.toFixed(2)),
          datos_insuficientes: insuficientes,
        };
      });
      ranked.sort((a, b) => {
        if (a.datos_insuficientes !== b.datos_insuficientes) {
          return a.datos_insuficientes ? 1 : -1;
        }
        return (b.puntaje || 0) - (a.puntaje || 0);
      });
      return ok({ sexo: 'M', config: cfg, ranking: ranked });
    },

    async mark({ farmId, userId, animalId, body }) {
      const { accion } = body || {};
      if (!['descarte', 'reemplazo'].includes(accion)) {
        return fail('accion must be descarte or reemplazo');
      }

      const animal = await repository.findAnimal(farmId, animalId);
      if (!animal) return fail('Animal not found', 404);

      if (accion === 'descarte') {
        const row = await repository.markDescarte(animalId);
        await repository.insertParticularidad(
          animalId,
          'Marked for discard from ranking',
          userId
        );
        await audit.write({
          userId,
          farmId,
          accion: 'discard',
          entidad: 'animal',
          idEntidad: row.id,
          antes: animal,
          despues: row,
          detalle: `Marked for discard from ranking (${row.codigo})`,
        });
        return ok(row);
      }

      const catId = await repository.findCategoriaReemplazo(farmId);
      const row = await repository.markReemplazo(animalId, catId);
      await repository.insertParticularidad(
        animalId,
        'Marked as replacement from ranking',
        userId
      );
      await audit.write({
        userId,
        farmId,
        accion: 'editar',
        entidad: 'animal',
        idEntidad: row.id,
        antes: animal,
        despues: row,
        detalle: `Marked as replacement from ranking (${row.codigo})`,
      });
      return ok(row);
    },
  };
}

module.exports = { createRankingService };
