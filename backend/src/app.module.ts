import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './nest/shared/prisma/prisma.module';
import { SharedDepsModule } from './nest/shared/deps/shared-deps.module';
import { PlatformModule } from './nest/platform/platform.module';
import { CuyesModule } from './nest/cuyes/cuyes.module';
import { HealthController } from './nest/health.controller';

@Module({
  imports: [
    ThrottlerModule.forRoot([{ ttl: 900000, limit: 100 }]),
    PrismaModule,
    SharedDepsModule,
    PlatformModule,
    CuyesModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
