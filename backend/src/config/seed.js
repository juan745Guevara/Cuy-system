require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool } = require('./database');

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const hash = await bcrypt.hash('Admin123!', 10);

    const { rows: users } = await client.query(
      `INSERT INTO usuarios (nombre, email, password_hash, rol)
       VALUES
         ('Super Admin', 'superadmin@unas.edu.pe', $1, 'superadmin'),
         ('Admin Granja', 'admin@unas.edu.pe', $1, 'admin'),
         ('Encargado Cuyes', 'encargado@unas.edu.pe', $1, 'encargado')
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
       RETURNING id, email, rol`,
      [hash]
    );

    const { rows: esp } = await client.query(
      `INSERT INTO especies (nombre) VALUES ('cuyes')
       ON CONFLICT (nombre) DO UPDATE SET nombre = EXCLUDED.nombre
       RETURNING id`
    );
    const idEspecie = esp[0].id;

    const razas = [
      'Perú',
      'Andina',
      'Mantaro',
      'Inti',
      'Tipo 2',
      'Tipo 3',
      'Tipo 4',
      'Línea criolla negra',
    ];
    for (const nombre of razas) {
      await client.query(
        `INSERT INTO razas (id_especie, nombre) VALUES ($1, $2)
         ON CONFLICT (id_especie, nombre) DO NOTHING`,
        [idEspecie, nombre]
      );
    }

    const cats = [
      ['gazapo', 'gestacion_maternidad'],
      ['recria', 'recria_hembras'],
      ['reemplazo', 'recria_hembras'],
      ['reproductora', 'empadre'],
      ['reproductor', 'reproductores_machos'],
      ['descarte', 'engorde_descarte'],
    ];
    for (const [nombre, proposito] of cats) {
      await client.query(
        `INSERT INTO categorias (id_especie, nombre, proposito_area)
         VALUES ($1, $2, $3)
         ON CONFLICT (id_especie, nombre) DO UPDATE SET proposito_area = EXCLUDED.proposito_area`,
        [idEspecie, nombre, proposito]
      );
    }

    const { rows: granjas } = await client.query(
      `INSERT INTO granjas (nombre, id_especie, ubicacion, responsable, fecha_inicio)
       VALUES ('Granja Cuyes 1', $1, 'UNAS - Facultad de Zootecnia', 'Encargado Cuyes', CURRENT_DATE)
       ON CONFLICT (nombre) DO UPDATE SET ubicacion = EXCLUDED.ubicacion
       RETURNING id`,
      [idEspecie]
    );
    const idGranja = granjas[0].id;

    const admin = users.find((u) => u.rol === 'admin');
    const encargado = users.find((u) => u.rol === 'encargado');
    for (const u of [admin, encargado].filter(Boolean)) {
      await client.query(
        `INSERT INTO usuario_granjas (id_usuario, id_granja) VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [u.id, idGranja]
      );
    }

    const areasSeed = [
      ['Empadre', 'empadre'],
      ['Maternidad', 'gestacion_maternidad'],
      ['Recría hembras', 'recria_hembras'],
      ['Recría machos', 'recria_machos'],
      ['Machos', 'reproductores_machos'],
      ['Engorde', 'engorde_descarte'],
      ['Cuarentena', 'cuarentena'],
    ];
    for (const [nombre, proposito] of areasSeed) {
      await client.query(
        `INSERT INTO areas (id_granja, nombre, proposito)
         VALUES ($1, $2, $3)
         ON CONFLICT (id_granja, nombre) DO NOTHING`,
        [idGranja, nombre, proposito]
      );
    }

    await client.query('COMMIT');
    console.log('Seed OK');
    console.log('Usuarios: superadmin@unas.edu.pe / Admin123!');
    console.log('          admin@unas.edu.pe / Admin123!');
    console.log('          encargado@unas.edu.pe / Admin123!');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((err) => {
  console.error('Seed falló:', err.message);
  process.exit(1);
});
