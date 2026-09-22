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
  "Parrilladas",
  "Platos de fondo",
  "Acompañamientos",
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
