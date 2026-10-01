import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './shared/prisma/prisma.module';
import { SharedDepsModule } from './shared/deps/shared-deps.module';
import { PlatformModule } from './platform/platform.module';
import { CuyesModule } from './cuyes/cuyes.module';
import { HealthController } from './health.controller';
import { SuperadminScopeGuard } from './shared/guards/superadmin-scope.guard';

@Module({
  imports: [
    ThrottlerModule.forRoot([{ ttl: 900000, limit: 100 }]),
    PrismaModule,
    SharedDepsModule,
    PlatformModule,
    CuyesModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: SuperadminScopeGuard },
  ],
})
export class AppModule {}
