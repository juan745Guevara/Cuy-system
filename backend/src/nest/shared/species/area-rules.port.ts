/** Port for category ↔ area rules (OCP). Platform default is no-op. */
export function createNoOpAreaRules() {
  return {
    normalizePurpose: (p: unknown) => p,
    getPurposes: () => [] as string[],
    animalMatchesArea: () => true,
    isAnimalOutOfArea: () => false,
  };
}

export type AreaRulesPort = ReturnType<typeof createNoOpAreaRules>;
