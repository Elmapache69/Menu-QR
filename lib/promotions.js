export const PROMO_TYPES = [
  { value: "offer", label: "Oferta" },
  { value: "event", label: "Evento" },
  { value: "news", label: "Novedad" },
];

export function getPromoType(value) {
  return PROMO_TYPES.find((type) => type.value === value) || PROMO_TYPES[0];
}
