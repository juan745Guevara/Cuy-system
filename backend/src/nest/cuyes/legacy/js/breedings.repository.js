function createBreedingsRepository({ db }) {
  return {
    async findAnimal(farmId, id, sexo) {
      const { rows } = await db.query(
        `SELECT * FROM animales WHERE id = $1 AND id_granja = $2 AND estado = 'activo'`,
        [id, farmId]
      );
      return rows[0] || null;
    },

    async findHembraAnyState(farmId, id) {
      const { rows } = await db.query(
        `SELECT * FROM animales WHERE id=$1 AND id_granja=$2 AND sexo='H'`,
        [id, farmId]
      );
      return rows[0] || null;
    },

    async findMacho(farmId, id) {
      const { rows } = await db.query(
        `SELECT * FROM animales WHERE id = $1 AND id_granja = $2 AND sexo = 'M'`,
        [id, farmId]
      );
      return rows[0] || null;
    },

    async getLastPartoDate(hembraId) {
      const { rows } = await db.query(
        `SELECT fecha_parto FROM partos WHERE id_hembra=$1 ORDER BY fecha_parto DESC LIMIT 1`,
        [hembraId]
      );
      return rows[0]?.fecha_parto || null;
    },

    async insertReproductor(data) {
      const { rows } = await db.query(
        `INSERT INTO animales
          (id_granja, codigo, codigo_norm, sexo, id_raza, id_categoria, id_jaula, fecha_nacimiento, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
        [
          data.farmId,
          data.codigo,
          data.codigoNorm,
          data.sexo,
          data.id_raza || null,
          data.id_categoria || null,
          data.id_jaula || null,
          data.fecha_nacimiento || null,
          data.userId,
        ]
      );
      return rows[0];
    },

    async insertParticularidad(idAnimal, texto, userId) {
      await db.query(
        `INSERT INTO animal_particularidades (id_animal, texto, created_by) VALUES ($1,$2,$3)`,
        [idAnimal, texto, userId]
      );
    },

    async createEmpadre({ farmId, userId, id_macho, id_jaula, fecha_empadre, peso_antes, peso_despues, hembras, cantPren, notas }) {
      const client = await db.connect();
      try {
        await client.query('BEGIN');
        const { rows } = await client.query(
          `INSERT INTO empadres
            (id_granja, id_macho, id_jaula, fecha_empadre, peso_antes, peso_despues,
             cantidad_hembras, cantidad_prenadas, notas, created_by)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
          [
            farmId,
            id_macho || null,
            id_jaula || null,
            fecha_empadre,
            peso_antes || null,
            peso_despues || null,
            hembras.length,
            cantPren,
            notas || null,
            userId,
          ]
        );
        const emp = rows[0];
        for (const hid of hembras) {
          await client.query(
            `INSERT INTO empadre_hembras (id_empadre, id_hembra) VALUES ($1,$2)`,
            [emp.id, hid]
          );
        }
        if (id_macho) {
          const catRepro = await client.query(
            `SELECT c.id FROM categorias c
             JOIN granjas g ON g.id_especie = c.id_especie
             WHERE g.id = $1 AND LOWER(c.nombre) = 'reproductor' AND c.activa = true LIMIT 1`,
            [farmId]
          );
          if (catRepro.rows[0]) {
            await client.query(
              `UPDATE animales SET id_categoria = $1, updated_at = NOW()
               WHERE id = $2 AND id_granja = $3`,
              [catRepro.rows[0].id, id_macho, farmId]
            );
          }
        }
        await client.query('COMMIT');
        return emp;
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    },

    async listEmpadres(farmId) {
      const { rows } = await db.query(
        `SELECT e.*, m.codigo AS macho_codigo,
                (SELECT COUNT(*)::int FROM empadre_hembras eh WHERE eh.id_empadre = e.id) AS cant_hembras
         FROM empadres e
         LEFT JOIN animales m ON m.id = e.id_macho
         WHERE e.id_granja = $1
         ORDER BY e.fecha_empadre DESC`,
        [farmId]
      );
      return rows;
    },

    async findEmpadreHembra(farmId, empadreId, hembraId) {
      const { rows } = await db.query(
        `SELECT eh.* FROM empadre_hembras eh
         JOIN empadres e ON e.id = eh.id_empadre
         WHERE e.id = $1 AND eh.id_hembra = $2 AND e.id_granja = $3`,
        [empadreId, hembraId, farmId]
      );
      return rows[0] || null;
    },

    async updateEmpadreHembraResultado(farmId, empadreId, hembraId, resultado) {
      const { rows } = await db.query(
        `UPDATE empadre_hembras eh SET resultado = $1
         FROM empadres e
         WHERE eh.id_empadre = e.id AND e.id = $2 AND eh.id_hembra = $3 AND e.id_granja = $4
         RETURNING eh.*`,
        [resultado, empadreId, hembraId, farmId]
      );
      return rows[0] || null;
    },

    async markHembraMuerta({ farmId, hembraId, fechaRes, userId }) {
      const client = await db.connect();
      try {
        await client.query('BEGIN');
        await client.query(
          `UPDATE animales SET estado = 'baja_muerte', fecha_baja = $1,
             motivo_baja = 'Died during breeding cycle', updated_at = NOW()
           WHERE id = $2 AND id_granja = $3`,
          [fechaRes, hembraId, farmId]
        );
        await client.query(
          `INSERT INTO mortalidad
            (id_granja, id_animal, fecha, categoria, cantidad, causa, created_by)
           VALUES ($1,$2,$3,'reproductora',1,'Died during breeding cycle',$4)`,
          [farmId, hembraId, fechaRes, userId]
        );
        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    },

    async getReproductoraCiclos(hembraId, farmId) {
      const { rows } = await db.query(
        `SELECT e.*, eh.resultado, m.codigo AS macho_codigo,
                (SELECT json_agg(json_build_object(
                   'id', p.id, 'fecha_parto', p.fecha_parto,
                   'vivos_m', p.vivos_m, 'vivos_h', p.vivos_h, 'muertos', p.muertos,
                   'peso_m1', p.peso_m1, 'peso_m2', p.peso_m2, 'peso_m3', p.peso_m3,
                   'peso_h1', p.peso_h1, 'peso_h2', p.peso_h2, 'peso_h3', p.peso_h3,
                   'peso_promedio', NULL,
                   'destete', (SELECT json_build_object(
                      'fecha_destete', d.fecha_destete,
                      'destetados_m', d.destetados_m, 'destetados_h', d.destetados_h,
                      'muertos', d.muertos,
                      'peso_m1', d.peso_m1, 'peso_m2', d.peso_m2, 'peso_m3', d.peso_m3,
                      'peso_h1', d.peso_h1, 'peso_h2', d.peso_h2, 'peso_h3', d.peso_h3
                    ) FROM destetes d WHERE d.id_parto = p.id LIMIT 1)
                 ) ORDER BY p.fecha_parto)
                 FROM partos p WHERE p.id_hembra = eh.id_hembra AND (p.id_empadre = e.id OR p.id_empadre IS NULL)) AS partos
         FROM empadre_hembras eh
         JOIN empadres e ON e.id = eh.id_empadre
         LEFT JOIN animales m ON m.id = e.id_macho
         WHERE eh.id_hembra = $1 AND e.id_granja = $2
         ORDER BY e.fecha_empadre DESC`,
        [hembraId, farmId]
      );
      return rows;
    },

    async getPartosByHembra(hembraId) {
      const { rows } = await db.query(
        `SELECT p.*, d.destetados_m, d.destetados_h
         FROM partos p
         LEFT JOIN destetes d ON d.id_parto = p.id
         WHERE p.id_hembra = $1`,
        [hembraId]
      );
      return rows;
    },

    async getHembrasByJaula(jaulaId, farmId) {
      const { rows } = await db.query(
        `SELECT an.id, an.codigo, an.sexo, j.codigo AS jaula, ar.nombre AS area, ar.proposito
         FROM animales an
         JOIN jaulas j ON j.id = an.id_jaula
         JOIN areas ar ON ar.id = j.id_area
         WHERE j.id = $1 AND an.id_granja = $2 AND an.estado = 'activo' AND an.sexo = 'H'
         ORDER BY an.codigo`,
        [jaulaId, farmId]
      );
      return rows;
    },

    async getReproductorCiclos(machoId, farmId) {
      const { rows } = await db.query(
        `SELECT e.id, e.fecha_empadre, e.cantidad_hembras, e.cantidad_prenadas, e.id_jaula,
                j.codigo AS jaula,
                (SELECT COUNT(*)::int FROM empadre_hembras eh
                  WHERE eh.id_empadre = e.id AND eh.resultado = 'prenez') AS prenadas,
                (SELECT COUNT(*)::int FROM empadre_hembras eh WHERE eh.id_empadre = e.id) AS total_hembras,
                COALESCE((
                  SELECT json_agg(json_build_object(
                    'id_parto', p.id,
                    'id_hembra', p.id_hembra,
                    'hembra_codigo', ah.codigo,
                    'fecha_parto', p.fecha_parto,
                    'vivos_m', p.vivos_m,
                    'vivos_h', p.vivos_h,
                    'tamano_camada', COALESCE(p.vivos_m,0)+COALESCE(p.vivos_h,0)
                  ) ORDER BY p.fecha_parto)
                  FROM partos p
                  JOIN animales ah ON ah.id = p.id_hembra
                  WHERE p.id_empadre = e.id
                ), '[]'::json) AS partos
         FROM empadres e
         LEFT JOIN jaulas j ON j.id = e.id_jaula
         WHERE e.id_macho = $1 AND e.id_granja = $2
         ORDER BY e.fecha_empadre DESC`,
        [machoId, farmId]
      );
      return rows;
    },

    async findEmpadre(farmId, id) {
      const { rows } = await db.query(
        `SELECT * FROM empadres WHERE id = $1 AND id_granja = $2`,
        [id, farmId]
      );
      return rows[0] || null;
    },

    async closeBreeding({ farmId, userId, emp, id_jaula_retorno, fecha }) {
      const client = await db.connect();
      try {
        await client.query('BEGIN');
        const jaula = await client.query(
          `SELECT j.id FROM jaulas j
           JOIN areas a ON a.id = j.id_area
           WHERE j.id = $1 AND a.id_granja = $2 AND j.activa = true`,
          [id_jaula_retorno, farmId]
        );
        if (!jaula.rows[0]) {
          await client.query('ROLLBACK');
          return { error: 'Invalid return cage' };
        }
        const macho = await client.query(
          `SELECT id, id_jaula FROM animales WHERE id = $1 AND id_granja = $2`,
          [emp.id_macho, farmId]
        );
        await client.query(
          `UPDATE animales SET id_jaula = $1, updated_at = NOW() WHERE id = $2`,
          [id_jaula_retorno, emp.id_macho]
        );
        await client.query(
          `INSERT INTO movimientos
            (tipo, id_animal, id_granja_origen, id_granja_destino,
             id_jaula_origen, id_jaula_destino, fecha, motivo, created_by)
           VALUES ('relocate',$1,$2,$2,$3,$4,$5,$6,$7)`,
          [
            emp.id_macho,
            farmId,
            macho.rows[0]?.id_jaula || null,
            id_jaula_retorno,
            fecha,
            `Retorno macho tras empadre #${emp.id}`,
            userId,
          ]
        );
        await client.query(
          `UPDATE empadres SET notas = COALESCE(notas,'') || ' [cerrado]', updated_at = NOW()
           WHERE id = $1`,
          [emp.id]
        );
        await client.query('COMMIT');
        return { ok: true, id_empadre: emp.id, id_jaula_retorno };
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    },
  };
}

module.exports = { createBreedingsRepository };
