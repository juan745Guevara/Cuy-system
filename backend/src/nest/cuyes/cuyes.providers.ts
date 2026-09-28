import { Provider } from '@nestjs/common';
import { SharedDepsService } from '../shared/deps/shared-deps.service';
import { CUYES_SERVICE_TOKENS } from './cuyes.tokens';

const CUYES_MODULE_NAMES = [
  'areas',
  'cages',
  'animals',
  'catalogs',
  'movements',
  'mortality',
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

function createCuyesService(deps: SharedDepsService, name: string) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const cuyesAreaRules = require('../../modules/cuyes/domain/areaRules.adapter');
  const d = { ...deps.toDeps(), areaRules: cuyesAreaRules };
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

export const cuyesProviders: Provider[] = CUYES_MODULE_NAMES.map((name) => ({
  provide: CUYES_SERVICE_TOKENS[name],
  useFactory: (deps: SharedDepsService) => createCuyesService(deps, name),
  inject: [SharedDepsService],
}));
