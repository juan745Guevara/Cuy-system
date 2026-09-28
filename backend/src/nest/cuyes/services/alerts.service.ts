import { Injectable } from '@nestjs/common';
import { ok, fail } from '../../shared/kernel/service-result.kernel';
import { AlertsRepository } from '../repositories/alerts.repository';
import { CuyesDepsService } from '../cuyes-deps.service';

function addDays(fecha: unknown, dias: number) {
  const d = new Date(`${String(fecha).slice(0, 10)}T00:00:00`);
  d.setDate(d.getDate() + Number(dias));
  return d.toISOString().slice(0, 10);
}

function hoyISO() {
  return new Date().toISOString().slice(0, 10);
}

@Injectable()
export class AlertsService {
  constructor(
    private readonly repository: AlertsRepository,
    private readonly cuyesDeps: CuyesDepsService,
  ) {}

  private get audit() {
    return this.cuyesDeps.toDeps().audit;
  }

  async getConfig(farmId: number) {
    return ok(await this.loadConfig(farmId));
  }

  private async loadConfig(farmId: number) {
    let rows = await this.repository.findConfig(farmId);
    if (!rows.length) {
      await this.repository.seedDefaults(farmId);
      rows = await this.repository.findConfig(farmId);
    }
    return rows;
  }

  async updateConfig({
    farmId,
    userId,
    body,
  }: {
    farmId: number;
    userId: number;
    body: Record<string, unknown> | unknown[];
  }) {
    const items = Array.isArray(body) ? body : (body as Record<string, unknown>)?.items;
    if (!Array.isArray(items)) {
      return fail('Send an array of settings');
    }
    await this.repository.upsertConfig(farmId, items);
    await this.audit.write({
      userId,
      farmId,
      accion: 'configurar',
      entidad: 'alerta',
      idEntidad: farmId,
      despues: items,
      detalle: `Configured ${items.length} alert(s)`,
    });
    return ok(await this.loadConfig(farmId));
  }

  async list(farmId: number) {
    const config = await this.loadConfig(farmId);
    const byTipo = Object.fromEntries(config.map((c) => [c.tipo, c])) as Record<
      string,
      { tipo: string; dias: number; activo: boolean }
    >;
    const hoy = hoyISO();
    const alertas: Array<Record<string, unknown>> = [];

    const descartes = await this.repository.findDescartes(farmId);
    const descartado = (tipo: string, idAnimal: unknown, idRef: unknown) =>
      descartes.some(
        (d: { tipo: string; id_animal: unknown; id_referencia: unknown }) =>
          d.tipo === tipo &&
          Number(d.id_animal || 0) === Number(idAnimal || 0) &&
          Number(d.id_referencia || 0) === Number(idRef || 0),
      );

    const gest = byTipo.parto_proximo;
    if (gest?.activo) {
      const rows = await this.repository.findPartoProximo(farmId);
      for (const r of rows) {
        if (descartado('parto_proximo', r.id_hembra, r.id_empadre)) continue;
        const prevista = addDays(r.fecha_empadre, gest.dias);
        alertas.push({
          key: `parto_proximo-${r.id_hembra}-${r.id_empadre}`,
          tipo: 'parto_proximo',
          id_animal: r.id_hembra,
          id_referencia: r.id_empadre,
          codigo: r.codigo,
          jaula: r.jaula,
          fecha_prevista: prevista,
          vencida: prevista < hoy,
          ruta: '/partos',
          mensaje: `Upcoming birth for ${r.codigo}`,
        });
      }
    }

    const dest = byTipo.destete_pendiente;
    if (dest?.activo) {
      const rows = await this.repository.findDestetePendiente(farmId);
      for (const r of rows) {
        if (descartado('destete_pendiente', r.id_hembra, r.id)) continue;
        const prevista = addDays(r.fecha_parto, dest.dias);
        alertas.push({
          key: `destete_pendiente-${r.id}`,
          tipo: 'destete_pendiente',
          id_animal: r.id_hembra,
          id_referencia: r.id,
          codigo: r.codigo,
          jaula: r.jaula,
          fecha_prevista: prevista,
          vencida: prevista < hoy,
          ruta: '/destetes',
          mensaje: `Pending weaning for litter of ${r.codigo}`,
        });
      }
    }

    const sinP = byTipo.sin_prenez;
    if (sinP?.activo) {
      const rows = await this.repository.findSinPrenez(farmId);
      for (const r of rows) {
        if (descartado('sin_prenez', r.id_hembra, r.id_empadre)) continue;
        const prevista = addDays(r.fecha_empadre, sinP.dias);
        alertas.push({
          key: `sin_prenez-${r.id_hembra}-${r.id_empadre}`,
          tipo: 'sin_prenez',
          id_animal: r.id_hembra,
          id_referencia: r.id_empadre,
          codigo: r.codigo,
          jaula: r.jaula,
          fecha_prevista: prevista,
          vencida: prevista < hoy,
          ruta: '/breeding-females',
          mensaje: `Check pregnancy for ${r.codigo} (breeding unconfirmed)`,
        });
      }
    }

    const empDisp = byTipo.empadre_disponible;
    if (empDisp?.activo) {
      const rows = await this.repository.findEmpadreDisponible(farmId);
      for (const r of rows) {
        if (descartado('empadre_disponible', r.id_hembra, null)) continue;
        const prevista = addDays(r.ultimo_evento, empDisp.dias);
        alertas.push({
          key: `empadre_disponible-${r.id_hembra}`,
          tipo: 'empadre_disponible',
          id_animal: r.id_hembra,
          id_referencia: null,
          codigo: r.codigo,
          jaula: r.jaula,
          fecha_prevista: prevista,
          vencida: prevista < hoy,
          ruta: '/empadres',
          mensaje: `Breeding available for ${r.codigo}`,
        });
      }
    }

    alertas.sort((a, b) =>
      String(a.fecha_prevista).localeCompare(String(b.fecha_prevista)),
    );
    return ok({
      pendientes: alertas,
      vencidas: alertas.filter((a) => a.vencida),
      proximas: alertas.filter((a) => !a.vencida),
    });
  }

  async discard({
    farmId,
    userId,
    body,
  }: {
    farmId: number;
    userId: number;
    body: Record<string, unknown>;
  }) {
    const { tipo, id_animal, id_referencia, motivo } = body || {};
    if (!tipo) return fail('tipo is required');
    const row = await this.repository.insertDescarte({
      farmId,
      userId,
      tipo: String(tipo),
      id_animal: id_animal != null ? Number(id_animal) : undefined,
      id_referencia: id_referencia != null ? Number(id_referencia) : undefined,
      motivo: motivo != null ? String(motivo) : undefined,
    });
    await this.audit.write({
      userId,
      farmId,
      accion: 'discard',
      entidad: 'alerta',
      idEntidad: row.id,
      despues: row,
      detalle: `Alert dismissed ${tipo}${id_animal ? ` for animal ${id_animal}` : ''}`,
    });
    return ok(row, 201);
  }
}
