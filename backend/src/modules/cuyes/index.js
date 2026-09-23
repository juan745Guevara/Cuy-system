const { createCuyesRouter } = require('./composition/router');

/** Composition root — receives deps injected from server.js */
module.exports = function createCuyesModule(deps) {
  return createCuyesRouter(deps);
};
