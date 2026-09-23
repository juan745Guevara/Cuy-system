/** Typed use-case result (decoupled from HTTP). */
function ok(data, status = 200) {
  return { ok: true, status, data };
}

function fail(error, status = 400, extra = {}) {
  return { ok: false, status, error, ...extra };
}

function fromError(err, fallbackStatus = 500) {
  if (err.status) return fail(err.message, err.status);
  if (err.code === '23505') return fail('Duplicate record', 409);
  throw err;
}

module.exports = { ok, fail, fromError };
