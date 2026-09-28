import { CuyesDepsService } from '../cuyes-deps.service';

/** Binds a legacy createRepository + createService factory to a Nest injectable instance. */
export function bindLegacyCuyesService(
  target: object,
  cuyesDeps: CuyesDepsService,
  moduleName: string,
  pascal: string,
) {
  const d = cuyesDeps.toDeps();
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { [`create${pascal}Repository`]: createRepository } = require(
    `./js/${moduleName}.repository`,
  );
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { [`create${pascal}Service`]: createService } = require(
    `./js/${moduleName}.service`,
  );
  const repository = createRepository(d);
  Object.assign(target, createService({ repository, ...d }));
}
