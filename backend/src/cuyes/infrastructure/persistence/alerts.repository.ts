import { AlertsRepositoryPort } from '../../domain/ports/alerts.repository.port';
import { Injectable } from '@nestjs/common';
import { CuyesDepsService } from '../../application/cuyes-deps.service';

export const ALERTS_DEFAULTS = [
  { tipo: 'parto_proximo', dias: 67, activo: true },
  { tipo: 'destete_pendiente', dias: 14, activo: true },
  { tipo: 'empadre_disponible', dias: 7, activo: true },
  { tipo: 'sin_prenez', dias: 30, activo: true },
  { tipo: 'edad_recria', dias: 21, activo: true },
  { tipo: 'edad_empadre', dias: 90, activo: true },
];

@Injectable()
export class AlertsRepository extends AlertsRepositoryPort {
  constructor(private readonly cuyesDeps: CuyesDepsService) { super(); }

  private get db() {
    return this.cuyesDeps.toDeps().db;
  }

  async findConfig(farmId: number) {
    const { rows } = await this.db.query(
      `SELECT * FROM alerta_config WHERE id_granja = $1`,
      [farmId],
    );
    return rows;
  }

  async seedDefaults(farmId: number) {
    for (const d of ALERTS_DEFAULTS) {
      await this.db.query(
        `INSERT INTO alerta_config (id_granja, tipo, dias, activo)
         VALUES ($1,$2,$3,$4) ON CONFLICT (id_granja, tipo) DO NOTHING`,
        [farmId, d.tipo, d.dias, d.activo],
      );
    }
  }

  async upsertConfig(farmId: number, items: Array<Record<string, unknown>>) {
    for (const it of items) {
      await this.db.query(
        `INSERT INTO alerta_config (id_granja, tipo, dias, activo)
         VALUES ($1,$2,$3,$4)
         ON CONFLICT (id_granja, tipo)
         DO UPDATE SET dias = EXCLUDED.dias, activo = EXCLUDED.activo`,
        [farmId, it.tipo, Number(it.dias) || 0, it.activo !== false],
      );
    }
  }

  async findDiscards(farmId: number) {
    const { rows } = await this.db.query(
      `SELECT tipo, id_animal, id_referencia FROM alertas_descarte WHERE id_granja = $1`,
      [farmId],
    );
    return rows;
  }

  async findUpcomingBirths(farmId: number) {
    const { rows } = await this.db.query(
      `SELECT eh.id_hembra, eh.id_empadre, e.fecha_empadre, an.codigo, j.codigo AS jaula
         FROM empadre_hembras eh
         JOIN empadres e ON e.id = eh.id_empadre
         JOIN animales an ON an.id = eh.id_hembra
         LEFT JOIN recintos j ON j.id = an.id_jaula
         WHERE e.id_granja = $1 AND eh.resultado = 'abierto' AND an.estado = 'activo'`,
      [farmId],
    );
    return rows;
  }

  async findPendingWeanings(farmId: number) {
    const { rows } = await this.db.query(
      `SELECT p.id, p.id_hembra, p.fecha_parto, an.codigo, j.codigo AS jaula
         FROM partos p
         JOIN animales an ON an.id = p.id_hembra
         LEFT JOIN recintos j ON j.id = an.id_jaula
         WHERE p.id_granja = $1
           AND NOT EXISTS (SELECT 1 FROM destetes d WHERE d.id_parto = p.id)`,
      [farmId],
    );
    return rows;
  }

  async findWithoutPregnancy(farmId: number) {
    const { rows } = await this.db.query(
      `SELECT eh.id_hembra, eh.id_empadre, e.fecha_empadre, an.codigo, j.codigo AS jaula
         FROM empadre_hembras eh
         JOIN empadres e ON e.id = eh.id_empadre
         JOIN animales an ON an.id = eh.id_hembra
         LEFT JOIN recintos j ON j.id = an.id_jaula
         LEFT JOIN partos p ON p.id_empadre = e.id AND p.id_hembra = eh.id_hembra
         WHERE e.id_granja = $1 AND eh.resultado = 'abierto' AND an.estado = 'activo'
           AND p.id IS NULL`,
      [farmId],
    );
    return rows;
  }

  async findAvailableBreeding(farmId: number) {
    const { rows } = await this.db.query(
      `SELECT an.id AS id_hembra, an.codigo, j.codigo AS jaula,
                MAX(COALESCE(p.fecha_parto, e.fecha_empadre)) AS ultimo_evento
         FROM animales an
         LEFT JOIN recintos j ON j.id = an.id_jaula
         LEFT JOIN categorias c ON c.id = an.id_categoria
         LEFT JOIN empadre_hembras eh ON eh.id_hembra = an.id
         LEFT JOIN empadres e ON e.id = eh.id_empadre
         LEFT JOIN partos p ON p.id_empadre = e.id AND p.id_hembra = an.id
         WHERE an.id_granja = $1 AND an.estado = 'activo' AND an.sexo = 'H'
           AND LOWER(COALESCE(c.nombre,'')) LIKE '%reproductora%'
           AND an.id NOT IN (
             SELECT eh2.id_hembra FROM empadre_hembras eh2
             JOIN empadres e2 ON e2.id = eh2.id_empadre
             WHERE e2.id_granja = $1 AND eh2.resultado = 'abierto'
           )
         GROUP BY an.id, an.codigo, j.codigo
         HAVING MAX(COALESCE(p.fecha_parto, e.fecha_empadre)) IS NOT NULL`,
      [farmId],
    );
    return rows;
  }

  async insertDiscard(params: {
    farmId: number;
    userId: number;
    tipo: string;
    id_animal?: number;
    id_referencia?: number;
    motivo?: string;
  }) {
    const { farmId, userId, tipo, id_animal, id_referencia, motivo } = params;
    const { rows } = await this.db.query(
      `INSERT INTO alertas_descarte (id_granja, tipo, id_animal, id_referencia, motivo, created_by)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [farmId, tipo, id_animal || null, id_referencia || null, motivo || null, userId],
    );
    return rows[0];
  }
}
