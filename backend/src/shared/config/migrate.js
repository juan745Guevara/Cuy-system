require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool } = require('../database');

async function migrate() {
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await pool.query(sql);
  console.log('Migration OK');
  await pool.end();
}

migrate().catch(async (err) => {
  console.error('Migration failed:', err.message);
  await pool.end();
  process.exit(1);
});
