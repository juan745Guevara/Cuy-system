import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { createSqlBridge, SqlBridge } from '../database/sql-bridge';
import { AuditLogService } from '../audit/audit-log.service';
import { createNoOpAreaRules, AreaRulesPort } from '../species/area-rules.port';

/** Nest-facing shared deps (Prisma + audit + SQL bridge). */
@Injectable()
export class SharedDepsService {
  readonly prisma: PrismaService;
  readonly db: SqlBridge;
  readonly audit: AuditLogService;
  readonly areaRules: AreaRulesPort;

  constructor(prismaService: PrismaService, auditLog: AuditLogService) {
    this.prisma = prismaService;
    this.db = createSqlBridge(prismaService);
    this.audit = auditLog;
    this.areaRules = createNoOpAreaRules();
  }

  toDeps() {
    return {
      prisma: this.prisma,
      db: this.db,
      audit: this.audit,
      areaRules: this.areaRules,
    };
  }
}
