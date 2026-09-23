const express = require('express');
const { composeModule } = require('../../../shared/kernel/composeModule');

function createCuyesRouter(deps) {
  const router = express.Router();

  const modules = [
    ['areas', 'areas'],
    ['cages', 'cages'],
    ['animals', 'animals'],
    ['catalogs', 'catalogs'],
    ['movements', 'movements'],
    ['mortality', 'mortality'],
    ['sales', 'sales'],
    ['inventory', 'inventory'],
    ['weighings', 'weighings'],
    ['treatments', 'treatments'],
    ['reports', 'reports'],
    ['breedings', 'breedings'],
    ['births', 'births'],
    ['weanings', 'weanings'],
    ['alerts', 'alerts'],
    ['ranking', 'ranking'],
  ];

  for (const [route, name] of modules) {
    const Pascal = name.charAt(0).toUpperCase() + name.slice(1);
    router.use(`/${route}`, composeModule({
      createRepository: require(`../infrastructure/${name}.repository`)[`create${Pascal}Repository`],
      createService: require(`../application/${name}.service`)[`create${Pascal}Service`],
      createRoutes: require(`../interfaces/${name}.routes`)[`create${Pascal}Routes`],
      deps,
    }));
  }

  return router;
}

module.exports = { createCuyesRouter };
