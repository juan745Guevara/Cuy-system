const { normalizeCodigo, isValidDateStr, todayISO, promedioPesos } = require('../../../shared/utils/helpers');
const { ok, fail, fromError } = require('../../../shared/kernel/ServiceResult');

function createBreedingsService({ repository, audit }) {
  async function assertAnimal(farmId, id, sexo) {
    const animal = await repository.findAnimal(farmId, id, sexo);
    if (!animal) return { error: 'Animal not found or inactive' };
    if (sexo && animal.sexo !== sexo) return { error: `Expected sex ${sexo}` };
    return { animal };
  }

  return {
    async createBreedingFemale({ farmId, userId, body }) {
      const { codigo, id_raza, id_categoria, id_jaula, fecha_nacimiento, particularidad } = body || {};
      if (!codigo) return fail('code is required');
      if (!id_jaula) return fail('cage is required', 400, { campo: 'id_jaula' });
      const codigoNorm = normalizeCodigo(codigo);
      try {
        const animal = await repository.insertReproductor({
          farmId,
          codigo: String(codigo).trim(),
          codigoNorm,
          sexo: 'H',
          id_raza,
          id_categoria,
          id_jaula,
          fecha_nacimiento,
          userId,
        });
        if (particularidad) {
          await repository.insertParticularidad(animal.id, particularidad, userId);
        }
        return ok(animal, 201);
      } catch (err) {
        if (err.code === '23505') return fail('Duplicate code', 409);
        return fromError(err);
      }
    },

    async createBreedingMale({ farmId, userId, body }) {
      const { codigo, id_raza, id_categoria, id_jaula, fecha_nacimiento, particularidad } = body || {};
      if (!codigo) return fail('code is required');
      const codigoNorm = normalizeCodigo(codigo);
      try {
        const animal = await repository.insertReproductor({
          farmId,
          codigo: String(codigo).trim(),
          codigoNorm,
          sexo: 'M',
          id_raza,
          id_categoria,
          id_jaula,
          fecha_nacimiento,
          userId,
        });
        if (particularidad) {
          await repository.insertParticularidad(animal.id, particularidad, userId);
        }
        return ok(animal, 201);
      } catch (err) {
        if (err.code === '23505') return fail('Duplicate code', 409);
        return fromError(err);
      }
    },

    async createBreeding({ farmId, userId, body }) {
      const {
        id_macho,
        hembras = [],
        id_jaula,
        fecha_empadre,
        peso_antes,
        peso_despues,
        cantidad_prenadas,
        notas,
      } = body || {};
      if (!fecha_empadre || !Array.isArray(hembras) || hembras.length === 0) {
        return fail('fecha_empadre and hembras[] are required');
      }
      if (!isValidDateStr(fecha_empadre)) {
        return fail('Invalid breeding date', 400, { campo: 'fecha_empadre' });
      }
      if (fecha_empadre > todayISO()) {
        return fail('fecha_empadre cannot be in the future', 400, { campo: 'fecha_empadre' });
      }
      const cantPren = cantidad_prenadas != null ? Number(cantidad_prenadas) : null;
      if (cantPren != null && (cantPren < 0 || cantPren > hembras.length)) {
        return fail('pregnant count cannot exceed female count', 400, {
          campo: 'cantidad_prenadas',
        });
      }

      if (id_macho) {
        const m = await assertAnimal(farmId, id_macho, 'M');
        if (m.error) return fail(m.error);
      }
      for (const hid of hembras) {
        const h = await assertAnimal(farmId, hid, 'H');
        if (h.error) return fail(h.error);
        const lastParto = await repository.getLastPartoDate(hid);
        if (lastParto && fecha_empadre < String(lastParto).slice(0, 10)) {
          return fail('breeding date cannot be before the female last birth', 400, {
            campo: 'fecha_empadre',
            id_hembra: hid,
          });
        }
      }

      try {
        const emp = await repository.createEmpadre({
          farmId,
          userId,
          id_macho,
          id_jaula,
          fecha_empadre,
          peso_antes,
          peso_despues,
          hembras,
          cantPren,
          notas,
        });
        await audit.write({
          userId,
          farmId,
          accion: 'crear',
          entidad: 'empadre',
          idEntidad: emp.id,
          despues: { ...emp, hembras },
          detalle: `Breeding #${emp.id} created with ${hembras.length} females`,
        });
        return ok({ ...emp, hembras, cantidad_hembras: hembras.length }, 201);
      } catch (err) {
        return fromError(err);
      }
    },

    async list(farmId) {
      return ok(await repository.listEmpadres(farmId));
    },

    async updateFemaleBreedingResult({ farmId, userId, empadreId, hembraId, body }) {
      const { resultado, fecha } = body || {};
      if (!['prenez', 'vacia', 'aborto', 'murio'].includes(resultado)) {
        return fail('Invalid result');
      }
      const fechaRes = fecha && isValidDateStr(fecha) ? fecha : todayISO();
      const antes = await repository.findEmpadreHembra(farmId, empadreId, hembraId);
      const row = await repository.updateEmpadreHembraResultado(
        farmId,
        empadreId,
        hembraId,
        resultado
      );
      if (!row) return fail('Record not found', 404);

      if (resultado === 'murio') {
        await repository.markHembraMuerta({ farmId, hembraId, fechaRes, userId });
      }
      await audit.write({
        userId,
        farmId,
        accion: 'editar',
        entidad: 'empadre',
        idEntidad: Number(empadreId),
        antes,
        despues: row,
        detalle: `Result ${resultado} on breeding #${empadreId} (female ${hembraId})`,
      });
      return ok(row);
    },

    async getFemaleBreedingProfile({ farmId, hembraId }) {
      let h = await assertAnimal(farmId, hembraId, 'H');
      let animal = h.animal;
      if (h.error) {
        animal = await repository.findHembraAnyState(farmId, hembraId);
        if (!animal) return fail('Female not found', 404);
      }

      const ciclos = await repository.getReproductoraCiclos(hembraId, farmId);
      const partosAll = await repository.getPartosByHembra(hembraId);
      const numPartos = partosAll.length;
      const avgCamada =
        numPartos > 0
          ? partosAll.reduce((s, p) => s + (p.vivos_m || 0) + (p.vivos_h || 0), 0) / numPartos
          : 0;
      const criasDestetadas = partosAll.reduce(
        (s, p) => s + (p.destetados_m || 0) + (p.destetados_h || 0),
        0
      );

      const ciclosOut = ciclos.map((c) => ({
        ...c,
        partos: (c.partos || []).map((p) => ({
          ...p,
          peso_promedio: promedioPesos(
            p.peso_m1,
            p.peso_m2,
            p.peso_m3,
            p.peso_h1,
            p.peso_h2,
            p.peso_h3
          ),
        })),
      }));

      return ok({
        animal,
        ciclos: ciclosOut,
        indicadores: {
          numero_partos: numPartos,
          promedio_camada: Math.round(avgCamada * 100) / 100,
          crias_destetadas: criasDestetadas,
        },
      });
    },

    async getFemalesInCage({ farmId, jaulaId }) {
      return ok(await repository.getHembrasByJaula(jaulaId, farmId));
    },

    async getMaleBreedingProfile({ farmId, machoId }) {
      const macho = await repository.findMacho(farmId, machoId);
      if (!macho) return fail('Male not found', 404);

      const ciclos = await repository.getReproductorCiclos(machoId, farmId);
      let totalEmpadres = ciclos.length;
      let totalPrenadas = 0;
      let totalHembras = 0;
      let sumCamada = 0;
      let nPartos = 0;
      for (const c of ciclos) {
        totalPrenadas += Number(c.prenadas) || 0;
        totalHembras += Number(c.total_hembras) || 0;
        const partos = Array.isArray(c.partos) ? c.partos : [];
        for (const p of partos) {
          sumCamada += Number(p.tamano_camada) || 0;
          nPartos += 1;
        }
      }

      return ok({
        animal: macho,
        empadres: ciclos,
        indicadores: {
          empadres: totalEmpadres,
          porcentaje_prenez:
            totalHembras > 0 ? Math.round((totalPrenadas / totalHembras) * 1000) / 10 : null,
          promedio_camada: nPartos > 0 ? Math.round((sumCamada / nPartos) * 100) / 100 : null,
          partos: nPartos,
        },
      });
    },

    async closeBreeding({ farmId, userId, empadreId, body }) {
      const { id_jaula_retorno } = body || {};
      const emp = await repository.findEmpadre(farmId, empadreId);
      if (!emp) return fail('Breeding record not found', 404);
      if (!emp.id_macho) return fail('Breeding record has no assigned male');
      if (!id_jaula_retorno) return fail('id_jaula_retorno is required');

      const result = await repository.closeBreeding({
        farmId,
        userId,
        emp,
        id_jaula_retorno,
        fecha: todayISO(),
      });
      if (result.error) return fail(result.error);
      await audit.write({
        userId,
        farmId,
        accion: 'editar',
        entidad: 'empadre',
        idEntidad: emp.id,
        despues: result,
        detalle: `Breeding #${emp.id} closed (male → cage ${id_jaula_retorno})`,
      });
      return ok(result);
    },
  };
}

module.exports = { createBreedingsService };
