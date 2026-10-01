import { FarmsRepositoryPort } from '../../domain/ports/farms.repository.port';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';

@Injectable()
export class FarmsRepository extends FarmsRepositoryPort {
  constructor(private readonly prisma: PrismaService) { super(); }

  insert(data: {
    nombre: string;
    id_especie: number;
    ubicacion: string | null;
  }) {
    return this.prisma.granja.create({
      data: {
        nombre: data.nombre,
        id_especie: data.id_especie,
        ubicacion: data.ubicacion,
      },
    });
  }

  findById(id: number) {
    return this.prisma.granja.findUnique({ where: { id } });
  }

  update(id: number, data: { nombre: string; ubicacion: string | null }) {
    return this.prisma.granja.update({ where: { id }, data });
  }

  findByName(nombre: string) {
    return this.prisma.granja.findUnique({ where: { nombre } });
  }

  reactivate(
    id: number,
    data: { ubicacion: string | null },
  ) {
    return this.prisma.granja.update({
      where: { id },
      data: {
        activa: true,
        ubicacion: data.ubicacion,
      },
    });
  }

  async deactivate(id: number) {
    try {
      return await this.prisma.granja.update({
        where: { id },
        data: { activa: false },
      });
    } catch (err: any) {
      if (err.code === 'P2025') return null;
      throw err;
    }
  }

  assignUsers(farmId: number, usuarioIds: number[]) {
    return this.prisma.$transaction(async (tx) => {
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
  }
}
