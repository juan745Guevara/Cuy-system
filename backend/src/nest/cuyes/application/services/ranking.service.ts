import { Injectable } from '@nestjs/common';
import { ok, fail } from '../../../shared/kernel/service-result.kernel';
import { RankingRepositoryPort } from '../../domain/ports/ranking.repository.port';
import { CuyesDepsService } from '../cuyes-deps.service';

const DEFAULT_CFG = {
  peso_partos: 20,
  peso_camada: 25,
  peso_destete: 20,
  peso_mortalidad: 15,
  peso_peso_nac: 10,
  peso_peso_dest: 10,
  peso_prenez_macho: 30,
};

@Injectable()
export class RankingService {
  constructor(
    private readonly repository: RankingRepositoryPort,
    private readonly cuyesDeps: CuyesDepsService,
  ) {}

  private get audit() {
    return this.cuyesDeps.toDeps().audit;
  }

  private async getCfg(farmId: number) {
    const row = await this.repository.findConfig(farmId);
    if (row) return row;
    return this.repository.insertDefaultConfig(farmId);
  }

  async getConfig(farmId: number) {
    return ok(await this.getCfg(farmId));
  }

  async updateConfig({
    farmId,
    userId,
    body,
  }: {
    farmId: number;
    userId: number;
    body: Record<string, unknown>;
  }) {
    const b = { ...DEFAULT_CFG, ...(body || {}) } as Record<string, number>;
    const current = await this.getCfg(farmId);
    const row = await this.repository.upsertConfig(farmId, b);
    await this.audit.write({
      userId,
      farmId,
      accion: 'configurar',
      entidad: 'ranking',
      idEntidad: farmId,
      antes: current,
      despues: row,
      detalle: 'Breeding ranking configuration',
    });
    return ok(row);
  }

  async list({ farmId, query }: { farmId: number; query: Record<string, unknown> }) {
    const sexo = (query.sexo as string) || 'H';
    const idRaza = query.id_raza ? Number(query.id_raza) : null;
    const idCategoria = query.id_categoria ? Number(query.id_categoria) : null;
    const cfg = await this.getCfg(farmId);

    if (sexo === 'H') {
      const rows = await this.repository.findRankingHembras(farmId, idRaza, idCategoria);
      const ranked = rows.map((row: Record<string, unknown>) => {
        const insuficientes = (row.partos as number) < 2;
        const score = insuficientes
          ? null
          : Number(row.partos) * Number(cfg.peso_partos) +
            Number(row.camada_promedio) * Number(cfg.peso_camada) +
            Number(row.destete_promedio) * Number(cfg.peso_destete) -
            Number(row.mortalidad_camada) * Number(cfg.peso_mortalidad) +
            Number(row.peso_nac_promedio) * Number(cfg.peso_peso_nac) +
            Number(row.peso_dest_promedio) * Number(cfg.peso_peso_dest);
        return {
          ...row,
          puntaje: score == null ? null : Number(score.toFixed(2)),
          datos_insuficientes: insuficientes,
        };
      });
      ranked.sort((a, b) => {
        if (a.datos_insuficientes !== b.datos_insuficientes) {
          return a.datos_insuficientes ? 1 : -1;
        }
        return (b.puntaje || 0) - (a.puntaje || 0);
      });
      return ok({ sexo: 'H', config: cfg, ranking: ranked });
    }

    const rows = await this.repository.findRankingMachos(farmId, idRaza, idCategoria);
    const ranked = rows.map((row: Record<string, unknown>) => {
      const insuficientes = (row.empadres as number) < 2;
      const pctPrenez =
        (row.hembras as number) > 0
          ? (100 * Number(row.prenadas)) / Number(row.hembras)
          : 0;
      const score = insuficientes
        ? null
        : pctPrenez * Number(cfg.peso_prenez_macho) +
          Number(row.camada_promedio) * Number(cfg.peso_camada) +
          Number(row.empadres) * Number(cfg.peso_partos);
      return {
        ...row,
        pct_prenez: Number(pctPrenez.toFixed(1)),
        puntaje: score == null ? null : Number(score.toFixed(2)),
        datos_insuficientes: insuficientes,
      };
    });
    ranked.sort((a, b) => {
      if (a.datos_insuficientes !== b.datos_insuficientes) {
        return a.datos_insuficientes ? 1 : -1;
      }
      return (b.puntaje || 0) - (a.puntaje || 0);
    });
    return ok({ sexo: 'M', config: cfg, ranking: ranked });
  }

  async mark({
    farmId,
    userId,
    animalId,
    body,
  }: {
    farmId: number;
    userId: number;
    animalId: number;
    body: Record<string, unknown>;
  }) {
    const { accion } = body || {};
    if (!['descarte', 'reemplazo'].includes(String(accion))) {
      return fail('accion must be descarte or reemplazo');
    }

    const animal = await this.repository.findAnimal(farmId, animalId);
    if (!animal) return fail('Animal not found', 404);

    if (accion === 'descarte') {
      const row = await this.repository.markDescarte(animalId);
      await this.repository.insertParticularidad(
        animalId,
        'Marked for discard from ranking',
        userId,
      );
      await this.audit.write({
        userId,
        farmId,
        accion: 'discard',
        entidad: 'animal',
        idEntidad: row.id,
        antes: animal,
        despues: row,
        detalle: `Marked for discard from ranking (${row.codigo})`,
      });
      return ok(row);
    }

    const catId = await this.repository.findCategoriaReemplazo(farmId);
    const row = await this.repository.markReemplazo(animalId, catId);
    await this.repository.insertParticularidad(
      animalId,
      'Marked as replacement from ranking',
      userId,
    );
    await this.audit.write({
      userId,
      farmId,
      accion: 'editar',
      entidad: 'animal',
      idEntidad: row.id,
      antes: animal,
      despues: row,
      detalle: `Marked as replacement from ranking (${row.codigo})`,
    });
    return ok(row);
  }
}
