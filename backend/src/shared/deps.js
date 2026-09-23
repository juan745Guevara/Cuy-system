const { createDatabase } = require('./contracts/database');
const { createAuditLogger } = require('./contracts/auditLogger');
const { createNoOpAreaRules } = require('./species/areaRulesPort');

/** Shared injectable dependencies for all modules. */
function createSharedDeps(overrides = {}) {
  return {
    db: createDatabase(overrides),
    audit: createAuditLogger(overrides),
    areaRules: overrides.areaRules || createNoOpAreaRules(),
    ...overrides,
  };
}

module.exports = { createSharedDeps, createNoOpAreaRules };
