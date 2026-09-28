import { Provider } from '@nestjs/common';
import {
  CUYES_SERVICE_TOKENS,
  AREAS_SERVICE,
  MORTALITY_SERVICE,
} from './cuyes.tokens';
import { CuyesDepsService } from './cuyes-deps.service';
import { AreasRepository } from './repositories/areas.repository';
import { AreasService } from './services/areas.service';
import { MortalityRepository } from './repositories/mortality.repository';
import { MortalityService } from './services/mortality.service';

const CUYES_MODULE_NAMES = [
  'cages',
  'animals',
  'catalogs',
  'movements',
  'sales',
  'inventory',
  'weighings',
  'treatments',
  'reports',
  'breedings',
  'births',
  'weanings',
  'alerts',
  'ranking',
] as const;

function pascal(name: string) {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function createCuyesService(deps: CuyesDepsService, name: string) {
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

const legacyCuyesProviders: Provider[] = CUYES_MODULE_NAMES.map((name) => ({
  provide: CUYES_SERVICE_TOKENS[name],
  useFactory: (deps: CuyesDepsService) => createCuyesService(deps, name),
  inject: [CuyesDepsService],
}));

export const cuyesProviders: Provider[] = [
  CuyesDepsService,
  AreasRepository,
  AreasService,
  { provide: AREAS_SERVICE, useExisting: AreasService },
  MortalityRepository,
  MortalityService,
  { provide: MORTALITY_SERVICE, useExisting: MortalityService },
  ...legacyCuyesProviders,
];
