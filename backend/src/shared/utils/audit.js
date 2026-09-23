const { getPrisma } = require('../database/prisma');

/**
 * Registrar cambio con valor anterior/posterior.
 * Extiende audit_log si faltan columnas (idempotente).
 */
let ready = false;

async function ensureAuditSchema(prisma = getPrisma()) {
  if (ready) return;
  await prisma.$executeRawUnsafe(`
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
  const prisma = getPrisma();
  await ensureAuditSchema(prisma);
  await prisma.auditLog.create({
    data: {
      id_usuario: userId || null,
      accion,
      detalle: detalle || null,
      entidad: entidad || null,
      id_entidad: idEntidad || null,
      id_granja: farmId || null,
      antes: antes != null ? antes : undefined,
      despues: despues != null ? despues : undefined,
    },
  });
}

module.exports = { writeAudit, ensureAuditSchema };
