const { createCoreRouter } = require('./composition/router');

/** Composition root — receives deps injected from server.js */
module.exports = function createCoreModule(deps) {
  return createCoreRouter(deps);
};
