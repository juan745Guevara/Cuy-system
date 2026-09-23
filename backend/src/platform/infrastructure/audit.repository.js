function createAuditRepository({ prisma }) {
  return {
    async list(farmId, filters) {
      const params = [farmId];
      let sql = `
        SELECT a.*, u.nombre AS usuario_nombre, u.email AS usuario_email
        FROM audit_log a
        LEFT JOIN usuarios u ON u.id = a.id_usuario
        WHERE (a.id_granja = $1 OR a.id_granja IS NULL)`;
      if (filters.entidad) {
        params.push(filters.entidad);
        sql += ` AND a.entidad = $${params.length}`;
      }
      if (filters.idEntidad) {
        params.push(filters.idEntidad);
        sql += ` AND a.id_entidad = $${params.length}`;
      }
      sql += ' ORDER BY a.created_at DESC LIMIT 200';
      return prisma.$queryRawUnsafe(sql, ...params);
    },

    async findMortalidad(id, farmId) {
      return prisma.mortalidad.findFirst({
        where: { id, id_granja: farmId },
      });
    },

    async ensureMortalidadAnulacionColumns() {
      await prisma.$executeRawUnsafe(
        `ALTER TABLE mortalidad ADD COLUMN IF NOT EXISTS anulado BOOLEAN DEFAULT false`
      );
      await prisma.$executeRawUnsafe(
        `ALTER TABLE mortalidad ADD COLUMN IF NOT EXISTS motivo_anulacion TEXT`
      );
    },

    async voidMortality(id, farmId, motivo) {
      const result = await prisma.mortalidad.updateMany({
        where: { id, id_granja: farmId },
        data: { anulado: true, motivo_anulacion: motivo },
      });
      if (!result.count) return null;
      return prisma.mortalidad.findFirst({ where: { id, id_granja: farmId } });
    },

    async findVenta(id, farmId) {
      return prisma.venta.findFirst({
        where: { id, id_granja: farmId },
      });
    },

    async ensureVentasAnulacionColumns() {
      await prisma.$executeRawUnsafe(
        `ALTER TABLE ventas ADD COLUMN IF NOT EXISTS anulado BOOLEAN DEFAULT false`
      );
      await prisma.$executeRawUnsafe(
        `ALTER TABLE ventas ADD COLUMN IF NOT EXISTS motivo_anulacion TEXT`
      );
    },

    async voidSale(id, farmId, motivo) {
      const result = await prisma.venta.updateMany({
        where: { id, id_granja: farmId },
        data: { anulado: true, motivo_anulacion: motivo },
      });
      if (!result.count) return null;
      return prisma.venta.findFirst({ where: { id, id_granja: farmId } });
    },
  };
}

module.exports = { createAuditRepository };
