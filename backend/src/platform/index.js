const { createPlatformRouter } = require('./composition/router');

/** Platform module — auth, users, farms, species, audit */
module.exports = function createPlatformModule(deps) {
  return createPlatformRouter(deps);
};
