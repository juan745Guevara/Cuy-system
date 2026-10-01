import { RecintosRepositoryPort } from '../../domain/ports/recintos.repository.port';
import { Injectable } from '@nestjs/common';
import { SharedDepsService } from '../../../shared/deps/shared-deps.service';

/** Núcleo: contenedor genérico de la granja (jaula, corral, poza, etc. según la especie); el área es opcional. */
@Injectable()
export class RecintosRepository extends RecintosRepositoryPort {
  constructor(private readonly sharedDeps: SharedDepsService) {
    super();
  }

  private get db() {
    return this.sharedDeps.db;
  }

  async list(farmId: number, idArea: number | null) {
    const params: unknown[] = [farmId];
    let sql = `
        SELECT j.*, a.nombre AS area, a.proposito,
               (SELECT COUNT(*)::int FROM animales an
                 WHERE an.id_jaula = j.id AND an.estado = 'activo') AS ocupacion
        FROM recintos j
        LEFT JOIN areas a ON a.id = j.id_area
        WHERE j.id_granja = $1 AND j.activa = true`;
    if (idArea) {
      params.push(Number(idArea));
      sql += ` AND j.id_area = $2`;
    }
    sql += ' ORDER BY a.nombre NULLS LAST, j.codigo';
    const { rows } = await this.db.query(sql, params);
    return rows;
  }

  async occupancyRows(farmId: number) {
    const { rows } = await this.db.query(
      `SELECT a.id AS id_area, a.nombre AS area, a.proposito,
                j.id AS id_jaula, j.codigo AS jaula, j.capacidad_maxima,
                COUNT(an.id)::int AS ocupacion
         FROM areas a
         LEFT JOIN recintos j ON j.id_area = a.id AND j.activa = true
         LEFT JOIN animales an ON an.id_jaula = j.id AND an.estado = 'activo'
         WHERE a.id_granja = $1 AND a.activa = true
         GROUP BY a.id, a.nombre, a.proposito, j.id, j.codigo, j.capacidad_maxima
         ORDER BY a.nombre, j.codigo`,
      [farmId],
    );
    return rows;
  }

  async findAreaInFarm(farmId: number, idArea: number) {
    const { rows } = await this.db.query(
      `SELECT id FROM areas WHERE id = $1 AND id_granja = $2 AND activa = true`,
      [idArea, farmId],
    );
    return rows[0] || null;
  }

  async findDuplicateCode(farmId: number, codigoNorm: string, excludeId?: number) {
    const params: unknown[] = [farmId, codigoNorm];
    let sql = `
        SELECT j.id FROM recintos j
        WHERE j.id_granja = $1 AND UPPER(REPLACE(j.codigo,' ','')) = $2 AND j.activa = true`;
    if (excludeId) {
      params.push(excludeId);
      sql += ` AND j.id <> $3`;
    }
    const { rows } = await this.db.query(sql, params);
    return rows[0] || null;
  }

  async insert(params: {
    farmId: number;
    idArea: number | null;
    codigo: string;
    capacidadMaxima?: unknown;
  }) {
    const { farmId, idArea, codigo, capacidadMaxima } = params;
    const { rows } = await this.db.query(
      `INSERT INTO recintos (id_granja, id_area, codigo, capacidad_maxima)
         VALUES ($1, $2, $3, $4) RETURNING *`,
      [farmId, idArea, codigo, capacidadMaxima || null],
    );
    return rows[0];
  }

  async findInFarm(farmId: number, id: number) {
    const { rows } = await this.db.query(
      `SELECT j.* FROM recintos j WHERE j.id = $1 AND j.id_granja = $2`,
      [id, farmId],
    );
    return rows[0] || null;
  }

  /** `idArea`: undefined = no cambiar, null = quitar del área. */
  async update(params: {
    id: number;
    codigo: string | null;
    capacidadMaxima: unknown;
    idArea: number | null | undefined;
  }) {
    const { id, codigo, capacidadMaxima, idArea } = params;
    const { rows } = await this.db.query(
      `UPDATE recintos SET
           codigo = COALESCE($1, codigo),
           capacidad_maxima = COALESCE($2, capacidad_maxima),
           id_area = CASE WHEN $3::boolean THEN $4::int ELSE id_area END,
           updated_at = NOW()
         WHERE id = $5 RETURNING *`,
      [codigo, capacidadMaxima ?? null, idArea !== undefined, idArea ?? null, id],
    );
    return rows[0] || null;
  }

  async deactivate(farmId: number, id: number) {
    const { rows } = await this.db.query(
      `UPDATE recintos SET activa = false, updated_at = NOW()
         WHERE id = $1 AND id_granja = $2
         RETURNING *`,
      [id, farmId],
    );
    return rows[0] || null;
  }

  async listAnimals(farmId: number, jaulaId: number) {
    const { rows } = await this.db.query(
      `SELECT an.*
         FROM animales an
         JOIN recintos j ON j.id = an.id_jaula
         WHERE j.id = $1 AND j.id_granja = $2 AND an.estado = 'activo'
         ORDER BY an.codigo`,
      [jaulaId, farmId],
    );
    return rows;
  }
}
