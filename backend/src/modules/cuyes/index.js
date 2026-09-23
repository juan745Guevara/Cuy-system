const express = require('express');
const { requireSpecies } = require('../../shared/middleware/auth');
const { createCuyesRouter } = require('./composition/router');
const cuyesAreaRules = require('./domain/areaRules.adapter');

/** Cuyes species module — requires x-species-id on every request */
module.exports = function createCuyesModule(deps) {
  const router = express.Router();
  const moduleDeps = { ...deps, areaRules: cuyesAreaRules };
  router.use(requireSpecies);
  router.use(createCuyesRouter(moduleDeps));
  return router;
};
