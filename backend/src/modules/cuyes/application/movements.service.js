const { ok, fail, fromError } = require('../../../shared/kernel/ServiceResult');

function hoyISO() {
  return new Date().toISOString().slice(0, 10);
}

function createMovementsService({ repository, audit, areaRules }) {
  const isAnimalOutOfArea = areaRules.isAnimalOutOfArea;
  const normalizePurpose = areaRules.normalizePurpose;

  return {
    async relocate({ farmId, userId, body }) {
      const {
        fecha,
        id_jaula_destino,
        motivo,
        ids_animales,
        id_jaula_origen_completa,
        confirmar_capacidad,
        confirmar_area,
      } = body || {};

      if (!fecha || !id_jaula_destino) {
        return fail('date and id_jaula_destino are required');
      }
      if (fecha > hoyISO()) {
        return fail('Date cannot be in the future');
      }

      try {
        const destino = await repository.getJaula(null, id_jaula_destino, farmId);
        if (!destino) return fail('Invalid destination cage in this farm');

        let animalIds = Array.isArray(ids_animales) ? ids_animales.map(Number) : [];
        if (id_jaula_origen_completa) {
          animalIds = await repository.getAnimalesFromJaula(
            null,
            id_jaula_origen_completa,
            farmId
          );
        }
        if (!animalIds.length) return fail('Select at least one animal');

        const animales = await repository.getAnimalesActivos(null, animalIds, farmId);
        if (animales.length !== animalIds.length) {
          return fail('Some animals are not active in this farm');
        }

        for (const a of animales) {
          if (a.fecha_nacimiento && fecha < String(a.fecha_nacimiento).slice(0, 10)) {
            return fail(`Date before birth of ${a.codigo}`);
          }
        }

        const nuevaOcupacion = destino.ocupacion + animales.length;
        const excedio =
          destino.capacidad_maxima != null && nuevaOcupacion > destino.capacidad_maxima;
        if (excedio && !confirmar_capacidad) {
          return fail('Destination cage exceeds capacity', 409, {
            requiere_confirmacion: 'capacidad',
            ocupacion_actual: destino.ocupacion,
            capacidad_maxima: destino.capacidad_maxima,
            a_mover: animales.length,
          });
        }

        const avisosArea = animales.filter((a) =>
          isAnimalOutOfArea(
            { sexo: a.sexo, proposito_area: a.proposito_area },
            destino.proposito
          )
        );
        if (avisosArea.length && !confirmar_area) {
          return fail('Some animals do not match destination area purpose', 409, {
            requiere_confirmacion: 'area',
            animales: avisosArea.map((a) => a.codigo),
            proposito_area: destino.proposito,
            proposito_normalizado: normalizePurpose(destino.proposito),
          });
        }
        if (avisosArea.length && confirmar_area && !(motivo || '').trim()) {
          return fail('Provide a reason when confirming an out-of-area animal', 400, {
            campo: 'motivo',
          });
        }

        const creados = await repository.ejecutarTraslado({
          farmId,
          userId,
          fecha,
          idJaulaDestino: id_jaula_destino,
          motivo,
          animales,
          excedio,
          avisosArea,
        });

        await audit.write({
          userId,
          farmId,
          accion: 'crear',
          entidad: 'movimiento',
          idEntidad: creados[0].id,
          despues: creados,
          detalle: `Relocated ${creados.length} animals to cage ${id_jaula_destino}`,
        });

        return ok(
          {
            trasladados: creados.length,
            excedio_capacidad: excedio,
            movimientos: creados,
          },
          201
        );
      } catch (err) {
        return fromError(err);
      }
    },

    async destinationCages({ farmId, farmIdDestino, user, userFarms }) {
      const idDest = Number(farmIdDestino);
      const enAlcance =
        user.rol === 'superadmin' ||
        (userFarms || []).some((g) => Number(g.id) === idDest);
      if (!enAlcance) return fail('No access to destination farm', 403);

      const origen = await repository.getGranjaEspecie(farmId);
      const dest = await repository.getGranjaActiva(idDest);
      if (!origen || !dest) return fail('Invalid farm');
      if (origen.id_especie !== dest.id_especie) {
        return fail('Destination farm belongs to another species');
      }

      return ok(await repository.listJaulasDestino(idDest));
    },

    async transfer({ farmId, userId, user, userFarms, body }) {
      const {
        fecha,
        id_granja_destino,
        id_jaula_destino,
        ids_animales,
        motivo,
        confirmar_capacidad,
      } = body || {};

      if (!fecha || !id_granja_destino || !id_jaula_destino || !ids_animales?.length) {
        return fail(
          'date, destination farm, destination cage and animal ids are required'
        );
      }
      if (!(motivo || '').trim()) {
        return fail('Transfer reason is required');
      }
      if (fecha > hoyISO()) return fail('Date cannot be in the future');

      const enAlcance =
        user.rol === 'superadmin' ||
        (userFarms || []).some((g) => Number(g.id) === Number(id_granja_destino));
      if (!enAlcance) return fail('No access to destination farm', 403);

      const origen = await repository.getGranjaEspecie(farmId);
      const dest = await repository.getGranjaActiva(id_granja_destino);
      if (!origen || !dest) return fail('Invalid origin or destination farm');
      if (origen.id_especie !== dest.id_especie) {
        return fail('Transfers only allowed between farms of the same species');
      }
      if (Number(id_granja_destino) === Number(farmId)) {
        return fail('Use relocate for moves within the same farm');
      }

      try {
        const jaulaDest = await repository.getJaula(null, id_jaula_destino, id_granja_destino);
        if (!jaulaDest) return fail('Invalid destination cage');

        const animalIds = ids_animales.map(Number);
        const animales = await repository.getAnimalesTransferencia(null, animalIds, farmId);
        if (animales.length !== animalIds.length) {
          return fail('Some animals are not active at origin');
        }

        for (const a of animales) {
          if (a.fecha_nacimiento && fecha < String(a.fecha_nacimiento).slice(0, 10)) {
            return fail(`Date before birth of ${a.codigo}`);
          }
          const clash = await repository.codigoExisteEnGranja(
            null,
            id_granja_destino,
            a.codigo_norm,
            a.id
          );
          if (clash) {
            return fail(`Code ${a.codigo} already exists in destination farm`, 409, {
              codigo: a.codigo,
            });
          }
        }

        const nuevaOcupacion = jaulaDest.ocupacion + animales.length;
        const excedio =
          jaulaDest.capacidad_maxima != null && nuevaOcupacion > jaulaDest.capacidad_maxima;
        if (excedio && !confirmar_capacidad) {
          return fail('Destination cage exceeds capacity', 409, {
            requiere_confirmacion: 'capacidad',
            ocupacion_actual: jaulaDest.ocupacion,
            capacidad_maxima: jaulaDest.capacidad_maxima,
            a_mover: animales.length,
          });
        }

        const creados = await repository.ejecutarTransferencia({
          granjaOrigen: farmId,
          granjaDestino: id_granja_destino,
          userId,
          fecha,
          idJaulaDestino: id_jaula_destino,
          motivo,
          animales,
          excedio,
        });

        await audit.write({
          userId,
          farmId,
          accion: 'crear',
          entidad: 'movimiento',
          idEntidad: creados[0].id,
          despues: creados,
          detalle: `Transferred ${creados.length} animals to farm ${id_granja_destino}`,
        });

        return ok(
          {
            transferidos: creados.length,
            excedio_capacidad: excedio,
            movimientos: creados,
          },
          201
        );
      } catch (err) {
        return fromError(err);
      }
    },

    async animalHistory({ farmId, animalId }) {
      return ok(await repository.historialAnimal(animalId, farmId));
    },

    async cageHistory({ farmId, jaulaId, query }) {
      const fecha = query?.fecha || hoyISO();
      const jaula = await repository.findJaulaEnGranja(jaulaId, farmId);
      if (!jaula) return fail('Cage not found', 404);

      const [actuales, enFecha, historial] = await Promise.all([
        repository.animalesActualesJaula(jaulaId, farmId),
        repository.animalesEnFecha(jaulaId, fecha, farmId),
        repository.historialJaula(jaulaId, fecha, farmId),
      ]);

      return ok({
        fecha,
        jaula,
        actuales,
        en_fecha: enFecha,
        historial,
      });
    },

    async list(farmId) {
      return ok(await repository.listRecientes(farmId));
    },

    async listOvercapacity(farmId) {
      return ok(await repository.listSobrecupo(farmId));
    },

    async listOutOfArea(farmId) {
      const rows = await repository.listAnimalesConArea(farmId);
      return ok(
        rows.filter((r) =>
          isAnimalOutOfArea(
            { sexo: r.sexo, proposito_area: r.proposito_area },
            r.proposito_actual
          )
        )
      );
    },
  };
}

module.exports = { createMovementsService };
