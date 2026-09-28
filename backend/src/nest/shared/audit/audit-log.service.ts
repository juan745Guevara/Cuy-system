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
export class AuditLogService {
  private ready = false;

  constructor(private readonly prisma: PrismaService) {}

  async ensureSchema() {
    if (this.ready) return;
    // Prisma's raw executor (unlike node-pg) rejects multiple ;-separated
    // statements in a single prepared call, so each ALTER runs on its own.
    const statements = [
      `ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS entidad VARCHAR(80)`,
      `ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS id_entidad INTEGER`,
      `ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS id_granja INTEGER`,
      `ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS antes JSONB`,
      `ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS despues JSONB`,
    ];
    for (const statement of statements) {
      await this.prisma.$executeRawUnsafe(statement);
    }
    this.ready = true;
  }

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
    await this.ensureSchema();
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
