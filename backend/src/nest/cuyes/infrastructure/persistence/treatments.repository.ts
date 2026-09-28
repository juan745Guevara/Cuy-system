import { TreatmentsRepositoryPort } from '../../domain/ports/treatments.repository.port';
import { Injectable } from '@nestjs/common';
import { CuyesDepsService } from '../../application/cuyes-deps.service';

@Injectable()
export class TreatmentsRepository extends TreatmentsRepositoryPort {
  constructor(private readonly cuyesDeps: CuyesDepsService) { super(); }

  private get db() {
    return this.cuyesDeps.toDeps().db;
  }

  async getAnimalsByCage(jaulaId: number, farmId: number) {
    const { rows } = await this.db.query(
      `SELECT an.id FROM animales an
         JOIN recintos j ON j.id = an.id_jaula
         JOIN areas a ON a.id = j.id_area
         WHERE j.id = $1 AND a.id_granja = $2 AND an.estado = 'activo'`,
      [jaulaId, farmId],
    );
    return rows.map((r: { id: number }) => r.id);
  }

  async getAnimalsByArea(areaId: number, farmId: number) {
    const { rows } = await this.db.query(
      `SELECT an.id FROM animales an
         JOIN recintos j ON j.id = an.id_jaula
         JOIN areas a ON a.id = j.id_area
         WHERE a.id = $1 AND a.id_granja = $2 AND an.estado = 'activo'`,
      [areaId, farmId],
    );
    return rows.map((r: { id: number }) => r.id);
  }

  async insert(data: {
    farmId: number;
    idAnimal: number | null;
    id_jaula?: number;
    id_area?: number;
    tipo: string;
    producto: string;
    dosis?: string;
    via?: string;
    fecha_inicio: string;
    duracion_dias: number;
    termino: string;
    diagnostico?: string;
    responsable: string | null;
    userId: number;
  }) {
    const { rows } = await this.db.query(
      `INSERT INTO tratamientos
          (id_granja, id_animal, id_jaula, id_area, tipo, producto, dosis, via,
           fecha_inicio, duracion_dias, fecha_termino, diagnostico, responsable, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
      [
        data.farmId,
        data.idAnimal,
        data.id_jaula || null,
        data.id_area || null,
        data.tipo,
        data.producto,
        data.dosis || null,
        data.via || null,
        data.fecha_inicio,
        data.duracion_dias,
        data.termino,
        data.diagnostico || null,
        data.responsable,
        data.userId,
      ],
    );
    return rows[0];
  }

  async list(farmId: number, filters: Record<string, unknown>) {
    const params: unknown[] = [farmId];
    let sql = `
        SELECT t.*, an.codigo, a.nombre AS area, j.codigo AS jaula
        FROM tratamientos t
        LEFT JOIN animales an ON an.id = t.id_animal
        LEFT JOIN areas a ON a.id = t.id_area
        LEFT JOIN recintos j ON j.id = t.id_jaula
        WHERE t.id_granja = $1`;
    if (filters.estado) {
      params.push(filters.estado);
      sql += ` AND t.estado = $${params.length}`;
    }
    if (filters.id_area) {
      params.push(Number(filters.id_area));
      sql += ` AND t.id_area = $${params.length}`;
    }
    if (filters.id_animal) {
      params.push(Number(filters.id_animal));
      sql += ` AND t.id_animal = $${params.length}`;
    }
    sql += ' ORDER BY t.fecha_inicio DESC, t.id DESC';
    const { rows } = await this.db.query(sql, params);
    return rows;
  }

  async listOngoing(farmId: number, idArea: number | null) {
    const params: unknown[] = [farmId];
    let sql = `
        SELECT t.*, an.codigo, a.nombre AS area, j.codigo AS jaula
        FROM tratamientos t
        LEFT JOIN animales an ON an.id = t.id_animal
        LEFT JOIN areas a ON a.id = t.id_area
        LEFT JOIN recintos j ON j.id = t.id_jaula
        WHERE t.id_granja = $1 AND t.estado = 'en_curso'`;
    if (idArea) {
      params.push(Number(idArea));
      sql += ` AND (t.id_area = $${params.length}
          OR EXISTS (
            SELECT 1 FROM recintos jj
            JOIN animales aa ON aa.id_jaula = jj.id
            WHERE aa.id = t.id_animal AND jj.id_area = $${params.length}
          ))`;
    }
    sql += ' ORDER BY t.fecha_termino ASC';
    const { rows } = await this.db.query(sql, params);
    return rows;
  }

  async complete(farmId: number, id: number, motivoCierre?: string) {
    const { rows } = await this.db.query(
      `UPDATE tratamientos
         SET estado = 'terminado', motivo_cierre = $1
         WHERE id = $2 AND id_granja = $3
         RETURNING *`,
      [motivoCierre || null, id, farmId],
    );
    return rows[0] || null;
  }
}
