import { Injectable } from '@nestjs/common';
import { ok, fail } from '../../shared/kernel/service-result.kernel';
import { AuditRepository } from '../repositories/audit.repository';
import { SharedDepsService } from '../../shared/deps/shared-deps.service';

@Injectable()
export class AuditService {
  constructor(
    private readonly repository: AuditRepository,
    private readonly sharedDeps: SharedDepsService,
  ) {}

  private get audit() {
    return this.sharedDeps.audit;
  }

  async list(farmId: number, query: Record<string, string>) {
    await this.audit.ensureSchema();
    const rows = await this.repository.list(farmId, {
      entidad: query.entidad,
      idEntidad: query.id_entidad ? Number(query.id_entidad) : null,
    });
    return ok(rows);
  }

  async voidMortality({
    farmId,
    userId,
    id,
    body,
  }: {
    farmId: number;
    userId: number;
    id: number;
    body: Record<string, unknown>;
  }) {
    await this.audit.ensureSchema();
    const { motivo } = body || {};
    if (!(String(motivo || '')).trim()) {
      return fail('void reason is required');
    }
    const before = await this.repository.findMortalidad(id, farmId);
    if (!before) return fail('Record not found', 404);
    if ((before as any).anulado) return fail('Already voided', 409);

    await this.repository.ensureMortalidadAnulacionColumns();
    const row = await this.repository.voidMortality(
      id,
      farmId,
      String(motivo).trim(),
    );
    await this.audit.write({
      userId,
      farmId,
      accion: 'anular',
      entidad: 'mortalidad',
      idEntidad: row!.id,
      antes: before,
      despues: row,
      detalle: String(motivo).trim(),
    });
    return ok(row);
  }

  async voidSale({
    farmId,
    userId,
    id,
    body,
  }: {
    farmId: number;
    userId: number;
    id: number;
    body: Record<string, unknown>;
  }) {
    await this.audit.ensureSchema();
    const { motivo } = body || {};
    if (!(String(motivo || '')).trim()) {
      return fail('void reason is required');
    }
    const before = await this.repository.findVenta(id, farmId);
    if (!before) return fail('Record not found', 404);

    await this.repository.ensureVentasAnulacionColumns();
    if ((before as any).anulado) return fail('Already voided', 409);

    const row = await this.repository.voidSale(id, farmId, String(motivo).trim());
    await this.audit.write({
      userId,
      farmId,
      accion: 'anular',
      entidad: 'venta',
      idEntidad: row!.id,
      antes: before,
      despues: row,
      detalle: String(motivo).trim(),
    });
    return ok(row);
  }
}
