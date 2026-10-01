import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SpeciesGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const speciesId = Number(
      req.headers['x-species-id'] || req.query?.species_id,
    );
    if (!speciesId) {
      throw new BadRequestException(
        'Provide the active species (header x-species-id)',
      );
    }

    const species = await this.prisma.especie.findFirst({
      where: { id: speciesId, activo: true },
      select: { id: true, nombre: true },
    });
    if (!species) throw new NotFoundException('Species not found');

    req.speciesId = speciesId;
    req.species = species;
    return true;
  }
}
