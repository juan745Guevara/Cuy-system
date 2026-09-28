import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { UsersController } from './users.controller';
import { FarmsController } from './farms.controller';
import { SpeciesController } from './species.controller';
import { AuditController } from './audit.controller';
import { platformProviders } from './platform.providers';

@Module({
  controllers: [
    AuthController,
    UsersController,
    FarmsController,
    SpeciesController,
    AuditController,
  ],
  providers: [...platformProviders],
})
export class PlatformModule {}
