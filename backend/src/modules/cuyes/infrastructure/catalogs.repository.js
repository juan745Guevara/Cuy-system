function createCatalogsRepository({ db }) {
  return {
    async getEspecieGranja(farmId) {
      const { rows } = await db.query(`SELECT id_especie FROM granjas WHERE id = $1`, [farmId]);
      return rows[0]?.id_especie;
    },

    async listRazas(idEspecie) {
      const { rows } = await db.query(
        `SELECT * FROM razas WHERE id_especie = $1 AND activa = true ORDER BY nombre`,
        [idEspecie]
      );
      return rows;
    },

    async insertRaza(idEspecie, nombre) {
      const { rows } = await db.query(
        `INSERT INTO razas (id_especie, nombre) VALUES ($1, $2) RETURNING *`,
        [idEspecie, nombre.trim()]
      );
      return rows[0];
    },

    async listCategorias(idEspecie) {
      const { rows } = await db.query(
        `SELECT * FROM categorias WHERE id_especie = $1 AND activa = true ORDER BY nombre`,
        [idEspecie]
      );
      return rows;
    },

    async insertCategoria(idEspecie, nombre, areaPurpose) {
      const { rows } = await db.query(
        `INSERT INTO categorias (id_especie, nombre, proposito_area) VALUES ($1, $2, $3) RETURNING *`,
        [idEspecie, nombre.trim(), areaPurpose || null]
      );
      return rows[0];
    },

    async listEspecies() {
      const { rows } = await db.query(
        `SELECT * FROM especies WHERE activo = true ORDER BY nombre`
      );
      return rows;
    },

    async deactivateRaza(id, idEspecie) {
      const { rows } = await db.query(
        `UPDATE razas SET activa=false WHERE id=$1 AND id_especie=$2 RETURNING *`,
        [id, idEspecie]
      );
      return rows[0] || null;
    },

    async deactivateCategoria(id, idEspecie) {
      const { rows } = await db.query(
        `UPDATE categorias SET activa=false WHERE id=$1 AND id_especie=$2 RETURNING *`,
        [id, idEspecie]
      );
      return rows[0] || null;
    },

    async getAlertaConfig(farmId) {
      const { rows } = await db.query(
        `SELECT tipo, dias FROM alerta_config WHERE id_granja = $1`,
        [farmId]
      );
      return rows;
    },

    async getAnimalesConCategoria(farmId) {
      const { rows } = await db.query(
        `SELECT an.id, an.codigo, an.sexo, an.fecha_nacimiento,
                c.nombre AS categoria, j.codigo AS jaula
         FROM animales an
         LEFT JOIN categorias c ON c.id = an.id_categoria
         LEFT JOIN jaulas j ON j.id = an.id_jaula
         WHERE an.id_granja = $1 AND an.estado = 'activo' AND an.fecha_nacimiento IS NOT NULL`,
        [farmId]
      );
      return rows;
    },
  };
}

module.exports = { createCatalogsRepository };
