import { Pool } from 'pg';
import 'dotenv/config';

function resolveDatabaseUrl(): string {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

  const user = encodeURIComponent(process.env.DB_USER || 'postgres');
  const password = encodeURIComponent(process.env.DB_PASSWORD || '');
  const host = process.env.DB_HOST || 'localhost';
  const port = process.env.DB_PORT || 5432;
  const database = process.env.DB_NAME || 'cuy_system';

  return `postgresql://${user}:${password}@${host}:${port}/${database}`;
}

export function createPgPool() {
  return new Pool({
    connectionString: resolveDatabaseUrl(),
    max: Number(process.env.DB_POOL_MAX || 10),
  });
}
