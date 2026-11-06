import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type AuditWriteParams = {
  userId?: number | null;
  farmId?: number | null;
  accion: string;
  entidad?: string | null;
  idEntidad?: number | null;
  antes?: unknown;
  despues?: unknown;
  detalle?: string | null;
};

@Injectable()
/** Escribe en la bitácora `audit_log` (columnas definidas en database/schema.sql). */
export class AuditLogService {
  constructor(private readonly prisma: PrismaService) {}

  async write(params: AuditWriteParams) {
    const {
      userId,
      farmId,
      accion,
      entidad,
      idEntidad,
      antes,
      despues,
      detalle,
    } = params;
    await this.prisma.auditLog.create({
      data: {
        id_usuario: userId || null,
        accion,
        detalle: detalle || null,
        entidad: entidad || null,
        id_entidad: idEntidad ?? null,
        id_granja: farmId || null,
        antes: antes != null ? (antes as object) : undefined,
        despues: despues != null ? (despues as object) : undefined,
      },
    });
  }
}
