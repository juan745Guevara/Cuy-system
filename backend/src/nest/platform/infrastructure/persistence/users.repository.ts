import { UsersRepositoryPort } from '../../domain/ports/users.repository.port';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';

@Injectable()
export class UsersRepository extends UsersRepositoryPort {
  constructor(private readonly prisma: PrismaService) { super(); }

  async findActiveFarmIds() {
    const rows = await this.prisma.granja.findMany({
      where: { activa: true },
      select: { id: true },
    });
    return rows.map((r) => r.id);
  }

  async findFarmIdsByUser(userId: number) {
    const rows = await this.prisma.usuarioGranja.findMany({
      where: { id_usuario: userId },
      select: { id_granja: true },
    });
    return rows.map((r) => r.id_granja);
  }

  logEscaladaBloqueada(userId: number, detalle: Record<string, unknown>) {
    return this.prisma.auditLog.create({
      data: {
        id_usuario: userId,
        accion: 'escalada_bloqueada',
        detalle: JSON.stringify(detalle),
      },
    });
  }

  createWithGranjas(params: {
    nombre: string;
    email: string;
    passwordHash: string;
    rol: string;
    createdBy: number;
    farmIds: number[];
  }) {
    const { nombre, email, passwordHash, rol, createdBy, farmIds } = params;
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.usuario.create({
        data: {
          nombre,
          email,
          password_hash: passwordHash,
          rol,
          created_by: createdBy,
        },
        select: {
          id: true,
          nombre: true,
          email: true,
          rol: true,
          activo: true,
        },
      });

      if (farmIds.length) {
        await tx.usuarioGranja.createMany({
          data: farmIds.map((gid) => ({
            id_usuario: user.id,
            id_granja: gid,
          })),
          skipDuplicates: true,
        });
      }

      return user;
    });
  }

  listVisible(userRol: string, userId: number) {
    return this.prisma.$queryRawUnsafe(
      `SELECT u.id, u.nombre, u.email, u.rol, u.activo, u.created_by,
              COALESCE(json_agg(json_build_object('id', g.id, 'nombre', g.nombre))
                FILTER (WHERE g.id IS NOT NULL), '[]') AS granjas
       FROM usuarios u
       LEFT JOIN usuario_granjas ug ON ug.id_usuario = u.id
       LEFT JOIN granjas g ON g.id = ug.id_granja
       WHERE ($1 = 'superadmin') OR (u.rol <> 'superadmin' AND (
         u.created_by = $2 OR u.id IN (
           SELECT ug2.id_usuario FROM usuario_granjas ug2
           WHERE ug2.id_granja IN (SELECT id_granja FROM usuario_granjas WHERE id_usuario = $2)
         )
       ))
       GROUP BY u.id
       ORDER BY u.nombre`,
      userRol,
      userId,
    );
  }

  findById(id: number) {
    return this.prisma.usuario.findUnique({ where: { id } });
  }

  updateWithGranjas(params: {
    id: number;
    nombre?: string;
    activo?: boolean;
    passwordHash?: string | null;
    farmIds?: number[];
  }) {
    const { id, nombre, activo, passwordHash, farmIds } = params;
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.usuario.update({
        where: { id },
        data: {
          ...(nombre != null ? { nombre } : {}),
          ...(typeof activo === 'boolean' ? { activo } : {}),
          ...(passwordHash ? { password_hash: passwordHash } : {}),
        },
        select: {
          id: true,
          nombre: true,
          email: true,
          rol: true,
          activo: true,
        },
      });

      if (Array.isArray(farmIds)) {
        await tx.usuarioGranja.deleteMany({ where: { id_usuario: id } });
        if (farmIds.length) {
          await tx.usuarioGranja.createMany({
            data: farmIds.map((gid) => ({
              id_usuario: id,
              id_granja: gid,
            })),
            skipDuplicates: true,
          });
        }
      }

      return user;
    });
  }

  async findWithGranjas(id: number) {
    const rows = await this.prisma.$queryRawUnsafe(
      `SELECT u.id, u.nombre, u.email, u.rol, u.activo,
              COALESCE(json_agg(json_build_object('id', g.id, 'nombre', g.nombre))
                FILTER (WHERE g.id IS NOT NULL), '[]') AS granjas
       FROM usuarios u
       LEFT JOIN usuario_granjas ug ON ug.id_usuario = u.id
       LEFT JOIN granjas g ON g.id = ug.id_granja
       WHERE u.id = $1 GROUP BY u.id`,
      id,
    );
    return (rows as any[])[0] || null;
  }
}
