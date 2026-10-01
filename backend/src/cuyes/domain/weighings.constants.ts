export const RANGOS_DEFAULT: Record<string, { min: number; max: number }> = {
  gazapo: { min: 50, max: 250 },
  destete: { min: 150, max: 450 },
  recria: { min: 300, max: 900 },
  reproductora: { min: 700, max: 1600 },
  reproductor: { min: 800, max: 1800 },
  default: { min: 50, max: 2000 },
};

export const CATEGORIAS_RANGO = Object.keys(RANGOS_DEFAULT);
export const ESPECIE_ABS = { min: 20, max: 3000 };
