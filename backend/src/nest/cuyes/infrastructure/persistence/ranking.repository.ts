import { RankingRepositoryPort } from '../../domain/ports/ranking.repository.port';
import { Injectable } from '@nestjs/common';
import { CuyesDepsService } from '../../application/cuyes-deps.service';

@Injectable()
export class RankingRepository extends RankingRepositoryPort {
  constructor(private readonly cuyesDeps: CuyesDepsService) { super(); }

  private get db() {
    return this.cuyesDeps.toDeps().db;
  }

  async findConfig(farmId: number) {
    const { rows } = await this.db.query(
      `SELECT * FROM ranking_config WHERE id_granja = $1`,
      [farmId],
    );
    return rows[0] || null;
  }

  async insertDefaultConfig(farmId: number) {
    const { rows } = await this.db.query(
      `INSERT INTO ranking_config (id_granja) VALUES ($1) RETURNING *`,
      [farmId],
    );
    return rows[0];
  }

  async upsertConfig(farmId: number, cfg: Record<string, number>) {
    const { rows } = await this.db.query(
      `INSERT INTO ranking_config
          (id_granja, peso_partos, peso_camada, peso_destete, peso_mortalidad,
           peso_peso_nac, peso_peso_dest, peso_prenez_macho, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW())
         ON CONFLICT (id_granja) DO UPDATE SET
           peso_partos = EXCLUDED.peso_partos,
           peso_camada = EXCLUDED.peso_camada,
           peso_destete = EXCLUDED.peso_destete,
           peso_mortalidad = EXCLUDED.peso_mortalidad,
           peso_peso_nac = EXCLUDED.peso_peso_nac,
           peso_peso_dest = EXCLUDED.peso_peso_dest,
           peso_prenez_macho = EXCLUDED.peso_prenez_macho,
           updated_at = NOW()
         RETURNING *`,
      [
        farmId,
        cfg.peso_partos,
        cfg.peso_camada,
        cfg.peso_destete,
        cfg.peso_mortalidad,
        cfg.peso_peso_nac,
        cfg.peso_peso_dest,
        cfg.peso_prenez_macho,
      ],
    );
    return rows[0];
  }

  async findRankingHembras(farmId: number, idRaza: number | null, idCategoria: number | null) {
    const { rows } = await this.db.query(
      `SELECT an.id, an.codigo, r.nombre AS raza, c.nombre AS categoria,
                COUNT(p.id)::int AS partos,
                COALESCE(AVG(p.vivos_m + p.vivos_h),0)::numeric(10,2) AS camada_promedio,
                COALESCE(AVG(
                  (SELECT COALESCE(SUM(d.destetados_m+d.destetados_h),0) FROM destetes d WHERE d.id_parto = p.id)
                ),0)::numeric(10,2) AS destete_promedio,
                COALESCE(AVG(
                  (SELECT COALESCE(SUM(d.muertos),0) FROM destetes d WHERE d.id_parto = p.id)
                ),0)::numeric(10,2) AS mortalidad_camada,
                COALESCE(AVG(
                  (COALESCE(p.peso_m1,0)+COALESCE(p.peso_m2,0)+COALESCE(p.peso_m3,0)
                   +COALESCE(p.peso_h1,0)+COALESCE(p.peso_h2,0)+COALESCE(p.peso_h3,0))
                  / NULLIF((p.vivos_m+p.vivos_h),0)
                ),0)::numeric(10,2) AS peso_nac_promedio,
                COALESCE(AVG(
                  (SELECT (COALESCE(d.peso_m1,0)+COALESCE(d.peso_m2,0)+COALESCE(d.peso_m3,0)
                           +COALESCE(d.peso_h1,0)+COALESCE(d.peso_h2,0)+COALESCE(d.peso_h3,0))
                          / NULLIF((d.destetados_m+d.destetados_h),0)
                   FROM destetes d WHERE d.id_parto = p.id
                     AND (d.destetados_m+d.destetados_h) > 0)
                ),0)::numeric(10,2) AS peso_dest_promedio
         FROM animales an
         LEFT JOIN razas r ON r.id = an.id_raza
         LEFT JOIN categorias c ON c.id = an.id_categoria
         LEFT JOIN partos p ON p.id_hembra = an.id
         WHERE an.id_granja = $1 AND an.sexo = 'H' AND an.estado = 'activo'
           AND ($2::int IS NULL OR an.id_raza = $2)
           AND ($3::int IS NULL OR an.id_categoria = $3)
         GROUP BY an.id, an.codigo, r.nombre, c.nombre
         ORDER BY an.codigo`,
      [farmId, idRaza, idCategoria],
    );
    return rows;
  }

  async findRankingMachos(farmId: number, idRaza: number | null, idCategoria: number | null) {
    const { rows } = await this.db.query(
      `SELECT an.id, an.codigo, r.nombre AS raza, c.nombre AS categoria,
                COUNT(DISTINCT e.id)::int AS empadres,
                COUNT(DISTINCT eh.id_hembra)::int AS hembras,
                COUNT(DISTINCT eh.id_hembra) FILTER (WHERE eh.resultado = 'prenez')::int AS prenadas,
                COALESCE(AVG(p.vivos_m + p.vivos_h),0)::numeric(10,2) AS camada_promedio
         FROM animales an
         LEFT JOIN razas r ON r.id = an.id_raza
         LEFT JOIN categorias c ON c.id = an.id_categoria
         LEFT JOIN empadres e ON e.id_macho = an.id
         LEFT JOIN empadre_hembras eh ON eh.id_empadre = e.id
         LEFT JOIN partos p ON p.id_empadre = e.id
         WHERE an.id_granja = $1 AND an.sexo = 'M' AND an.estado = 'activo'
           AND ($2::int IS NULL OR an.id_raza = $2)
           AND ($3::int IS NULL OR an.id_categoria = $3)
         GROUP BY an.id, an.codigo, r.nombre, c.nombre
         ORDER BY an.codigo`,
      [farmId, idRaza, idCategoria],
    );
    return rows;
  }

  async findAnimal(farmId: number, animalId: number) {
    const { rows } = await this.db.query(
      `SELECT * FROM animales WHERE id = $1 AND id_granja = $2`,
      [animalId, farmId],
    );
    return rows[0] || null;
  }

  async markDescarte(animalId: number) {
    const { rows } = await this.db.query(
      `UPDATE animales
         SET estado = 'descarte', fecha_baja = CURRENT_DATE,
             motivo_baja = 'Marcado desde ranking', updated_at = NOW()
         WHERE id = $1 RETURNING *`,
      [animalId],
    );
    return rows[0];
  }

  async findCategoriaReemplazo(farmId: number) {
    const { rows } = await this.db.query(
      `SELECT c.id FROM categorias c
         JOIN granjas g ON g.id_especie = c.id_especie
         WHERE g.id = $1 AND LOWER(c.nombre) LIKE '%reemplazo%'
         LIMIT 1`,
      [farmId],
    );
    return rows[0]?.id || null;
  }

  async markReemplazo(animalId: number, categoriaId: number | null) {
    const { rows } = await this.db.query(
      `UPDATE animales
         SET id_categoria = COALESCE($1, id_categoria), updated_at = NOW()
         WHERE id = $2 RETURNING *`,
      [categoriaId, animalId],
    );
    return rows[0];
  }

  async insertParticularidad(animalId: number, texto: string, userId: number) {
    await this.db.query(
      `INSERT INTO animal_particularidades (id_animal, texto, created_by)
         VALUES ($1, $2, $3)`,
      [animalId, texto, userId],
    );
  }
}
