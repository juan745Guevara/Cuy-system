import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';

@Injectable()
export class FarmsRepository {
  constructor(private readonly prisma: PrismaService) {}

  insert(data: {
    nombre: string;
    id_especie: number;
    ubicacion: string | null;
    responsable: string | null;
    fecha_inicio: string | null;
  }) {
    return this.prisma.granja.create({
      data: {
        nombre: data.nombre,
        id_especie: data.id_especie,
        ubicacion: data.ubicacion,
        responsable: data.responsable,
        fecha_inicio: data.fecha_inicio,
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
