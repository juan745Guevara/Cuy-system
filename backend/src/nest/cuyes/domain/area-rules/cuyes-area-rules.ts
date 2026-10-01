/** Cuyes adapter for AreaRulesPort (OCP / LSP). */
import * as areaPurpose from './area-purpose';
import { AreaRulesPort } from '../../../shared/species/area-rules.port';

export const cuyesAreaRules: AreaRulesPort = {
  normalizePurpose: areaPurpose.normalizePurpose,
  getPurposes: () => [...areaPurpose.PURPOSES],
  animalMatchesArea: areaPurpose.animalMatchesArea,
  isAnimalOutOfArea: areaPurpose.isAnimalOutOfArea,
};
