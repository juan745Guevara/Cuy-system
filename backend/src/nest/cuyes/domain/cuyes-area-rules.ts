/** Cuyes adapter for areaRulesPort (OCP / LSP). */
import * as areaPurpose from './area-purpose';

export const cuyesAreaRules = {
  normalizePurpose: areaPurpose.normalizePurpose,
  getPurposes: () => [...areaPurpose.PURPOSES],
  animalMatchesArea: areaPurpose.animalMatchesArea,
  isAnimalOutOfArea: areaPurpose.isAnimalOutOfArea,
};
