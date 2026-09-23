/**
 * Composition root — injects dependencies (DIP).
 * repository → service → routes
 */
function composeModule({ createRepository, createService, createRoutes, deps = {} }) {
  const repository = createRepository(deps);
  const service = createService({ repository, ...deps });
  return createRoutes(service);
}

module.exports = { composeModule };
