import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser, UserFarm } from '../auth/auth-user.types';

@Injectable()
export class FarmAccessGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const user = req.user as AuthUser;
    const userFarms = (req.userFarms || []) as UserFarm[];

    const farmId = Number(
      req.headers['x-farm-id'] || req.query?.farm_id || req.body?.farm_id,
    );
    if (!farmId) {
      throw new BadRequestException('Provide the active farm (header x-farm-id)');
    }

    const allowed =
      user.rol === 'superadmin' ||
      userFarms.some((g) => Number(g.id) === farmId);
    if (!allowed) throw new ForbiddenException('Farm is outside your scope');

    const farm = await this.prisma.granja.findUnique({
      where: { id: farmId },
      select: { activa: true, id_especie: true },
    });
    if (!farm) throw new NotFoundException('Farm not found');

    if (req.speciesId && Number(farm.id_especie) !== Number(req.speciesId)) {
      throw new ForbiddenException('Farm does not belong to the active species');
    }

    const method = req.method?.toUpperCase();
    const write = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
    if (write && farm.activa === false) {
      throw new ForbiddenException(
        'Farm is deactivated and does not accept new records',
      );
    }

    req.farmId = farmId;
    return true;
  }
}
