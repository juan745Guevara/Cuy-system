const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

/** Build DATABASE_URL from legacy DB_* vars when DATABASE_URL is not set. */
function resolveDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

  const user = encodeURIComponent(process.env.DB_USER || 'postgres');
  const password = encodeURIComponent(process.env.DB_PASSWORD || '');
  const host = process.env.DB_HOST || 'localhost';
  const port = process.env.DB_PORT || 5432;
  const database = process.env.DB_NAME || 'cuy_system';

  return `postgresql://${user}:${password}@${host}:${port}/${database}`;
}

let prisma;

function getPrisma() {
  if (!prisma) {
    if (!process.env.DATABASE_URL) {
      process.env.DATABASE_URL = resolveDatabaseUrl();
    }
    prisma = new PrismaClient();
  }
  return prisma;
}

async function disconnectPrisma() {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
  }
}

module.exports = { getPrisma, disconnectPrisma, resolveDatabaseUrl };
