import { Provider, Type } from '@nestjs/common';
import { CUYES_SERVICE_TOKENS } from './cuyes.tokens';
import {
  AREAS_SERVICE,
  MORTALITY_SERVICE,
  SALES_SERVICE,
  WEANINGS_SERVICE,
  CATALOGS_SERVICE,
  BIRTHS_SERVICE,
  INVENTORY_SERVICE,
} from './cuyes.tokens';
import { CuyesDepsService } from './cuyes-deps.service';
import { AreasRepository } from './repositories/areas.repository';
import { AreasService } from './services/areas.service';
import { MortalityRepository } from './repositories/mortality.repository';
import { MortalityService } from './services/mortality.service';
import { SalesRepository } from './repositories/sales.repository';
import { SalesService } from './services/sales.service';
import { WeaningsRepository } from './repositories/weanings.repository';
import { WeaningsService } from './services/weanings.service';
import { CatalogsRepository } from './repositories/catalogs.repository';
import { CatalogsService } from './services/catalogs.service';
import { BirthsRepository } from './repositories/births.repository';
import { BirthsService } from './services/births.service';
import { InventoryRepository } from './repositories/inventory.repository';
import { InventoryService } from './services/inventory.service';

const LEGACY_CUYES_MODULE_NAMES = [
  'cages',
  'animals',
  'movements',
  'weighings',
  'treatments',
  'reports',
  'breedings',
  'alerts',
  'ranking',
] as const;

function pascal(name: string) {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function createLegacyCuyesService(deps: CuyesDepsService, name: string) {
  const d = deps.toDeps();
  const Pascal = pascal(name);
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { [`create${Pascal}Repository`]: createRepository } = require(
    `../../modules/cuyes/infrastructure/${name}.repository`,
  );
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { [`create${Pascal}Service`]: createService } = require(
    `../../modules/cuyes/application/${name}.service`,
  );
  const repository = createRepository(d);
  return createService({ repository, ...d });
}

function migrated(
  token: symbol,
  Repository: Type<unknown>,
  Service: Type<unknown>,
): Provider[] {
  return [Repository, Service, { provide: token, useExisting: Service }];
}

const legacyCuyesProviders: Provider[] = LEGACY_CUYES_MODULE_NAMES.map(
  (name) => ({
    provide: CUYES_SERVICE_TOKENS[name],
    useFactory: (deps: CuyesDepsService) => createLegacyCuyesService(deps, name),
    inject: [CuyesDepsService],
  }),
);

export const cuyesProviders: Provider[] = [
  CuyesDepsService,
  ...migrated(AREAS_SERVICE, AreasRepository, AreasService),
  ...migrated(MORTALITY_SERVICE, MortalityRepository, MortalityService),
  ...migrated(SALES_SERVICE, SalesRepository, SalesService),
  ...migrated(WEANINGS_SERVICE, WeaningsRepository, WeaningsService),
  ...migrated(CATALOGS_SERVICE, CatalogsRepository, CatalogsService),
  ...migrated(BIRTHS_SERVICE, BirthsRepository, BirthsService),
  ...migrated(INVENTORY_SERVICE, InventoryRepository, InventoryService),
  ...legacyCuyesProviders,
];
