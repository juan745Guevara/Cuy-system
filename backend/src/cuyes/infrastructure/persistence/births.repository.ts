import { BirthsRepositoryPort } from '../../domain/ports/births.repository.port';
import { Injectable } from '@nestjs/common';
import { CuyesDepsService } from '../../application/cuyes-deps.service';

@Injectable()
export class BirthsRepository extends BirthsRepositoryPort {
  constructor(private readonly cuyesDeps: CuyesDepsService) { super(); }

  private get db() {
    return this.cuyesDeps.toDeps().db;
  }

  private async catId(client: any, farmId: number, nombre: string) {
    const { rows } = await client.query(
      `SELECT c.id FROM categorias c
       JOIN granjas g ON g.id_especie = c.id_especie
       WHERE g.id = $1 AND LOWER(c.nombre) = LOWER($2) AND c.activa = true LIMIT 1`,
      [farmId, nombre],
    );
    return rows[0]?.id || null;
  }

  async findActiveFemale(farmId: number, hembraId: number) {
    const { rows } = await this.db.query(
      `SELECT * FROM animales WHERE id=$1 AND id_granja=$2 AND sexo='H' AND estado='activo'`,
      [hembraId, farmId],
    );
    return rows[0] || null;
  }

  async createBirth(params: {
    farmId: number;
    userId: number;
    data: Record<string, unknown>;
  }) {
    const { farmId, userId, data } = params;
    const client = await this.db.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query(
        `INSERT INTO partos
          (id_granja, id_hembra, id_empadre, fecha_parto, vivos_m, vivos_h, muertos,
           peso_m1, peso_m2, peso_m3, peso_h1, peso_h2, peso_h3, created_by)
         VALUES ($1,$2,$3,$4::date,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
        [
          farmId,
          data.id_hembra,
          data.id_empadre || null,
          data.fecha_parto,
          data.vm,
          data.vh,
          data.mu,
          data.peso_m1 || null,
          data.peso_m2 || null,
          data.peso_m3 || null,
          data.peso_h1 || null,
          data.peso_h2 || null,
          data.peso_h3 || null,
          userId,
        ],
      );
      const parto = rows[0];

      if (data.id_empadre) {
        await client.query(
          `UPDATE empadre_hembras SET resultado = 'prenez'
           WHERE id_empadre = $1 AND id_hembra = $2`,
          [data.id_empadre, data.id_hembra],
        );
      }

      const idGazapo = await this.catId(client, farmId, 'gazapo');
      const madre = data.madre as any;
      const idReproductora = await this.catId(client, farmId, 'reproductora');
      if (idReproductora && madre.id_categoria !== idReproductora) {
        await client.query(
          `UPDATE animales SET id_categoria = $1, updated_at = NOW() WHERE id = $2`,
          [idReproductora, data.id_hembra],
        );
      }

      const normalizeCodigo = data.normalizeCodigo as (c: string) => string;
      const vm = Number(data.vm) || 0;
      const vh = Number(data.vh) || 0;
      const crias: unknown[] = [];
      for (let i = 1; i <= vm; i += 1) {
        const codigo = `${madre.codigo}-P${parto.id}-M${i}`;
        const ins = await client.query(
          `INSERT INTO animales
            (id_granja, codigo, codigo_norm, sexo, id_raza, id_categoria, id_jaula,
             fecha_nacimiento, created_by, id_parto_origen)
           VALUES ($1,$2,$3,'M',$4,$5,$6,$7::date,$8,$9) RETURNING id, codigo, sexo`,
          [
            farmId,
            codigo,
            normalizeCodigo(codigo),
            madre.id_raza,
            idGazapo,
            madre.id_jaula,
            data.fecha_parto,
            userId,
            parto.id,
          ],
        );
        crias.push(ins.rows[0]);
        const pesoCria =
          i === 1 ? data.peso_m1 : i === 2 ? data.peso_m2 : data.peso_m3;
        if (pesoCria && Number(pesoCria) > 0) {
          await client.query(
            `INSERT INTO pesajes (id_granja, id_animal, fecha, peso_gramos, fuera_rango, created_by)
             VALUES ($1,$2,$3::date,$4,false,$5)`,
            [farmId, ins.rows[0].id, data.fecha_parto, Number(pesoCria), userId],
          );
        }
      }
      for (let i = 1; i <= vh; i += 1) {
        const codigo = `${madre.codigo}-P${parto.id}-H${i}`;
        const ins = await client.query(
          `INSERT INTO animales
            (id_granja, codigo, codigo_norm, sexo, id_raza, id_categoria, id_jaula,
             fecha_nacimiento, created_by, id_parto_origen)
           VALUES ($1,$2,$3,'H',$4,$5,$6,$7::date,$8,$9) RETURNING id, codigo, sexo`,
          [
            farmId,
            codigo,
            normalizeCodigo(codigo),
            madre.id_raza,
            idGazapo,
            madre.id_jaula,
            data.fecha_parto,
            userId,
            parto.id,
          ],
        );
        crias.push(ins.rows[0]);
        const pesoCria =
          i === 1 ? data.peso_h1 : i === 2 ? data.peso_h2 : data.peso_h3;
        if (pesoCria && Number(pesoCria) > 0) {
          await client.query(
            `INSERT INTO pesajes (id_granja, id_animal, fecha, peso_gramos, fuera_rango, created_by)
             VALUES ($1,$2,$3::date,$4,false,$5)`,
            [farmId, ins.rows[0].id, data.fecha_parto, Number(pesoCria), userId],
          );
        }
      }

      await client.query('COMMIT');
      return { parto, crias };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async listBirths(farmId: number) {
    const { rows } = await this.db.query(
      `SELECT p.*, a.codigo AS hembra_codigo
       FROM partos p JOIN animales a ON a.id = p.id_hembra
       WHERE p.id_granja = $1
       ORDER BY p.fecha_parto DESC`,
      [farmId],
    );
    return rows;
  }
}
