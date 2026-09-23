function createSpeciesRepository({ prisma }) {
  return {
    async listActive() {
      const rows = await prisma.especie.findMany({
        where: { activo: true },
        orderBy: { nombre: 'asc' },
        select: { id: true, nombre: true },
      });
      return rows.map((r) => ({ id: r.id, name: r.nombre }));
    },
  };
}

module.exports = { createSpeciesRepository };
