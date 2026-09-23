function createAuthRepository({ prisma }) {
  return {
    async findUserByEmail(email) {
      return prisma.usuario.findFirst({
        where: {
          email: { equals: email.trim(), mode: 'insensitive' },
        },
        select: {
          id: true,
          nombre: true,
          email: true,
          password_hash: true,
          rol: true,
          activo: true,
        },
      });
    },

    async findGranjasForSuperadmin() {
      const rows = await prisma.granja.findMany({
        where: { activa: true },
        orderBy: { nombre: 'asc' },
        select: {
          id: true,
          nombre: true,
          id_especie: true,
          especie: { select: { nombre: true } },
        },
      });
      return rows.map((g) => ({
        id: g.id,
        nombre: g.nombre,
        id_especie: g.id_especie,
        especie: g.especie.nombre,
      }));
    },

    async findGranjasForUser(userId) {
      const rows = await prisma.usuarioGranja.findMany({
        where: {
          id_usuario: userId,
          granja: { activa: true },
        },
        orderBy: { granja: { nombre: 'asc' } },
        select: {
          granja: {
            select: {
              id: true,
              nombre: true,
              id_especie: true,
              especie: { select: { nombre: true } },
            },
          },
        },
      });
      return rows.map(({ granja: g }) => ({
        id: g.id,
        nombre: g.nombre,
        id_especie: g.id_especie,
        especie: g.especie.nombre,
      }));
    },

    async logLogin(userId, email) {
      await prisma.auditLog.create({
        data: {
          id_usuario: userId,
          accion: 'login',
          detalle: email,
        },
      });
    },

    async logLogout(userId) {
      await prisma.auditLog.create({
        data: {
          id_usuario: userId,
          accion: 'logout',
          detalle: 'ok',
        },
      });
    },
  };
}

module.exports = { createAuthRepository };
