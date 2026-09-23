/**
 * Port for category ↔ area rules (OCP).
 * Core depends on this abstraction; each species provides its adapter.
 */
function createNoOpAreaRules() {
  return {
    normalizePurpose: (p) => p,
    getPurposes: () => [],
    animalMatchesArea: () => true,
    isAnimalOutOfArea: () => false,
  };
}

module.exports = { createNoOpAreaRules };
