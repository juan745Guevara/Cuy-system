const { pool } = require('../database');

/** Puerto de acceso a datos (DIP). Por defecto usa PostgreSQL. */
function createDatabase(deps = {}) {
  return deps.db || pool;
}

module.exports = { createDatabase };
