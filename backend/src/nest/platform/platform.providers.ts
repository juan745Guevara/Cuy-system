import { Provider, Type } from '@nestjs/common';
import {
  AREAS_SERVICE,
  AUTH_SERVICE,
  AUDIT_SERVICE,
  FARMS_SERVICE,
  SPECIES_SERVICE,
  USERS_SERVICE,
} from './platform.tokens';
import { AreasService } from './application/services/areas.service';
import { AreasRepositoryPort } from './domain/ports/areas.repository.port';
import { AreasRepository } from './infrastructure/persistence/areas.repository';
import { AuthService } from './application/services/auth.service';
import { UsersService } from './application/services/users.service';
import { FarmsService } from './application/services/farms.service';
import { SpeciesService } from './application/services/species.service';
import { AuditService } from './application/services/audit.service';
import { AuthRepositoryPort } from './domain/ports/auth.repository.port';
import { AuthRepository } from './infrastructure/persistence/auth.repository';
import { UsersRepositoryPort } from './domain/ports/users.repository.port';
import { UsersRepository } from './infrastructure/persistence/users.repository';
import { FarmsRepositoryPort } from './domain/ports/farms.repository.port';
import { FarmsRepository } from './infrastructure/persistence/farms.repository';
import { SpeciesRepositoryPort } from './domain/ports/species.repository.port';
import { SpeciesRepository } from './infrastructure/persistence/species.repository';
import { AuditRepositoryPort } from './domain/ports/audit.repository.port';
import { AuditRepository } from './infrastructure/persistence/audit.repository';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function bindRepo(Port: any, Repository: Type<unknown>): Provider[] {
  return [Repository, { provide: Port, useExisting: Repository }];
}

const tokenAliases: Provider[] = [
  { provide: AREAS_SERVICE, useExisting: AreasService },
  { provide: AUTH_SERVICE, useExisting: AuthService },
  { provide: USERS_SERVICE, useExisting: UsersService },
  { provide: FARMS_SERVICE, useExisting: FarmsService },
  { provide: SPECIES_SERVICE, useExisting: SpeciesService },
  { provide: AUDIT_SERVICE, useExisting: AuditService },
];

export const platformProviders: Provider[] = [
  ...bindRepo(AreasRepositoryPort, AreasRepository),
  AreasService,
  ...bindRepo(AuthRepositoryPort, AuthRepository),
  ...bindRepo(UsersRepositoryPort, UsersRepository),
  ...bindRepo(FarmsRepositoryPort, FarmsRepository),
  ...bindRepo(SpeciesRepositoryPort, SpeciesRepository),
  ...bindRepo(AuditRepositoryPort, AuditRepository),
  AuthService,
  UsersService,
  FarmsService,
  SpeciesService,
  AuditService,
  ...tokenAliases,
];
