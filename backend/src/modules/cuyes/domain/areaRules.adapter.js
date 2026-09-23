/** Cuyes adapter for areaRulesPort (OCP / LSP). */
const areaPurpose = require('./areaPurpose');

module.exports = {
  normalizePurpose: areaPurpose.normalizePurpose,
  getPurposes: () => areaPurpose.PURPOSES,
  animalMatchesArea: areaPurpose.animalMatchesArea,
  isAnimalOutOfArea: areaPurpose.isAnimalOutOfArea,
};
