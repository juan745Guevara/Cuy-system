const { ok, fail, fromError } = require('../../../shared/kernel/ServiceResult');

function hoyISO() {
  return new Date().toISOString().slice(0, 10);
}

function rangoPara(rangos, nombre, RANGOS_DEFAULT) {
  const base = rangos || RANGOS_DEFAULT;
  if (!nombre) return base.default;
  const n = String(nombre).toLowerCase();
  if (n.includes('recr') || n.includes('reemplazo')) return base.recria;
  if (n.includes('gazapo') || n.includes('cria') || n.includes('cría')) return base.gazapo;
  if (n.includes('destete')) return base.destete;
  if (n.includes('reproductora')) return base.reproductora;
  if (n.includes('reproductor')) return base.reproductor;
  return base.default;
}

function createWeighingsService({ repository, audit }) {
  const { RANGOS_DEFAULT, CATEGORIAS_RANGO, ESPECIE_ABS } = repository;

  async function loadRanges(farmId) {
    let rows = await repository.getRangosRows(farmId);
    if (!rows.length) {
      await repository.seedRangos(farmId);
      return { ...RANGOS_DEFAULT };
    }
    const out = {};
    for (const cat of CATEGORIAS_RANGO) {
      out[cat] = { ...RANGOS_DEFAULT[cat] };
    }
    for (const r of rows) {
      if (out[r.categoria]) out[r.categoria] = { min: r.min, max: r.max };
      else out[r.categoria] = { min: r.min, max: r.max };
    }
    return out;
  }

  async function insertPesaje({ farmId, animalId, fecha, peso, userId, confirmar, rangos }) {
    if (!fecha || peso == null) return fail('date and peso_gramos are required');
    const pesoNum = Number(peso);
    if (!(pesoNum > 0)) return fail('Weight must be greater than zero');
    if (fecha > hoyISO()) return fail('Date cannot be in the future');
    if (pesoNum < ESPECIE_ABS.min || pesoNum > ESPECIE_ABS.max) {
      return fail(`Invalid weight for species (${ESPECIE_ABS.min}-${ESPECIE_ABS.max} g)`);
    }

    const animal = await repository.findAnimal(farmId, animalId);
    if (!animal) return fail('Animal not found in farm', 404);

    const rango = rangoPara(rangos, animal.categoria, RANGOS_DEFAULT);
    const fuera = pesoNum < rango.min || pesoNum > rango.max;
    if (fuera && !confirmar) {
      return fail(
        `Weight outside expected range (${rango.min}-${rango.max} g) for ${animal.categoria || 'category'}`,
        409,
        { requiere_confirmacion: 'fuera_rango', rango, codigo: animal.codigo }
      );
    }

    const row = await repository.insertPesaje(null, {
      farmId,
      animalId,
      fecha,
      pesoNum,
      fuera,
      userId,
    });
    return ok(row);
  }

  return {
    async create({ farmId, userId, body }) {
      const { id_animal, fecha, peso_gramos, confirmar_fuera_rango } = body || {};
      try {
        const rangos = await loadRanges(farmId);
        const result = await insertPesaje({
          farmId,
          animalId: Number(id_animal),
          fecha,
          peso: peso_gramos,
          userId,
          confirmar: confirmar_fuera_rango,
          rangos,
        });
        if (!result.ok) return result;
        await audit.write({
          userId,
          farmId,
          accion: 'crear',
          entidad: 'pesaje',
          idEntidad: result.data.id,
          despues: result.data,
          detalle: `Weighing ${result.data.peso_gramos} g for animal ${result.data.id_animal}`,
        });
        return ok(result.data, 201);
      } catch (err) {
        return fromError(err);
      }
    },

    async createBatch({ farmId, userId, body }) {
      const { fecha, pesajes, confirmar_fuera_rango } = body || {};
      if (!fecha || !Array.isArray(pesajes)) {
        return fail('date and pesajes[] are required');
      }
      const validos = pesajes.filter(
        (p) => p.id_animal && p.peso_gramos != null && p.peso_gramos !== ''
      );
      if (!validos.length) return fail('No weights to save');

      try {
        const rangos = await loadRanges(farmId);
        const creados = [];
        for (const p of validos) {
          const result = await insertPesaje({
            farmId,
            animalId: Number(p.id_animal),
            fecha,
            peso: p.peso_gramos,
            userId,
            confirmar: confirmar_fuera_rango || p.confirmar_fuera_rango,
            rangos,
          });
          if (!result.ok) return result;
          creados.push(result.data);
        }
        await audit.write({
          userId,
          farmId,
          accion: 'crear',
          entidad: 'pesaje',
          idEntidad: creados[0].id,
          despues: creados,
          detalle: `${creados.length} weighings recorded in batch`,
        });
        return ok({ registrados: creados.length, pesajes: creados }, 201);
      } catch (err) {
        return fromError(err);
      }
    },

    async animalTrend({ farmId, animalId }) {
      const rows = await repository.listByAnimal(animalId, farmId);
      return ok(
        rows.map((r, i) => ({
          ...r,
          ganancia_gramos:
            i > 0 ? Number(r.peso_gramos) - Number(rows[i - 1].peso_gramos) : null,
        }))
      );
    },

    async getAverage({ farmId, query }) {
      return ok(await repository.promedio(farmId, query || {}));
    },

    async getRanges(farmId) {
      const rangos = await loadRanges(farmId);
      return ok({ categorias: rangos, especie: ESPECIE_ABS });
    },

    async updateRangos({ farmId, userId, body }) {
      const current = await loadRanges(farmId);
      const next = {};
      for (const key of CATEGORIAS_RANGO) {
        next[key] = { ...current[key] };
        if (body[key]?.min != null && body[key]?.max != null) {
          const min = Number(body[key].min);
          const max = Number(body[key].max);
          if (!(min > 0) || !(max > min)) {
            return fail(`Invalid range for ${key}`);
          }
          next[key] = { min, max };
        }
      }
      await repository.saveRangos(farmId, next, userId);
      const rangos = await loadRanges(farmId);
      await audit.write({
        userId,
        farmId,
        accion: 'configurar',
        entidad: 'rango',
        idEntidad: farmId,
        antes: current,
        despues: rangos,
        detalle: 'Weight range configuration',
      });
      return ok({ categorias: rangos, especie: ESPECIE_ABS });
    },
  };
}

module.exports = { createWeighingsService };
