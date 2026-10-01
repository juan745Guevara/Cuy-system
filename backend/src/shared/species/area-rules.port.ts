/** Port for category ↔ area rules (OCP). Platform default is no-op. */
export interface AreaRulesPort {
  normalizePurpose: (p: unknown) => unknown;
  getPurposes: () => string[];
  animalMatchesArea: (
    animal: { sexo?: string; propositoCategoria?: unknown },
    areaPurpose: unknown,
  ) => boolean;
  isAnimalOutOfArea: (
    animal: {
      sexo?: string;
      proposito_area?: unknown;
      propositoCategoria?: unknown;
    },
    areaPurpose: unknown,
  ) => boolean;
}

export function createNoOpAreaRules(): AreaRulesPort {
  return {
    normalizePurpose: (p) => p,
    getPurposes: () => [],
    animalMatchesArea: () => true,
    isAnimalOutOfArea: () => false,
  };
}
