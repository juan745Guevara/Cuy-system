import { AuthRepositoryPort } from '../../domain/ports/auth.repository.port';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';

@Injectable()
export class AuthRepository extends AuthRepositoryPort {
  constructor(private readonly prisma: PrismaService) { super(); }

  findUserByEmail(email: string) {
    return this.prisma.usuario.findFirst({
      where: {
        email: { equals: email.trim(), mode: 'insensitive' },
      },
      select: {
        id: true,
        nombre: true,
        email: true,
        password_hash: true,
        rol: true,
        activo: true,
      },
    });
  }

  async findFarmsForSuperadmin() {
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

  async findFarmsForUser(userId: number) {
    const rows = await this.prisma.usuarioGranja.findMany({
      where: {
        id_usuario: userId,
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

  logLogin(userId: number, email: string) {
    return this.prisma.auditLog.create({
      data: {
        id_usuario: userId,
        accion: 'login',
        detalle: email,
      },
    });
  }

  logLogout(userId: number) {
    return this.prisma.auditLog.create({
      data: {
        id_usuario: userId,
        accion: 'logout',
        detalle: 'ok',
      },
    });
  }
}
