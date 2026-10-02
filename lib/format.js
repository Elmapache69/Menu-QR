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

// Tamaños de referencia (alto en px) para la foto de categoría. El ancho
// se calcula con una proporción fija para que se vea como una foto, no
// un cuadrado ni una tira angosta.
export const CATEGORY_IMAGE_ASPECT = 0.85; // ancho = alto * este valor
export const CATEGORY_IMAGE_PRESET_HEIGHT = { sm: 96, md: 160, lg: 220 };
export const CATEGORY_IMAGE_HEIGHT_RANGE = { min: 64, max: 280 };

// Si el admin deja el tamaño en "auto", lo calculamos según cuántos
// platos tiene la categoría, para que la foto no se vea más grande que
// el texto que la acompaña.
export function autoCategoryImageSize(itemCount) {
  if (itemCount <= 2) return "sm";
  if (itemCount <= 5) return "md";
  return "lg";
}

// Resuelve el alto/ancho final (en px) de la foto de una categoría,
// dado lo guardado en Firestore (categoryImages/{categoria}) y la
// cantidad de platos que tiene esa categoría. Única fuente de verdad
// para que la carta pública y la vista previa del admin calcen igual.
export function resolveCategoryImageHeight(catData, itemCount) {
  if (catData?.size === "custom" && catData.customHeight) {
    return catData.customHeight;
  }
  const preset =
    catData?.size && catData.size !== "auto" && catData.size !== "custom"
      ? catData.size
      : autoCategoryImageSize(itemCount);
  return CATEGORY_IMAGE_PRESET_HEIGHT[preset] || CATEGORY_IMAGE_PRESET_HEIGHT.md;
}
