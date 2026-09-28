const RANGOS_DEFAULT = {
  gazapo: { min: 50, max: 250 },
  destete: { min: 150, max: 450 },
  recria: { min: 300, max: 900 },
  reproductora: { min: 700, max: 1600 },
  reproductor: { min: 800, max: 1800 },
  default: { min: 50, max: 2000 },
};

const CATEGORIAS_RANGO = Object.keys(RANGOS_DEFAULT);

function createWeighingsRepository({ db }) {
  return {
    RANGOS_DEFAULT,
    CATEGORIAS_RANGO,
    ESPECIE_ABS: { min: 20, max: 3000 },

    async getRangosRows(farmId) {
      const { rows } = await db.query(
        `SELECT categoria, min, max FROM peso_rangos WHERE id_granja = $1`,
        [farmId]
      );
      return rows;
    },

    async seedRangos(farmId) {
      for (const cat of CATEGORIAS_RANGO) {
        const r = RANGOS_DEFAULT[cat];
        await db.query(
          `INSERT INTO peso_rangos (id_granja, categoria, min, max)
           VALUES ($1,$2,$3,$4) ON CONFLICT (id_granja, categoria) DO NOTHING`,
          [farmId, cat, r.min, r.max]
        );
      }
    },

    async saveRangos(farmId, next, userId) {
      const client = await db.connect();
      try {
        await client.query('BEGIN');
        for (const cat of CATEGORIAS_RANGO) {
          if (!next[cat]) continue;
          await client.query(
            `INSERT INTO peso_rangos (id_granja, categoria, min, max, updated_by, updated_at)
             VALUES ($1,$2,$3,$4,$5,NOW())
             ON CONFLICT (id_granja, categoria) DO UPDATE SET
               min = EXCLUDED.min, max = EXCLUDED.max,
               updated_by = EXCLUDED.updated_by, updated_at = NOW()`,
            [farmId, cat, next[cat].min, next[cat].max, userId || null]
          );
        }
        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    },

    async findAnimal(farmId, animalId) {
      const { rows } = await db.query(
        `SELECT an.*, c.nombre AS categoria
         FROM animales an LEFT JOIN categorias c ON c.id = an.id_categoria
         WHERE an.id = $1 AND an.id_granja = $2`,
        [animalId, farmId]
      );
      return rows[0] || null;
    },

    async insertPesaje(client, data) {
      const q = client || db;
      const { rows } = await q.query(
        `INSERT INTO pesajes (id_granja, id_animal, fecha, peso_gramos, fuera_rango, created_by)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
        [
          data.farmId,
          data.animalId,
          data.fecha,
          data.pesoNum,
          data.fuera,
          data.userId,
        ]
      );
      return rows[0];
    },

    async listByAnimal(animalId, farmId) {
      const { rows } = await db.query(
        `SELECT * FROM pesajes WHERE id_animal = $1 AND id_granja = $2
         ORDER BY fecha ASC, id ASC`,
        [animalId, farmId]
      );
      return rows;
    },

    async promedio(farmId, filters) {
      const params = [farmId];
      let sql = `
        SELECT p.fecha, AVG(p.peso_gramos)::numeric(10,2) AS promedio, COUNT(*)::int AS n
        FROM pesajes p JOIN animales a ON a.id = p.id_animal
        WHERE p.id_granja = $1`;
      if (filters.id_jaula) {
        params.push(Number(filters.id_jaula));
        sql += ` AND a.id_jaula = $${params.length}`;
      }
      if (filters.id_area) {
        params.push(Number(filters.id_area));
        sql += ` AND EXISTS (
          SELECT 1 FROM jaulas j WHERE j.id = a.id_jaula AND j.id_area = $${params.length}
        )`;
      }
      sql += ' GROUP BY p.fecha ORDER BY p.fecha';
      const { rows } = await db.query(sql, params);
      return rows;
    },
  };
}

module.exports = { createWeighingsRepository };
