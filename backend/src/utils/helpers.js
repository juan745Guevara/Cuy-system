function normalizeCodigo(codigo) {
  if (codigo == null) return '';
  return String(codigo).replace(/\s+/g, '').toUpperCase();
}

function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

function promedioPesos(...vals) {
  const nums = vals.map(Number).filter((n) => Number.isFinite(n) && n > 0);
  if (!nums.length) return null;
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 100) / 100;
}

function isValidDateStr(s) {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(String(s))) return false;
  const d = new Date(`${s}T00:00:00`);
  if (Number.isNaN(d.getTime())) return false;
  const [y, m, day] = String(s).split('-').map(Number);
  return d.getFullYear() === y && d.getMonth() + 1 === m && d.getDate() === day;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

// Rechaza fechas futuras (comparación lexicográfica sobre ISO YYYY-MM-DD)
function esFechaFutura(fechaStr) {
  if (!isValidDateStr(fechaStr)) return false;
  return String(fechaStr).slice(0, 10) > todayISO();
}

// Devuelve true si la fecha es inválida o futura (para los handlers)
function errorFecha(res, campo, mensaje = null) {
  res.status(400).json({ error: mensaje || `${campo} no puede ser futura`, campo });
  return true;
}

module.exports = {
  normalizeCodigo,
  asyncHandler,
  promedioPesos,
  isValidDateStr,
  todayISO,
  esFechaFutura,
  errorFecha,
};
