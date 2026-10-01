/**
 * Category ↔ area purpose mapping (cuy species).
 * Canonical codes used in seed, areas and validation.
 */
export const PURPOSES = [
  'empadre',
  'gestacion_maternidad',
  'recria_hembras',
  'recria_machos',
  'reproductores_machos',
  'engorde_descarte',
  'cuarentena',
  'otro',
] as const;

/** Legacy alias → canonical */
const ALIAS: Record<string, string> = {
  maternidad: 'gestacion_maternidad',
  gestacion: 'gestacion_maternidad',
  gestacion_maternidad: 'gestacion_maternidad',
  recria: 'recria_hembras',
  recria_hembras: 'recria_hembras',
  recria_machos: 'recria_machos',
  machos: 'reproductores_machos',
  reproductores_machos: 'reproductores_machos',
  empadre: 'empadre',
  engorde: 'engorde_descarte',
  engorde_descarte: 'engorde_descarte',
  descarte: 'engorde_descarte',
  cuarentena: 'cuarentena',
  enfermeria: 'cuarentena',
  otro: 'otro',
};

export function normalizePurpose(p: unknown): string | null {
  if (!p) return null;
  const key = String(p)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s/]+/g, '_')
    .replace(/_+/g, '_');
  return ALIAS[key] || key;
}

export function animalMatchesArea(
  {
    sexo,
    propositoCategoria,
  }: { sexo?: string; propositoCategoria?: unknown },
  areaPurpose: unknown,
): boolean {
  const area = normalizePurpose(areaPurpose);
  if (!area || area === 'otro' || area === 'cuarentena') return true;
  if (!(PURPOSES as readonly string[]).includes(area)) return true;

  const cat = normalizePurpose(propositoCategoria);

  if (area === 'empadre') {
    if (sexo === 'M') return true;
    if (sexo === 'H') {
      if (!cat) return true;
      return ['empadre', 'gestacion_maternidad', 'recria_hembras'].includes(cat);
    }
    return false;
  }

  if (area === 'gestacion_maternidad') {
    if (sexo !== 'H') return false;
    if (!cat) return true;
    return ['gestacion_maternidad', 'empadre'].includes(cat);
  }

  if (area === 'recria_hembras') {
    if (sexo !== 'H') return false;
    if (!cat) return true;
    return cat === 'recria_hembras';
  }

  if (area === 'recria_machos') {
    if (sexo !== 'M') return false;
    if (!cat) return true;
    return cat === 'recria_machos' || cat === 'recria_hembras';
  }

  if (area === 'reproductores_machos') {
    if (sexo !== 'M') return false;
    if (!cat) return true;
    return cat === 'reproductores_machos';
  }

  if (area === 'engorde_descarte') {
    if (!cat) return true;
    return cat === 'engorde_descarte';
  }

  if (cat && cat === area) return true;
  if (!cat) return true;
  return false;
}

export function isAnimalOutOfArea(
  animal: {
    sexo?: string;
    proposito_area?: unknown;
    propositoCategoria?: unknown;
  },
  areaPurpose: unknown,
): boolean {
  return !animalMatchesArea(
    {
      sexo: animal.sexo,
      propositoCategoria: animal.proposito_area || animal.propositoCategoria,
    },
    areaPurpose,
  );
}
