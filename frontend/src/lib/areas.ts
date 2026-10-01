const LEGACY_PURPOSE_LABELS: Record<string, string> = {
  empadre: 'Empadre',
  gestacion_maternidad: 'Gestación / maternidad',
  recria_hembras: 'Recría hembras',
  recria_machos: 'Recría machos',
  reproductores_machos: 'Reproductores machos',
  engorde_descarte: 'Engorde / descarte',
  cuarentena: 'Cuarentena',
  otro: 'Otro',
};

/** Propósito de área legible (las áreas antiguas guardan códigos como `recria_hembras`). */
export const propositoLabel = (p?: string | null) => (p ? LEGACY_PURPOSE_LABELS[p] || p : '—');
