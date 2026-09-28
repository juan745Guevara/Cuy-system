import { ReportsRepositoryPort } from '../../domain/ports/reports.repository.port';
import { Injectable } from '@nestjs/common';
import { CuyesDepsService } from '../../application/cuyes-deps.service';

@Injectable()
export class ReportsRepository extends ReportsRepositoryPort {
  constructor(private readonly cuyesDeps: CuyesDepsService) { super(); }

  private get db() {
    return this.cuyesDeps.toDeps().db;
  }

  async getFemales(farmId, idAnimal) {
      const params = [farmId];
      let filter = `a.id_granja = $1 AND a.sexo = 'H'`;
      if (idAnimal) {
        params.push(idAnimal);
        filter += ` AND a.id = $${params.length}`;
      } else {
        filter += ` AND a.estado = 'activo'`;
      }
      const { rows } = await this.db.query(
        `SELECT a.*, r.nombre AS raza, j.codigo AS jaula,
                (SELECT string_agg(ap.texto, '; ' ORDER BY ap.fecha)
                   FROM animal_particularidades ap WHERE ap.id_animal = a.id) AS particularidades
         FROM animales a
         LEFT JOIN razas r ON r.id = a.id_raza
         LEFT JOIN recintos j ON j.id = a.id_jaula
         WHERE ${filter}
         ORDER BY a.codigo`,
        params
      );
      return rows;
    }
  async getFemaleCycles(ids) {
      const { rows } = await this.db.query(
        `SELECT eh.id_hembra, e.id AS id_empadre, e.fecha_empadre, eh.resultado,
                m.codigo AS macho_codigo,
                p.id AS id_parto, p.fecha_parto, p.vivos_m, p.vivos_h, p.muertos,
                p.peso_m1, p.peso_m2, p.peso_m3, p.peso_h1, p.peso_h2, p.peso_h3,
                d.fecha_destete, d.destetados_m, d.destetados_h, d.muertos AS muertos_destete,
                d.peso_m1 AS dm1, d.peso_m2 AS dm2, d.peso_m3 AS dm3,
                d.peso_h1 AS dh1, d.peso_h2 AS dh2, d.peso_h3 AS dh3
         FROM empadre_hembras eh
         JOIN empadres e ON e.id = eh.id_empadre
         LEFT JOIN animales m ON m.id = e.id_macho
         LEFT JOIN partos p ON p.id_empadre = e.id AND p.id_hembra = eh.id_hembra
         LEFT JOIN destetes d ON d.id_parto = p.id
         WHERE eh.id_hembra = ANY($1::int[])
         ORDER BY eh.id_hembra, e.fecha_empadre, p.fecha_parto`,
        [ids]
      );
      return rows;
    }
  async getMales(farmId) {
      const { rows } = await this.db.query(
        `SELECT a.*, r.nombre AS raza,
                (SELECT string_agg(ap.texto, '; ') FROM animal_particularidades ap WHERE ap.id_animal = a.id) AS particularidades
         FROM animales a
         LEFT JOIN razas r ON r.id = a.id_raza
         WHERE a.id_granja = $1 AND a.sexo = 'M' AND a.estado = 'activo'
         ORDER BY a.codigo`,
        [farmId]
      );
      return rows;
    }
  async getMaleBreedings(ids) {
      const { rows } = await this.db.query(
        `SELECT e.*,
                (SELECT string_agg(a.codigo, ', ') FROM empadre_hembras eh
                  JOIN animales a ON a.id = eh.id_hembra WHERE eh.id_empadre = e.id) AS hembras_codigos,
                (SELECT COUNT(*)::int FROM empadre_hembras eh WHERE eh.id_empadre = e.id) AS cant_hembras,
                (SELECT COUNT(*)::int FROM empadre_hembras eh WHERE eh.id_empadre = e.id AND eh.resultado IN ('prenez','abierto')) AS cant_prenadas,
                (SELECT COALESCE(SUM(p.vivos_m+p.vivos_h),0)::int FROM partos p
                  JOIN empadre_hembras eh ON eh.id_empadre = e.id AND p.id_hembra = eh.id_hembra
                  WHERE p.id_empadre = e.id) AS camada,
                (SELECT COALESCE(SUM(p.vivos_m),0)::int FROM partos p WHERE p.id_empadre = e.id) AS nac_m,
                (SELECT COALESCE(SUM(p.vivos_h),0)::int FROM partos p WHERE p.id_empadre = e.id) AS nac_h
         FROM empadres e
         WHERE e.id_macho = ANY($1::int[])
         ORDER BY e.id_macho, e.fecha_empadre`,
        [ids]
      );
      return rows;
    }
  async getActivePopulation(farmId) {
      const { rows } = await this.db.query(
        `SELECT COALESCE(r.nombre,'sin_raza') AS raza,
                COALESCE(c.nombre,'sin_categoria') AS categoria,
                a.sexo, COUNT(*)::int AS n
         FROM animales a
         LEFT JOIN razas r ON r.id = a.id_raza
         LEFT JOIN categorias c ON c.id = a.id_categoria
         WHERE a.id_granja = $1 AND a.estado = 'activo'
         GROUP BY r.nombre, c.nombre, a.sexo`,
        [farmId]
      );
      return rows;
    }
  async getMonthlyBirths(farmId, year, month) {
      const { rows } = await this.db.query(
        `SELECT COALESCE(SUM(vivos_m+vivos_h),0)::int AS n FROM partos
         WHERE id_granja=$1 AND EXTRACT(YEAR FROM fecha_parto)=$2 AND EXTRACT(MONTH FROM fecha_parto)=$3`,
        [farmId, year, month]
      );
      return rows[0].n;
    }
  async getMonthlyMortality(farmId, year, month) {
      const { rows } = await this.db.query(
        `SELECT LOWER(COALESCE(categoria,'')) AS categoria, COALESCE(SUM(cantidad),0)::int AS n
         FROM mortalidad WHERE id_granja=$1
           AND EXTRACT(YEAR FROM fecha)=$2 AND EXTRACT(MONTH FROM fecha)=$3
         GROUP BY LOWER(COALESCE(categoria,''))`,
        [farmId, year, month]
      );
      return rows;
    }
  async getMonthlySales(farmId, year, month) {
      const { rows } = await this.db.query(
        `SELECT LOWER(COALESCE(categoria,'')) AS categoria, COALESCE(SUM(cantidad),0)::int AS n
         FROM ventas WHERE id_granja=$1
           AND EXTRACT(YEAR FROM fecha)=$2 AND EXTRACT(MONTH FROM fecha)=$3
         GROUP BY LOWER(COALESCE(categoria,''))`,
        [farmId, year, month]
      );
      return rows;
    }
  async listAnimalsForExport(farmId, filters) {
      const params = [farmId];
      let sql = `
        SELECT a.codigo, a.sexo, a.estado, a.fecha_nacimiento,
               r.nombre AS raza, c.nombre AS categoria,
               j.codigo AS jaula, ar.nombre AS area
        FROM animales a
        LEFT JOIN razas r ON r.id = a.id_raza
        LEFT JOIN categorias c ON c.id = a.id_categoria
        LEFT JOIN recintos j ON j.id = a.id_jaula
        LEFT JOIN areas ar ON ar.id = j.id_area
        WHERE a.id_granja = $1`;
      if (filters.estado) {
        params.push(filters.estado);
        sql += ` AND a.estado = $${params.length}`;
      }
      if (filters.idArea) {
        params.push(filters.idArea);
        sql += ` AND ar.id = $${params.length}`;
      }
      if (filters.idRaza) {
        params.push(filters.idRaza);
        sql += ` AND r.id = $${params.length}`;
      }
      if (filters.idCategoria) {
        params.push(filters.idCategoria);
        sql += ` AND c.id = $${params.length}`;
      }
      sql += ' ORDER BY ar.nombre, j.codigo, a.codigo';
      const { rows } = await this.db.query(sql, params);
      return rows;
    }
  async getUserFarms(isSuper, userId) {
      const { rows } = await this.db.query(
        `SELECT g.id, g.nombre FROM granjas g
         WHERE $1::boolean
            OR EXISTS (SELECT 1 FROM granja_usuarios gu WHERE gu.id_granja = g.id AND gu.id_usuario = $2)
         ORDER BY g.nombre`,
        [isSuper, userId]
      );
      return rows;
    }
  async getFarmPopulation(farmId) {
      const { rows } = await this.db.query(
        `SELECT COALESCE(c.nombre,'sin_categoria') AS categoria, a.sexo, COUNT(*)::int AS n
         FROM animales a LEFT JOIN categorias c ON c.id = a.id_categoria
         WHERE a.id_granja = $1 AND a.estado = 'activo'
         GROUP BY c.nombre, a.sexo`,
        [farmId]
      );
      return rows;
    }
  async getFarmMetrics(farmId, year, month, mesFilter) {
      const nacParams = mesFilter ? [farmId, year, month] : [farmId, year];
      const nac = await this.db.query(
        `SELECT COALESCE(SUM(vivos_m+vivos_h),0)::int AS n FROM partos
         WHERE id_granja=$1 AND EXTRACT(YEAR FROM fecha_parto)=$2${mesFilter.replace('{{col}}', 'fecha_parto')}`,
        nacParams
      );
      const mort = await this.db.query(
        `SELECT COALESCE(SUM(cantidad),0)::int AS n FROM mortalidad
         WHERE id_granja=$1 AND EXTRACT(YEAR FROM fecha)=$2${mesFilter.replace('{{col}}', 'fecha')}`,
        nacParams
      );
      const vent = await this.db.query(
        `SELECT COALESCE(SUM(cantidad),0)::int AS n FROM ventas
         WHERE id_granja=$1 AND EXTRACT(YEAR FROM fecha)=$2${mesFilter.replace('{{col}}', 'fecha')}`,
        nacParams
      );
      return {
        nacimientos: Number(nac.rows[0].n),
        mortalidad: Number(mort.rows[0].n),
        ventas: Number(vent.rows[0].n)
      };
  }
}
