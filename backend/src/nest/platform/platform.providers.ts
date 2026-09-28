import { Provider } from '@nestjs/common';
import { SharedDepsService } from '../shared/deps/shared-deps.service';
import {
  AUTH_SERVICE,
  AUDIT_SERVICE,
  FARMS_SERVICE,
  SPECIES_SERVICE,
  USERS_SERVICE,
} from './platform.tokens';

// Legacy JS services (migrated incrementally to TypeScript)
/* eslint-disable @typescript-eslint/no-var-requires */
const { createAuthRepository } = require('../../platform/infrastructure/auth.repository');
const { createAuthService } = require('../../platform/application/auth.service');
const { createUsersRepository } = require('../../platform/infrastructure/users.repository');
const { createUsersService } = require('../../platform/application/users.service');
const { createFarmsRepository } = require('../../platform/infrastructure/farms.repository');
const { createFarmsService } = require('../../platform/application/farms.service');
const { createSpeciesRepository } = require('../../platform/infrastructure/species.repository');
const { createSpeciesService } = require('../../platform/application/species.service');
const { createAuditRepository } = require('../../platform/infrastructure/audit.repository');
const { createAuditService } = require('../../platform/application/audit.service');

export const platformProviders: Provider[] = [
  {
    provide: AUTH_SERVICE,
    useFactory: (deps: SharedDepsService) => {
      const d = deps.toDeps();
      return createAuthService({
        repository: createAuthRepository({ prisma: d.prisma }),
      });
    },
    inject: [SharedDepsService],
  },
  {
    provide: USERS_SERVICE,
    useFactory: (deps: SharedDepsService) => {
      const d = deps.toDeps();
      return createUsersService({
        repository: createUsersRepository({ prisma: d.prisma }),
      });
    },
    inject: [SharedDepsService],
  },
  {
    provide: FARMS_SERVICE,
    useFactory: (deps: SharedDepsService) => {
      const d = deps.toDeps();
      return createFarmsService({
        repository: createFarmsRepository({ prisma: d.prisma }),
        audit: d.audit,
      });
    },
    inject: [SharedDepsService],
  },
  {
    provide: SPECIES_SERVICE,
    useFactory: (deps: SharedDepsService) => {
      const d = deps.toDeps();
      return createSpeciesService({
        repository: createSpeciesRepository({ prisma: d.prisma }),
      });
    },
    inject: [SharedDepsService],
  },
  {
    provide: AUDIT_SERVICE,
    useFactory: (deps: SharedDepsService) => {
      const d = deps.toDeps();
      return createAuditService({
        repository: createAuditRepository({ prisma: d.prisma }),
      });
    },
    inject: [SharedDepsService],
  },
];
