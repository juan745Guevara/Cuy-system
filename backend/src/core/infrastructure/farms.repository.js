function createFarmsRepository({ db }) {
  return {
    async insert(data) {
      const { rows } = await db.query(
        `INSERT INTO granjas (nombre, id_especie, ubicacion, responsable, fecha_inicio)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [data.nombre, data.id_especie, data.ubicacion, data.responsable, data.fecha_inicio]
      );
      return rows[0];
    },

    async deactivate(id) {
      const { rows } = await db.query(
        `UPDATE granjas SET activa = false, updated_at = NOW() WHERE id = $1 RETURNING *`,
        [id]
      );
      return rows[0] || null;
    },

    async assignUsers(farmId, usuarioIds) {
      const client = await db.connect();
      try {
        await client.query('BEGIN');
        await client.query(`DELETE FROM usuario_granjas WHERE id_granja = $1`, [farmId]);
        for (const uid of usuarioIds) {
          await client.query(
            `INSERT INTO usuario_granjas (id_usuario, id_granja) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [uid, farmId]
          );
        }
        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    },
  };
}

module.exports = { createFarmsRepository };
