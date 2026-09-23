function createUsersRepository({ prisma }) {
  return {
    async findActiveFarmIds() {
      const rows = await prisma.granja.findMany({
        where: { activa: true },
        select: { id: true },
      });
      return rows.map((r) => r.id);
    },

    async findFarmIdsByUser(userId) {
      const rows = await prisma.usuarioGranja.findMany({
        where: { id_usuario: userId },
        select: { id_granja: true },
      });
      return rows.map((r) => r.id_granja);
    },

    async logEscaladaBloqueada(userId, detalle) {
      await prisma.auditLog.create({
        data: {
          id_usuario: userId,
          accion: 'escalada_bloqueada',
          detalle: JSON.stringify(detalle),
        },
      });
    },

    async createWithGranjas({ nombre, email, passwordHash, rol, createdBy, farmIds }) {
      return prisma.$transaction(async (tx) => {
        const user = await tx.usuario.create({
          data: {
            nombre,
            email,
            password_hash: passwordHash,
            rol,
            created_by: createdBy,
          },
          select: {
            id: true,
            nombre: true,
            email: true,
            rol: true,
            activo: true,
          },
        });

        if (farmIds.length) {
          await tx.usuarioGranja.createMany({
            data: farmIds.map((gid) => ({
              id_usuario: user.id,
              id_granja: gid,
            })),
            skipDuplicates: true,
          });
        }

        return user;
      });
    },

    async listVisible(userRol, userId) {
      const rows = await prisma.$queryRawUnsafe(
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
        userRol,
        userId
      );
      return rows;
    },

    async findById(id) {
      return prisma.usuario.findUnique({ where: { id } });
    },

    async updateWithGranjas({ id, nombre, activo, passwordHash, farmIds }) {
      return prisma.$transaction(async (tx) => {
        const user = await tx.usuario.update({
          where: { id },
          data: {
            ...(nombre != null ? { nombre } : {}),
            ...(typeof activo === 'boolean' ? { activo } : {}),
            ...(passwordHash ? { password_hash: passwordHash } : {}),
          },
          select: {
            id: true,
            nombre: true,
            email: true,
            rol: true,
            activo: true,
          },
        });

        if (Array.isArray(farmIds)) {
          await tx.usuarioGranja.deleteMany({ where: { id_usuario: id } });
          if (farmIds.length) {
            await tx.usuarioGranja.createMany({
              data: farmIds.map((gid) => ({
                id_usuario: id,
                id_granja: gid,
              })),
              skipDuplicates: true,
            });
          }
        }

        return user;
      });
    },

    async findWithGranjas(id) {
      const rows = await prisma.$queryRawUnsafe(
        `SELECT u.id, u.nombre, u.email, u.rol, u.activo,
                COALESCE(json_agg(json_build_object('id', g.id, 'nombre', g.nombre))
                  FILTER (WHERE g.id IS NOT NULL), '[]') AS granjas
         FROM usuarios u
         LEFT JOIN usuario_granjas ug ON ug.id_usuario = u.id
         LEFT JOIN granjas g ON g.id = ug.id_granja
         WHERE u.id = $1 GROUP BY u.id`,
        id
      );
      return rows[0] || null;
    },
  };
}

module.exports = { createUsersRepository };
