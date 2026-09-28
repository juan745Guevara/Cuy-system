import fs from 'fs';
import { createPgPool } from './pg-pool';

async function migrate() {
  const pool = createPgPool();
  const sql = fs.readFileSync(
    `${process.cwd()}/database/schema.sql`,
    'utf8',
  );
  try {
    await pool.query(sql);
    console.log('Migration OK');
  } finally {
    await pool.end();
  }
}

migrate().catch(async (err: Error) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
