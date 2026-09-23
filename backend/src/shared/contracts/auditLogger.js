const { writeAudit, ensureAuditSchema } = require('../utils/audit');

/** Audit port (ISP — log operations only). */
function createAuditLogger(deps = {}) {
  if (deps.auditLogger) return deps.auditLogger;
  return { write: writeAudit, ensureSchema: ensureAuditSchema };
}

module.exports = { createAuditLogger };
