import { SpeciesRepositoryPort } from '../../domain/ports/species.repository.port';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';

@Injectable()
export class SpeciesRepository extends SpeciesRepositoryPort {
  constructor(private readonly prisma: PrismaService) { super(); }

  async listActive() {
    const rows = await this.prisma.especie.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' },
      select: { id: true, nombre: true },
    });
    return rows.map((r) => ({ id: r.id, name: r.nombre }));
  }
}
