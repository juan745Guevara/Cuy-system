/**
 * Category ↔ area purpose mapping (cuy module).
 * Canonical codes used in seed, areas and validation.
 */
const PURPOSES = [
  'empadre',
  'gestacion_maternidad',
  'recria_hembras',
  'recria_machos',
  'reproductores_machos',
  'engorde_descarte',
  'cuarentena',
  'otro',
];

/** Legacy alias → canonical */
const ALIAS = {
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

function normalizePurpose(p) {
  if (!p) return null;
  const key = String(p).trim().toLowerCase().replace(/\s+/g, '_');
  return ALIAS[key] || key;
}

/**
 * Does the animal (sex + category area purpose) fit the destination area?
 * Breeding allows one male with females.
 */
function animalMatchesArea({ sexo, propositoCategoria }, areaPurpose) {
  const area = normalizePurpose(areaPurpose);
  if (!area || area === 'otro' || area === 'cuarentena') return true;

  const cat = normalizePurpose(propositoCategoria);

  if (area === 'empadre') {
    // breeding male allowed without warning
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
    return cat === 'recria_machos' || cat === 'recria_hembras'; // legacy "recria"
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
  // no known category: do not force warning
  if (!cat) return true;
  return false;
}

function isAnimalOutOfArea(animal, areaPurpose) {
  return !animalMatchesArea(
    { sexo: animal.sexo, propositoCategoria: animal.proposito_area || animal.propositoCategoria },
    areaPurpose
  );
}

module.exports = {
  PURPOSES,
  normalizePurpose,
  animalMatchesArea,
  isAnimalOutOfArea,
};
