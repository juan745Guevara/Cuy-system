function createAuthRepository({ db }) {
  return {
    async findUserByEmail(email) {
      const { rows } = await db.query(
        `SELECT id, nombre, email, password_hash, rol, activo
         FROM usuarios WHERE LOWER(email) = LOWER($1)`,
        [email.trim()]
      );
      return rows[0] || null;
    },

    async findGranjasForSuperadmin() {
      const { rows } = await db.query(
        `SELECT g.id, g.nombre, g.id_especie, e.nombre AS especie
         FROM granjas g JOIN especies e ON e.id = g.id_especie
         WHERE g.activa = true ORDER BY g.nombre`
      );
      return rows;
    },

    async findGranjasForUser(userId) {
      const { rows } = await db.query(
        `SELECT g.id, g.nombre, g.id_especie, e.nombre AS especie
         FROM usuario_granjas ug
         JOIN granjas g ON g.id = ug.id_granja
         JOIN especies e ON e.id = g.id_especie
         WHERE ug.id_usuario = $1 AND g.activa = true ORDER BY g.nombre`,
        [userId]
      );
      return rows;
    },

    async logLogin(userId, email) {
      await db.query(
        `INSERT INTO audit_log (id_usuario, accion, detalle) VALUES ($1, 'login', $2)`,
        [userId, email]
      );
    },

    async logLogout(userId) {
      await db.query(
        `INSERT INTO audit_log (id_usuario, accion, detalle) VALUES ($1, 'logout', 'ok')`,
        [userId]
      );
    },
  };
}

module.exports = { createAuthRepository };
