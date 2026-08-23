function normalizeCodigo(codigo) {
  if (codigo == null) return '';
  return String(codigo).replace(/\s+/g, '').toUpperCase();
}

function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

module.exports = { normalizeCodigo, asyncHandler };
