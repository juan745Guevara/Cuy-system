function createUsersRepository({ db }) {
  return {
    async findActiveFarmIds() {
      const { rows } = await db.query(`SELECT id FROM granjas WHERE activa = true`);
      return rows.map((r) => r.id);
    },

    async findFarmIdsByUser(userId) {
      const { rows } = await db.query(
        `SELECT id_granja AS id FROM usuario_granjas WHERE id_usuario = $1`,
        [userId]
      );
      return rows.map((r) => r.id);
    },

    async logEscaladaBloqueada(userId, detalle) {
      await db.query(
        `INSERT INTO audit_log (id_usuario, accion, detalle) VALUES ($1, 'escalada_bloqueada', $2)`,
        [userId, JSON.stringify(detalle)]
      );
    },

    async createWithGranjas({ nombre, email, passwordHash, rol, createdBy, farmIds }) {
      const client = await db.connect();
      try {
        await client.query('BEGIN');
        const { rows } = await client.query(
          `INSERT INTO usuarios (nombre, email, password_hash, rol, created_by)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id, nombre, email, rol, activo`,
          [nombre, email, passwordHash, rol, createdBy]
        );
        const user = rows[0];
        for (const gid of farmIds) {
          await client.query(
            `INSERT INTO usuario_granjas (id_usuario, id_granja) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [user.id, gid]
          );
        }
        await client.query('COMMIT');
        return user;
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    },

    async listVisible(userRol, userId) {
      const { rows } = await db.query(
        `SELECT u.id, u.nombre, u.email, u.rol, u.activo, u.created_by,
                COALESCE(json_agg(json_build_object('id', g.id, 'nombre', g.nombre))
                  FILTER (WHERE g.id IS NOT NULL), '[]') AS granjas
         FROM usuarios u
         LEFT JOIN usuario_granjas ug ON ug.id_usuario = u.id
         LEFT JOIN granjas g ON g.id = ug.id_granja
         WHERE ($1 = 'superadmin') OR (u.rol <> 'superadmin' AND (
           u.created_by = $2 OR u.id IN (
             SELECT ug2.id_usuario FROM usuario_granjas ug2
             WHERE ug2.id_granja IN (SELECT id_granja FROM usuario_granjas WHERE id_usuario = $2)
           )
         ))
         GROUP BY u.id
         ORDER BY u.nombre`,
        [userRol, userId]
      );
      return rows;
    },

    async findById(id) {
      const { rows } = await db.query(`SELECT * FROM usuarios WHERE id = $1`, [id]);
      return rows[0] || null;
    },

    async updateWithGranjas({ id, nombre, activo, passwordHash, farmIds }) {
      const client = await db.connect();
      try {
        await client.query('BEGIN');
        const { rows } = await client.query(
          `UPDATE usuarios SET
             nombre = COALESCE($1, nombre),
             activo = COALESCE($2, activo),
             password_hash = COALESCE($3, password_hash),
             updated_at = NOW()
           WHERE id = $4
           RETURNING id, nombre, email, rol, activo`,
          [nombre || null, typeof activo === 'boolean' ? activo : null, passwordHash, id]
        );
        if (Array.isArray(farmIds)) {
          await client.query(`DELETE FROM usuario_granjas WHERE id_usuario = $1`, [id]);
          for (const gid of farmIds) {
            await client.query(
              `INSERT INTO usuario_granjas (id_usuario, id_granja) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
              [id, gid]
            );
          }
        }
        await client.query('COMMIT');
        return rows[0];
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    },

    async findWithGranjas(id) {
      const { rows } = await db.query(
        `SELECT u.id, u.nombre, u.email, u.rol, u.activo,
                COALESCE(json_agg(json_build_object('id', g.id, 'nombre', g.nombre))
                  FILTER (WHERE g.id IS NOT NULL), '[]') AS granjas
         FROM usuarios u
         LEFT JOIN usuario_granjas ug ON ug.id_usuario = u.id
         LEFT JOIN granjas g ON g.id = ug.id_granja
         WHERE u.id = $1 GROUP BY u.id`,
        [id]
      );
      return rows[0] || null;
    },
  };
}

module.exports = { createUsersRepository };
