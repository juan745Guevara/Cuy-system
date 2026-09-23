function createAuditRepository({ db }) {
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
      const { rows } = await db.query(sql, params);
      return rows;
    },

    async findMortalidad(id, farmId) {
      const { rows } = await db.query(
        `SELECT * FROM mortalidad WHERE id = $1 AND id_granja = $2`,
        [id, farmId]
      );
      return rows[0] || null;
    },

    async ensureMortalidadAnulacionColumns() {
      await db.query(`ALTER TABLE mortalidad ADD COLUMN IF NOT EXISTS anulado BOOLEAN DEFAULT false`);
      await db.query(`ALTER TABLE mortalidad ADD COLUMN IF NOT EXISTS motivo_anulacion TEXT`);
    },

    async voidMortality(id, farmId, motivo) {
      const { rows } = await db.query(
        `UPDATE mortalidad SET anulado = true, motivo_anulacion = $1
         WHERE id = $2 AND id_granja = $3 RETURNING *`,
        [motivo, id, farmId]
      );
      return rows[0] || null;
    },

    async findVenta(id, farmId) {
      const { rows } = await db.query(
        `SELECT * FROM ventas WHERE id = $1 AND id_granja = $2`,
        [id, farmId]
      );
      return rows[0] || null;
    },

    async ensureVentasAnulacionColumns() {
      await db.query(`ALTER TABLE ventas ADD COLUMN IF NOT EXISTS anulado BOOLEAN DEFAULT false`);
      await db.query(`ALTER TABLE ventas ADD COLUMN IF NOT EXISTS motivo_anulacion TEXT`);
    },

    async voidSale(id, farmId, motivo) {
      const { rows } = await db.query(
        `UPDATE ventas SET anulado = true, motivo_anulacion = $1
         WHERE id = $2 AND id_granja = $3 RETURNING *`,
        [motivo, id, farmId]
      );
      return rows[0] || null;
    },
  };
}

module.exports = { createAuditRepository };
