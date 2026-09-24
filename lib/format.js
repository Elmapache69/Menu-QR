export function formatCLP(value) {
  const n = Number(value) || 0;
  return n.toLocaleString("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  });
}

// Orden preferido de categorías en la carta. Cualquier categoría nueva
// que el admin escriba y no esté en esta lista aparece al final,
// ordenada alfabéticamente.
export const CATEGORY_ORDER = [
  "Entradas",
  "Tablas",
  "Parrilladas",
  "Platos de fondo",
  "Acompañamientos",
  "Cervezas",
  "Vinos",
  "Tragos",
  "Bebidas",
  "Postres",
];

export function sortCategories(categories) {
  return [...categories].sort((a, b) => {
    const ia = CATEGORY_ORDER.indexOf(a);
    const ib = CATEGORY_ORDER.indexOf(b);
    if (ia === -1 && ib === -1) return a.localeCompare(b);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });
}

// Pequeño texto que aparece sobre ciertas categorías para invitar a
// pedidos grupales / de mayor ticket. Puramente visual, no afecta datos.
const CATEGORY_KICKERS = {
  Tablas: "Ideal para compartir",
  Parrilladas: "Para compartir en grupo",
};

export function categoryKicker(category) {
  return CATEGORY_KICKERS[category] || null;
}
