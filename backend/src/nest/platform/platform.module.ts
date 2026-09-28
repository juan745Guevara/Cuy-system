import { Module } from '@nestjs/common';
import { AuthController } from './presentation/http/auth.controller';
import { UsersController } from './presentation/http/users.controller';
import { FarmsController } from './presentation/http/farms.controller';
import { SpeciesController } from './presentation/http/species.controller';
import { AuditController } from './presentation/http/audit.controller';
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
