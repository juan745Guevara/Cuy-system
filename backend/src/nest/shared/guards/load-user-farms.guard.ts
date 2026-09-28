import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser, UserFarm } from '../auth/auth-user.types';

@Injectable()
export class LoadUserFarmsGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const user = req.user as AuthUser;
    req.userFarms = await this.loadFarms(user);
    return true;
  }

  private async loadFarms(user: AuthUser): Promise<UserFarm[]> {
    if (user.rol === 'superadmin') {
      const rows = await this.prisma.granja.findMany({
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
    }

    const rows = await this.prisma.usuarioGranja.findMany({
      where: {
        id_usuario: user.id,
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
  }
}
