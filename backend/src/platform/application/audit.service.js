const { ok, fail } = require('../../shared/kernel/ServiceResult');

function createAuditService({ repository, audit }) {
  return {
    async list(farmId, query) {
      await audit.ensureSchema();
      const rows = await repository.list(farmId, {
        entidad: query.entidad,
        idEntidad: query.id_entidad ? Number(query.id_entidad) : null,
      });
      return ok(rows);
    },

    async voidMortality({ farmId, userId, id, body }) {
      await audit.ensureSchema();
      const { motivo } = body || {};
      if (!(motivo || '').trim()) {
        return fail('void reason is required');
      }
      const before = await repository.findMortalidad(id, farmId);
      if (!before) return fail('Record not found', 404);
      if (before.anulado) return fail('Already voided', 409);

      await repository.ensureMortalidadAnulacionColumns();
      const row = await repository.voidMortality(id, farmId, motivo.trim());
      await audit.write({
        userId,
        farmId,
        accion: 'anular',
        entidad: 'mortalidad',
        idEntidad: row.id,
        antes: before,
        despues: row,
        detalle: motivo.trim(),
      });
      return ok(row);
    },

    async voidSale({ farmId, userId, id, body }) {
      await audit.ensureSchema();
      const { motivo } = body || {};
      if (!(motivo || '').trim()) {
        return fail('void reason is required');
      }
      const before = await repository.findVenta(id, farmId);
      if (!before) return fail('Record not found', 404);

      await repository.ensureVentasAnulacionColumns();
      if (before.anulado) return fail('Already voided', 409);

      const row = await repository.voidSale(id, farmId, motivo.trim());
      await audit.write({
        userId,
        farmId,
        accion: 'anular',
        entidad: 'venta',
        idEntidad: row.id,
        antes: before,
        despues: row,
        detalle: motivo.trim(),
      });
      return ok(row);
    },
  };
}

module.exports = { createAuditService };
