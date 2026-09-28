const { ok, fail } = require('../../../../shared/kernel/ServiceResult');

function addDays(fecha, dias) {
  const d = new Date(`${String(fecha).slice(0, 10)}T00:00:00`);
  d.setDate(d.getDate() + Number(dias));
  return d.toISOString().slice(0, 10);
}

function hoyISO() {
  return new Date().toISOString().slice(0, 10);
}

function createAlertsService({ repository, audit }) {
  async function getConfig(farmId) {
    let rows = await repository.findConfig(farmId);
    if (!rows.length) {
      await repository.seedDefaults(farmId);
      rows = await repository.findConfig(farmId);
    }
    return rows;
  }

  return {
    async getConfig(farmId) {
      return ok(await getConfig(farmId));
    },

    async updateConfig({ farmId, userId, body }) {
      const items = Array.isArray(body) ? body : body?.items;
      if (!Array.isArray(items)) {
        return fail('Send an array of settings');
      }
      await repository.upsertConfig(farmId, items);
      await audit.write({
        userId,
        farmId,
        accion: 'configurar',
        entidad: 'alerta',
        idEntidad: farmId,
        despues: items,
        detalle: `Configured ${items.length} alert(s)`,
      });
      return ok(await getConfig(farmId));
    },

    async list(farmId) {
      const config = await getConfig(farmId);
      const byTipo = Object.fromEntries(config.map((c) => [c.tipo, c]));
      const hoy = hoyISO();
      const alertas = [];

      const descartes = await repository.findDescartes(farmId);
      const descartado = (tipo, idAnimal, idRef) =>
        descartes.some(
          (d) =>
            d.tipo === tipo &&
            Number(d.id_animal || 0) === Number(idAnimal || 0) &&
            Number(d.id_referencia || 0) === Number(idRef || 0)
        );

      const gest = byTipo.parto_proximo;
      if (gest?.activo) {
        const rows = await repository.findPartoProximo(farmId);
        for (const r of rows) {
          if (descartado('parto_proximo', r.id_hembra, r.id_empadre)) continue;
          const prevista = addDays(r.fecha_empadre, gest.dias);
          alertas.push({
            key: `parto_proximo-${r.id_hembra}-${r.id_empadre}`,
            tipo: 'parto_proximo',
            id_animal: r.id_hembra,
            id_referencia: r.id_empadre,
            codigo: r.codigo,
            jaula: r.jaula,
            fecha_prevista: prevista,
            vencida: prevista < hoy,
            ruta: '/partos',
            mensaje: `Upcoming birth for ${r.codigo}`,
          });
        }
      }

      const dest = byTipo.destete_pendiente;
      if (dest?.activo) {
        const rows = await repository.findDestetePendiente(farmId);
        for (const r of rows) {
          if (descartado('destete_pendiente', r.id_hembra, r.id)) continue;
          const prevista = addDays(r.fecha_parto, dest.dias);
          alertas.push({
            key: `destete_pendiente-${r.id}`,
            tipo: 'destete_pendiente',
            id_animal: r.id_hembra,
            id_referencia: r.id,
            codigo: r.codigo,
            jaula: r.jaula,
            fecha_prevista: prevista,
            vencida: prevista < hoy,
            ruta: '/destetes',
            mensaje: `Pending weaning for litter of ${r.codigo}`,
          });
        }
      }

      const sinP = byTipo.sin_prenez;
      if (sinP?.activo) {
        const rows = await repository.findSinPrenez(farmId);
        for (const r of rows) {
          if (descartado('sin_prenez', r.id_hembra, r.id_empadre)) continue;
          const prevista = addDays(r.fecha_empadre, sinP.dias);
          alertas.push({
            key: `sin_prenez-${r.id_hembra}-${r.id_empadre}`,
            tipo: 'sin_prenez',
            id_animal: r.id_hembra,
            id_referencia: r.id_empadre,
            codigo: r.codigo,
            jaula: r.jaula,
            fecha_prevista: prevista,
            vencida: prevista < hoy,
            ruta: '/breeding-females',
            mensaje: `Check pregnancy for ${r.codigo} (breeding unconfirmed)`,
          });
        }
      }

      const empDisp = byTipo.empadre_disponible;
      if (empDisp?.activo) {
        const rows = await repository.findEmpadreDisponible(farmId);
        for (const r of rows) {
          if (descartado('empadre_disponible', r.id_hembra, null)) continue;
          const prevista = addDays(r.ultimo_evento, empDisp.dias);
          alertas.push({
            key: `empadre_disponible-${r.id_hembra}`,
            tipo: 'empadre_disponible',
            id_animal: r.id_hembra,
            id_referencia: null,
            codigo: r.codigo,
            jaula: r.jaula,
            fecha_prevista: prevista,
            vencida: prevista < hoy,
            ruta: '/empadres',
            mensaje: `Breeding available for ${r.codigo}`,
          });
        }
      }

      alertas.sort((a, b) => String(a.fecha_prevista).localeCompare(String(b.fecha_prevista)));
      return ok({
        pendientes: alertas,
        vencidas: alertas.filter((a) => a.vencida),
        proximas: alertas.filter((a) => !a.vencida),
      });
    },

    async discard({ farmId, userId, body }) {
      const { tipo, id_animal, id_referencia, motivo } = body || {};
      if (!tipo) return fail('tipo is required');
      const row = await repository.insertDescarte({
        farmId,
        userId,
        tipo,
        id_animal,
        id_referencia,
        motivo,
      });
      await audit.write({
        userId,
        farmId,
        accion: 'discard',
        entidad: 'alerta',
        idEntidad: row.id,
        despues: row,
        detalle: `Alert dismissed ${tipo}${id_animal ? ` for animal ${id_animal}` : ''}`,
      });
      return ok(row, 201);
    },
  };
}

module.exports = { createAlertsService };
