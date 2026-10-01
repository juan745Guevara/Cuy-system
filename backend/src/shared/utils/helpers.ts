export function normalizeCodigo(codigo: unknown): string {
  if (codigo == null) return '';
  return String(codigo).replace(/\s+/g, '').toUpperCase();
}

export function promedioPesos(...vals: unknown[]): number | null {
  const nums = vals.map(Number).filter((n) => Number.isFinite(n) && n > 0);
  if (!nums.length) return null;
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 100) / 100;
}

export function isValidDateStr(s: unknown): boolean {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(String(s))) return false;
  const d = new Date(`${s}T00:00:00`);
  if (Number.isNaN(d.getTime())) return false;
  const [y, m, day] = String(s).split('-').map(Number);
  return d.getFullYear() === y && d.getMonth() + 1 === m && d.getDate() === day;
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function esFechaFutura(fechaStr: unknown): boolean {
  if (!isValidDateStr(fechaStr)) return false;
  return String(fechaStr).slice(0, 10) > todayISO();
}
