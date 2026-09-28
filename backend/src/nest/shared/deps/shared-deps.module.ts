import { Global, Module } from '@nestjs/common';
import { AuditLogService } from '../audit/audit-log.service';
import { SharedDepsService } from './shared-deps.service';

@Global()
@Module({
  providers: [AuditLogService, SharedDepsService],
  exports: [AuditLogService, SharedDepsService],
})
export class SharedDepsModule {}
