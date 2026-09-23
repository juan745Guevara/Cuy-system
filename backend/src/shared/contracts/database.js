const { getPrisma } = require('../database/prisma');
const { createSqlBridge } = require('../database/sqlBridge');

/**
 * Data access port (DIP).
 * Returns a pg-compatible bridge over Prisma for legacy repositories.
 */
function createDatabase(deps = {}) {
  if (deps.db) return deps.db;
  const prisma = deps.prisma || getPrisma();
  return createSqlBridge(prisma);
}

module.exports = { createDatabase };
