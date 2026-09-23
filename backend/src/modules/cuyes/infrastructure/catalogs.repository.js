function createCatalogsRepository({ prisma }) {
  return {
    async getEspecieGranja(farmId) {
      const farm = await prisma.granja.findUnique({
        where: { id: farmId },
        select: { id_especie: true },
      });
      return farm?.id_especie;
    },

    async listRazas(idEspecie) {
      return prisma.raza.findMany({
        where: { id_especie: idEspecie, activa: true },
        orderBy: { nombre: 'asc' },
      });
    },

    async insertRaza(idEspecie, nombre) {
      return prisma.raza.create({
        data: { id_especie: idEspecie, nombre: nombre.trim() },
      });
    },

    async listCategorias(idEspecie) {
      return prisma.categoria.findMany({
        where: { id_especie: idEspecie, activa: true },
        orderBy: { nombre: 'asc' },
      });
    },

    async insertCategoria(idEspecie, nombre, areaPurpose) {
      return prisma.categoria.create({
        data: {
          id_especie: idEspecie,
          nombre: nombre.trim(),
          proposito_area: areaPurpose || null,
        },
      });
    },

    async listEspecies() {
      return prisma.especie.findMany({
        where: { activo: true },
        orderBy: { nombre: 'asc' },
      });
    },

    async deactivateRaza(id, idEspecie) {
      const result = await prisma.raza.updateMany({
        where: { id, id_especie: idEspecie },
        data: { activa: false },
      });
      if (!result.count) return null;
      return prisma.raza.findFirst({ where: { id, id_especie: idEspecie } });
    },

    async deactivateCategoria(id, idEspecie) {
      const result = await prisma.categoria.updateMany({
        where: { id, id_especie: idEspecie },
        data: { activa: false },
      });
      if (!result.count) return null;
      return prisma.categoria.findFirst({ where: { id, id_especie: idEspecie } });
    },

    async getAlertaConfig(farmId) {
      return prisma.alertaConfig.findMany({
        where: { id_granja: farmId },
        select: { tipo: true, dias: true },
      });
    },

    async getAnimalesConCategoria(farmId) {
      return prisma.$queryRawUnsafe(
        `SELECT an.id, an.codigo, an.sexo, an.fecha_nacimiento,
                c.nombre AS categoria, j.codigo AS jaula
         FROM animales an
         LEFT JOIN categorias c ON c.id = an.id_categoria
         LEFT JOIN jaulas j ON j.id = an.id_jaula
         WHERE an.id_granja = $1 AND an.estado = 'activo' AND an.fecha_nacimiento IS NOT NULL`,
        farmId
      );
    },
  };
}

module.exports = { createCatalogsRepository };
