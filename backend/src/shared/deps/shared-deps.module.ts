import { Global, Module } from '@nestjs/common';
import { AuditLogService } from '../audit/audit-log.service';
import { SharedDepsService } from './shared-deps.service';
import { AreaRulesRegistry } from '../species/area-rules-registry.service';
import { SpeciesGuard } from '../guards/species.guard';

@Global()
@Module({
  providers: [AuditLogService, SharedDepsService, AreaRulesRegistry, SpeciesGuard],
  exports: [AuditLogService, SharedDepsService, AreaRulesRegistry, SpeciesGuard],
})
export class SharedDepsModule {}
