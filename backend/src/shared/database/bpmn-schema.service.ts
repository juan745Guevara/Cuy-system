import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Ensures the BPMN columns exist in the database.
 * Mirrors the idempotent ALTER TABLE pattern already used by AuditLogService.
 *
 * Each statement runs in isolation so a single failure (e.g. a legacy schema
 * where a referenced table does not exist) never blocks the remaining columns.
 * The cage columns are plain integers on purpose: they are not coupled to a
 * physical FK so the migration works across schemas (`recintos`/`jaulas`).
 */
@Injectable()
export class BpmnSchemaService implements OnModuleInit {
  private readonly logger = new Logger(BpmnSchemaService.name);

  private readonly statements = [
    `ALTER TABLE animales ADD COLUMN IF NOT EXISTS destino_descarte VARCHAR(100)`,
    `ALTER TABLE destetes ADD COLUMN IF NOT EXISTS peso_promedio NUMERIC(10,2)`,
    `ALTER TABLE destetes ADD COLUMN IF NOT EXISTS id_jaula_m INTEGER`,
    `ALTER TABLE destetes ADD COLUMN IF NOT EXISTS id_jaula_h INTEGER`,
    `ALTER TABLE mortalidad ADD COLUMN IF NOT EXISTS tipo VARCHAR(20) DEFAULT 'general'`,
    `ALTER TABLE mortalidad ADD COLUMN IF NOT EXISTS observaciones TEXT`,
    `ALTER TABLE ventas ADD COLUMN IF NOT EXISTS tipo_comprobante VARCHAR(20)`,
    `ALTER TABLE ventas ADD COLUMN IF NOT EXISTS serie VARCHAR(10)`,
    `ALTER TABLE ventas ADD COLUMN IF NOT EXISTS numero VARCHAR(20)`,
    `ALTER TABLE ventas ADD COLUMN IF NOT EXISTS observaciones TEXT`,
    `ALTER TABLE ventas ADD COLUMN IF NOT EXISTS estado VARCHAR(20) DEFAULT 'registrada'`,
  ];

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit(): Promise<void> {
    await this.ensureSchema();
  }

  async ensureSchema(): Promise<{ applied: number; failed: string[] }> {
    let applied = 0;
    const failed: string[] = [];
    for (const statement of this.statements) {
      try {
        await this.prisma.$executeRawUnsafe(statement);
        applied += 1;
      } catch (err) {
        failed.push(statement);
        this.logger.warn(
          `No se pudo aplicar "${statement}": ${(err as Error).message}`,
        );
      }
    }
    if (applied) {
      this.logger.log(`Esquema BPMN verificado (${applied} columnas)`);
    }
    return { applied, failed };
  }
}
