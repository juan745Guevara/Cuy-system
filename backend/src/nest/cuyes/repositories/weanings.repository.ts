import { Injectable } from '@nestjs/common';
import { CuyesDepsService } from '../cuyes-deps.service';

@Injectable()
export class WeaningsRepository {
  constructor(private readonly cuyesDeps: CuyesDepsService) {}

  private get db() {
    return this.cuyesDeps.toDeps().db;
  }

  private async catId(client: any, farmId: number, nombres: string[]) {
    const { rows } = await client.query(
      `SELECT c.id, c.nombre FROM categorias c
       JOIN granjas g ON g.id_especie = c.id_especie
       WHERE g.id = $1 AND LOWER(c.nombre) = ANY($2::text[]) AND c.activa = true`,
      [farmId, nombres.map((n) => n.toLowerCase())],
    );
    return rows as { id: number; nombre: string }[];
  }

  async findParto(farmId: number, partoId: number) {
    const { rows } = await this.db.query(
      `SELECT * FROM partos WHERE id = $1 AND id_granja = $2`,
      [partoId, farmId],
    );
    return rows[0] || null;
  }

  async createDestete(params: {
    farmId: number;
    userId: number;
    parto: any;
    data: Record<string, unknown>;
  }) {
    const { farmId, userId, parto, data } = params;
    const client = await this.db.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query(
        `INSERT INTO destetes
          (id_parto, fecha_destete, destetados_m, destetados_h, muertos,
           peso_m1, peso_m2, peso_m3, peso_h1, peso_h2, peso_h3, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
        [
          data.id_parto,
          data.fecha_destete,
          data.dm,
          data.dh,
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

      const cats = await this.catId(client, farmId, ['recria', 'reemplazo']);
      const idRecria =
        cats.find((c) => c.nombre.toLowerCase() === 'recria')?.id ||
        cats.find((c) => c.nombre.toLowerCase() === 'reemplazo')?.id ||
        null;

      const gazapos = await client.query(
        `SELECT id, sexo FROM animales
         WHERE id_parto_origen = $1 AND id_granja = $2 AND estado = 'activo'
         ORDER BY sexo, id`,
        [data.id_parto, farmId],
      );

      for (const g of gazapos.rows as any[]) {
        const jaulaDest =
          g.sexo === 'M' ? data.id_jaula_m || null : data.id_jaula_h || null;
        await client.query(
          `UPDATE animales SET
             id_categoria = COALESCE($1, id_categoria),
             id_jaula = COALESCE($2, id_jaula),
             updated_at = NOW()
           WHERE id = $3`,
          [idRecria, jaulaDest, g.id],
        );
      }

      const machos = (gazapos.rows as any[]).filter((g) => g.sexo === 'M');
      const hembras = (gazapos.rows as any[]).filter((g) => g.sexo === 'H');
      const pesosM = [data.peso_m1, data.peso_m2, data.peso_m3].filter(
        (p) => p != null && Number(p) > 0,
      );
      const pesosH = [data.peso_h1, data.peso_h2, data.peso_h3].filter(
        (p) => p != null && Number(p) > 0,
      );
      for (let i = 0; i < Math.min(machos.length, pesosM.length); i += 1) {
        await client.query(
          `INSERT INTO pesajes (id_granja, id_animal, fecha, peso_gramos, fuera_rango, created_by)
           VALUES ($1,$2,$3,$4,false,$5)`,
          [farmId, machos[i].id, data.fecha_destete, Number(pesosM[i]), userId],
        );
      }
      for (let i = 0; i < Math.min(hembras.length, pesosH.length); i += 1) {
        await client.query(
          `INSERT INTO pesajes (id_granja, id_animal, fecha, peso_gramos, fuera_rango, created_by)
           VALUES ($1,$2,$3,$4,false,$5)`,
          [farmId, hembras[i].id, data.fecha_destete, Number(pesosH[i]), userId],
        );
      }

      const mu = Number(data.mu) || 0;
      const dm = Number(data.dm) || 0;
      const dh = Number(data.dh) || 0;
      if (mu > 0) {
        const toKill = (gazapos.rows as any[]).slice(dm + dh);
        for (const g of toKill.slice(0, mu)) {
          await client.query(
            `UPDATE animales SET estado = 'baja_muerte', fecha_baja = $1,
               motivo_baja = 'Muerto al destete', updated_at = NOW()
             WHERE id = $2`,
            [data.fecha_destete, g.id],
          );
        }
        await client.query(
          `INSERT INTO mortalidad
            (id_granja, fecha, clasificacion, categoria, cantidad, causa, created_by)
           VALUES ($1,$2,$3,'gazapo',$4,'Muertos al destete',$5)`,
          [farmId, data.fecha_destete, null, mu, userId],
        );
      }

      await client.query(
        `INSERT INTO animal_particularidades (id_animal, texto, created_by)
         VALUES ($1, $2, $3)`,
        [
          parto.id_hembra,
          `Weaning ${data.fecha_destete}: ${dm}M + ${dh}H (pups → rearing)`,
          userId,
        ],
      );

      await client.query('COMMIT');
      return { destete: rows[0], gazaposCount: (gazapos.rows as any[]).length };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async listDestetes(farmId: number) {
    const { rows } = await this.db.query(
      `SELECT d.*, p.fecha_parto, a.codigo AS hembra_codigo
       FROM destetes d
       JOIN partos p ON p.id = d.id_parto
       JOIN animales a ON a.id = p.id_hembra
       WHERE p.id_granja = $1
       ORDER BY d.fecha_destete DESC`,
      [farmId],
    );
    return rows;
  }
}
