/**
 * Correspondencia categoría ↔ propósito de área (módulo cuyes).
 * Códigos canónicos usados en seed, áreas y validaciones.
 */
const PROPOSITOS = [
  'empadre',
  'gestacion_maternidad',
  'recria_hembras',
  'recria_machos',
  'reproductores_machos',
  'engorde_descarte',
  'cuarentena',
  'otro',
];

/** Alias legacy → canónico */
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

function normalizeProposito(p) {
  if (!p) return null;
  const key = String(p).trim().toLowerCase().replace(/\s+/g, '_');
  return ALIAS[key] || key;
}

/**
 * ¿El animal (sexo + proposito_area de su categoría) encaja en el área destino?
 * Empadre admite un macho junto a hembras.
 */
function animalCorrespondeAlArea({ sexo, propositoCategoria }, propositoArea) {
  const area = normalizeProposito(propositoArea);
  if (!area || area === 'otro' || area === 'cuarentena') return true;

  const cat = normalizeProposito(propositoCategoria);

  if (area === 'empadre') {
    // macho de empadre permitido sin aviso
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
  // sin categoría conocida: no forzar aviso
  if (!cat) return true;
  return false;
}

function animalFueraDeArea(animal, propositoArea) {
  return !animalCorrespondeAlArea(
    { sexo: animal.sexo, propositoCategoria: animal.proposito_area || animal.propositoCategoria },
    propositoArea
  );
}

module.exports = {
  PROPOSITOS,
  normalizeProposito,
  animalCorrespondeAlArea,
  animalFueraDeArea,
};
