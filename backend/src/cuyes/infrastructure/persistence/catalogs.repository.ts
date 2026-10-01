import { CatalogsRepositoryPort } from '../../domain/ports/catalogs.repository.port';
import { Injectable } from '@nestjs/common';
import { CuyesDepsService } from '../../application/cuyes-deps.service';

@Injectable()
export class CatalogsRepository extends CatalogsRepositoryPort {
  constructor(private readonly cuyesDeps: CuyesDepsService) { super(); }

  private get prisma() {
    return this.cuyesDeps.toDeps().prisma;
  }

  async getFarmSpecies(farmId: number) {
    const farm = await this.prisma.granja.findUnique({
      where: { id: farmId },
      select: { id_especie: true },
    });
    return farm?.id_especie;
  }

  listBreeds(idEspecie: number) {
    return this.prisma.raza.findMany({
      where: { id_especie: idEspecie, activa: true },
      orderBy: { nombre: 'asc' },
    });
  }

  insertBreed(idEspecie: number, nombre: string) {
    return this.prisma.raza.create({
      data: { id_especie: idEspecie, nombre: nombre.trim() },
    });
  }

  listCategories(idEspecie: number) {
    return this.prisma.categoria.findMany({
      where: { id_especie: idEspecie, activa: true },
      orderBy: { nombre: 'asc' },
    });
  }

  insertCategory(idEspecie: number, nombre: string, areaPurpose?: string) {
    return this.prisma.categoria.create({
      data: {
        id_especie: idEspecie,
        nombre: nombre.trim(),
        proposito_area: areaPurpose || null,
      },
    });
  }

  listSpecies() {
    return this.prisma.especie.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' },
    });
  }

  async deactivateBreed(id: number, idEspecie: number) {
    const result = await this.prisma.raza.updateMany({
      where: { id, id_especie: idEspecie },
      data: { activa: false },
    });
    if (!result.count) return null;
    return this.prisma.raza.findFirst({ where: { id, id_especie: idEspecie } });
  }

  async deactivateCategory(id: number, idEspecie: number) {
    const result = await this.prisma.categoria.updateMany({
      where: { id, id_especie: idEspecie },
      data: { activa: false },
    });
    if (!result.count) return null;
    return this.prisma.categoria.findFirst({
      where: { id, id_especie: idEspecie },
    });
  }

  getAlertConfig(farmId: number) {
    return this.prisma.alertaConfig.findMany({
      where: { id_granja: farmId },
      select: { tipo: true, dias: true },
    });
  }

  getAnimalsWithCategory(farmId: number) {
    return this.prisma.$queryRawUnsafe(
      `SELECT an.id, an.codigo, an.sexo, an.fecha_nacimiento,
              c.nombre AS categoria, j.codigo AS jaula
       FROM animales an
       LEFT JOIN categorias c ON c.id = an.id_categoria
       LEFT JOIN recintos j ON j.id = an.id_jaula
       WHERE an.id_granja = $1 AND an.estado = 'activo' AND an.fecha_nacimiento IS NOT NULL`,
      farmId,
    );
  }
}
