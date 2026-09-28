import { Provider } from '@nestjs/common';
import {
  AUTH_SERVICE,
  AUDIT_SERVICE,
  FARMS_SERVICE,
  SPECIES_SERVICE,
  USERS_SERVICE,
} from './platform.tokens';
import { AuthService } from './services/auth.service';
import { UsersService } from './services/users.service';
import { FarmsService } from './services/farms.service';
import { SpeciesService } from './services/species.service';
import { AuditService } from './services/audit.service';
import { AuthRepository } from './repositories/auth.repository';
import { UsersRepository } from './repositories/users.repository';
import { FarmsRepository } from './repositories/farms.repository';
import { SpeciesRepository } from './repositories/species.repository';
import { AuditRepository } from './repositories/audit.repository';

const platformRepositories = [
  AuthRepository,
  UsersRepository,
  FarmsRepository,
  SpeciesRepository,
  AuditRepository,
];

const platformServices = [
  AuthService,
  UsersService,
  FarmsService,
  SpeciesService,
  AuditService,
];

const tokenAliases: Provider[] = [
  { provide: AUTH_SERVICE, useExisting: AuthService },
  { provide: USERS_SERVICE, useExisting: UsersService },
  { provide: FARMS_SERVICE, useExisting: FarmsService },
  { provide: SPECIES_SERVICE, useExisting: SpeciesService },
  { provide: AUDIT_SERVICE, useExisting: AuditService },
];

export const platformProviders: Provider[] = [
  ...platformRepositories,
  ...platformServices,
  ...tokenAliases,
];
