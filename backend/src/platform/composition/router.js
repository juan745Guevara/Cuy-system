const express = require('express');
const { composeModule } = require('../../shared/kernel/composeModule');

function createPlatformRouter(deps) {
  const router = express.Router();

  router.use('/auth', composeModule({
    createRepository: require('../infrastructure/auth.repository').createAuthRepository,
    createService: require('../application/auth.service').createAuthService,
    createRoutes: require('../interfaces/auth.routes').createAuthRoutes,
    deps,
  }));

  router.use('/users', composeModule({
    createRepository: require('../infrastructure/users.repository').createUsersRepository,
    createService: require('../application/users.service').createUsersService,
    createRoutes: require('../interfaces/users.routes').createUsersRoutes,
    deps,
  }));

  router.use('/farms', composeModule({
    createRepository: require('../infrastructure/farms.repository').createFarmsRepository,
    createService: require('../application/farms.service').createFarmsService,
    createRoutes: require('../interfaces/farms.routes').createFarmsRoutes,
    deps,
  }));

  router.use('/species', composeModule({
    createRepository: require('../infrastructure/species.repository').createSpeciesRepository,
    createService: require('../application/species.service').createSpeciesService,
    createRoutes: require('../interfaces/species.routes').createSpeciesRoutes,
    deps,
  }));

  router.use('/audit', composeModule({
    createRepository: require('../infrastructure/audit.repository').createAuditRepository,
    createService: require('../application/audit.service').createAuditService,
    createRoutes: require('../interfaces/audit.routes').createAuditRoutes,
    deps,
  }));

  return router;
}

module.exports = { createPlatformRouter };
