function createFarmsRepository({ prisma }) {
  return {
    async insert(data) {
      return prisma.granja.create({
        data: {
          nombre: data.nombre,
          id_especie: data.id_especie,
          ubicacion: data.ubicacion,
          responsable: data.responsable,
          fecha_inicio: data.fecha_inicio,
        },
      });
    },

    async deactivate(id) {
      try {
        return await prisma.granja.update({
          where: { id },
          data: { activa: false },
        });
      } catch (err) {
        if (err.code === 'P2025') return null;
        throw err;
      }
    },

    async assignUsers(farmId, usuarioIds) {
      await prisma.$transaction(async (tx) => {
        await tx.usuarioGranja.deleteMany({ where: { id_granja: farmId } });
        if (usuarioIds.length) {
          await tx.usuarioGranja.createMany({
            data: usuarioIds.map((uid) => ({
              id_usuario: uid,
              id_granja: farmId,
            })),
            skipDuplicates: true,
          });
        }
      });
    },
  };
}

module.exports = { createFarmsRepository };
