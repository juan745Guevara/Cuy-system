function createCagesRepository({ db }) {
  return {
    async list(farmId, idArea) {
      const params = [farmId];
      let sql = `
        SELECT j.*, a.nombre AS area, a.proposito,
               (SELECT COUNT(*)::int FROM animales an
                 WHERE an.id_jaula = j.id AND an.estado = 'activo') AS ocupacion
        FROM jaulas j
        JOIN areas a ON a.id = j.id_area
        WHERE a.id_granja = $1 AND j.activa = true`;
      if (idArea) {
        params.push(Number(idArea));
        sql += ` AND j.id_area = $2`;
      }
      sql += ' ORDER BY a.nombre, j.codigo';
      const { rows } = await db.query(sql, params);
      return rows;
    },

    async ocupacionRows(farmId) {
      const { rows } = await db.query(
        `SELECT a.id AS id_area, a.nombre AS area, a.proposito,
                j.id AS id_jaula, j.codigo AS jaula, j.capacidad_maxima,
                COUNT(an.id)::int AS ocupacion
         FROM areas a
         LEFT JOIN jaulas j ON j.id_area = a.id AND j.activa = true
         LEFT JOIN animales an ON an.id_jaula = j.id AND an.estado = 'activo'
         WHERE a.id_granja = $1 AND a.activa = true
         GROUP BY a.id, a.nombre, a.proposito, j.id, j.codigo, j.capacidad_maxima
         ORDER BY a.nombre, j.codigo`,
        [farmId]
      );
      return rows;
    },

    async findAreaInGranja(farmId, idArea) {
      const { rows } = await db.query(
        `SELECT id FROM areas WHERE id = $1 AND id_granja = $2`,
        [idArea, farmId]
      );
      return rows[0] || null;
    },

    async findDuplicateCodigo(farmId, codigoNorm, excludeId) {
      const params = [farmId, codigoNorm];
      let sql = `
        SELECT j.id FROM jaulas j
        JOIN areas a ON a.id = j.id_area
        WHERE a.id_granja = $1 AND UPPER(REPLACE(j.codigo,' ','')) = $2 AND j.activa = true`;
      if (excludeId) {
        params.push(excludeId);
        sql += ` AND j.id <> $3`;
      }
      const { rows } = await db.query(sql, params);
      return rows[0] || null;
    },

    async insert({ idArea, codigo, capacidadMaxima }) {
      const { rows } = await db.query(
        `INSERT INTO jaulas (id_area, codigo, capacidad_maxima)
         VALUES ($1, $2, $3) RETURNING *`,
        [idArea, codigo, capacidadMaxima || null]
      );
      return rows[0];
    },

    async findInGranja(farmId, id) {
      const { rows } = await db.query(
        `SELECT j.* FROM jaulas j JOIN areas a ON a.id = j.id_area
         WHERE j.id=$1 AND a.id_granja=$2`,
        [id, farmId]
      );
      return rows[0] || null;
    },

    async update({ id, codigo, capacidadMaxima, idArea }) {
      const { rows } = await db.query(
        `UPDATE jaulas SET
           codigo = COALESCE($1, codigo),
           capacidad_maxima = COALESCE($2, capacidad_maxima),
           id_area = COALESCE($3, id_area),
           updated_at = NOW()
         WHERE id = $4 RETURNING *`,
        [codigo, capacidadMaxima ?? null, idArea || null, id]
      );
      return rows[0] || null;
    },

    async deactivate(farmId, id) {
      const { rows } = await db.query(
        `UPDATE jaulas j SET activa=false, updated_at=NOW()
         FROM areas a WHERE j.id_area=a.id AND j.id=$1 AND a.id_granja=$2
         RETURNING j.*`,
        [id, farmId]
      );
      return rows[0] || null;
    },

    async listAnimales(farmId, jaulaId) {
      const { rows } = await db.query(
        `SELECT an.*
         FROM animales an
         JOIN jaulas j ON j.id = an.id_jaula
         JOIN areas a ON a.id = j.id_area
         WHERE j.id = $1 AND a.id_granja = $2 AND an.estado = 'activo'
         ORDER BY an.codigo`,
        [jaulaId, farmId]
      );
      return rows;
    },
  };
}

module.exports = { createCagesRepository };
