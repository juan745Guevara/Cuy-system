const { pool } = require('../database');

/**
 * Registrar cambio con valor anterior/posterior.
 * Extiende audit_log si faltan columnas (idempotente).
 */
let ready = false;

async function ensureAuditSchema() {
  if (ready) return;
  await pool.query(`
    ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS entidad VARCHAR(80);
    ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS id_entidad INTEGER;
    ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS id_granja INTEGER;
    ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS antes JSONB;
    ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS despues JSONB;
  `);
  ready = true;
}

async function writeAudit({
  userId,
  farmId,
  accion,
  entidad,
  idEntidad,
  antes,
  despues,
  detalle,
}) {
  await ensureAuditSchema();
  await pool.query(
    `INSERT INTO audit_log
      (id_usuario, accion, detalle, entidad, id_entidad, id_granja, antes, despues)
     VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8::jsonb)`,
    [
      userId || null,
      accion,
      detalle || null,
      entidad || null,
      idEntidad || null,
      farmId || null,
      antes != null ? JSON.stringify(antes) : null,
      despues != null ? JSON.stringify(despues) : null,
    ]
  );
}

module.exports = { writeAudit, ensureAuditSchema };
