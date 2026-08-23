/** Borradores de formularios en sessionStorage (clave tipo `draft:partos`). */

export function saveDraft(key, data) {
  try {
    sessionStorage.setItem(key, JSON.stringify(data));
  } catch {
    /* quota / private mode */
  }
}

export function loadDraft(key) {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearDraft(key) {
  try {
    sessionStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

/** Promedio de pesos numéricos presentes (ignora vacíos / no numéricos). */
export function promedioPesos(...valores) {
  const nums = valores
    .map((v) => (v === '' || v == null ? null : Number(v)))
    .filter((n) => n != null && !Number.isNaN(n));
  if (!nums.length) return null;
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 100) / 100;
}
