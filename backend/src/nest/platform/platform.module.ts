import { Module } from '@nestjs/common';
import { AuthController } from './presentation/http/auth.controller';
import { UsersController } from './presentation/http/users.controller';
import { FarmsController } from './presentation/http/farms.controller';
import { SpeciesController } from './presentation/http/species.controller';
import { AuditController } from './presentation/http/audit.controller';
import { AreasController } from './presentation/http/areas.controller';
import { RecintosController } from './presentation/http/recintos.controller';
import { platformProviders } from './platform.providers';
import { RECINTOS_SERVICE } from './platform.tokens';

@Module({
  controllers: [
    AuthController,
    UsersController,
    FarmsController,
    SpeciesController,
    AuditController,
    AreasController,
    RecintosController,
  ],
  providers: [...platformProviders],
  // RECINTOS_SERVICE queda disponible para que otros módulos de especie (cuyes, y futuros) lo consuman.
  exports: [RECINTOS_SERVICE],
})
export class PlatformModule {}
