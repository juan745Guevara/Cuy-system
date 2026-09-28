import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';

@Injectable()
export class AuditRepository {
  constructor(private readonly prisma: PrismaService) {}

  list(
    farmId: number,
    filters: { entidad?: string; idEntidad?: number | null },
  ) {
    const params: unknown[] = [farmId];
    let sql = `
      SELECT a.*, u.nombre AS usuario_nombre, u.email AS usuario_email
      FROM audit_log a
      LEFT JOIN usuarios u ON u.id = a.id_usuario
      WHERE (a.id_granja = $1 OR a.id_granja IS NULL)`;
    if (filters.entidad) {
      params.push(filters.entidad);
      sql += ` AND a.entidad = $${params.length}`;
    }
    if (filters.idEntidad) {
      params.push(filters.idEntidad);
      sql += ` AND a.id_entidad = $${params.length}`;
    }
    sql += ' ORDER BY a.created_at DESC LIMIT 200';
    return this.prisma.$queryRawUnsafe(sql, ...params);
  }

  findMortalidad(id: number, farmId: number) {
    return this.prisma.mortalidad.findFirst({
      where: { id, id_granja: farmId },
    });
  }

  ensureMortalidadAnulacionColumns() {
    return Promise.all([
      this.prisma.$executeRawUnsafe(
        `ALTER TABLE mortalidad ADD COLUMN IF NOT EXISTS anulado BOOLEAN DEFAULT false`,
      ),
      this.prisma.$executeRawUnsafe(
        `ALTER TABLE mortalidad ADD COLUMN IF NOT EXISTS motivo_anulacion TEXT`,
      ),
    ]);
  }

  async voidMortality(id: number, farmId: number, motivo: string) {
    const result = await this.prisma.mortalidad.updateMany({
      where: { id, id_granja: farmId },
      data: { anulado: true, motivo_anulacion: motivo },
    });
    if (!result.count) return null;
    return this.prisma.mortalidad.findFirst({
      where: { id, id_granja: farmId },
    });
  }

  findVenta(id: number, farmId: number) {
    return this.prisma.venta.findFirst({
      where: { id, id_granja: farmId },
    });
  }

  ensureVentasAnulacionColumns() {
    return Promise.all([
      this.prisma.$executeRawUnsafe(
        `ALTER TABLE ventas ADD COLUMN IF NOT EXISTS anulado BOOLEAN DEFAULT false`,
      ),
      this.prisma.$executeRawUnsafe(
        `ALTER TABLE ventas ADD COLUMN IF NOT EXISTS motivo_anulacion TEXT`,
      ),
    ]);
  }

  async voidSale(id: number, farmId: number, motivo: string) {
    const result = await this.prisma.venta.updateMany({
      where: { id, id_granja: farmId },
      data: { anulado: true, motivo_anulacion: motivo },
    });
    if (!result.count) return null;
    return this.prisma.venta.findFirst({
      where: { id, id_granja: farmId },
    });
  }
}
