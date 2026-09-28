import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { createSqlBridge } from '../../../shared/database/sqlBridge';
import { createAuditLogger } from '../../../shared/contracts/auditLogger';
import { createNoOpAreaRules } from '../../../shared/species/areaRulesPort';

/** Nest-facing wrapper around legacy shared deps (Prisma + audit + SQL bridge). */
@Injectable()
export class SharedDepsService {
  readonly prisma;
  readonly db;
  readonly audit;
  readonly areaRules;

  constructor(prismaService: PrismaService) {
    this.prisma = prismaService;
    this.db = createSqlBridge(prismaService);
    this.audit = createAuditLogger({ prisma: prismaService });
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
