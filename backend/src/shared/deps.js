const { createDatabase } = require('./contracts/database');
const { createAuditLogger } = require('./contracts/auditLogger');
const { createNoOpAreaRules } = require('./species/areaRulesPort');
const { getPrisma } = require('./database/prisma');
const { createSqlBridge } = require('./database/sqlBridge');

/** Shared injectable dependencies for all modules. */
function createSharedDeps(overrides = {}) {
  const prisma = overrides.prisma || getPrisma();
  const db = overrides.db || createSqlBridge(prisma);

  return {
    prisma,
    db,
    audit: createAuditLogger({ ...overrides, prisma }),
    areaRules: overrides.areaRules || createNoOpAreaRules(),
    ...overrides,
  };
}

module.exports = { createSharedDeps, createNoOpAreaRules };
