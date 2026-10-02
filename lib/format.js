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
// Puntos de un hexágono apuntado hacia arriba/abajo, reutilizados tanto
// para el recorte visual (clip-path) como para que el texto lo rodee
// (shape-outside) — con los mismos puntos, calzan exactamente.
const HEXAGON_POINTS =
  "50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%";

// Para fotos "círculo"/"hexágono" la caja debe ser cuadrada (alto =
// ancho) para que la forma no salga estirada; "óvalo" y "rectángulo"
// usan el ancho proporcional de siempre.
export function categoryImageBox(shape, height) {
  if (shape === "circle" || shape === "hexagon") {
    return { height, width: height };
  }
  return { height, width: Math.round(height * CATEGORY_IMAGE_ASPECT) };
}

export const CATEGORY_IMAGE_GAP_RANGE = { min: 0, max: 48 };
export const CATEGORY_IMAGE_GAP_DEFAULT = 12;

// gap: separación en px entre la imagen y el texto que la rodea.
// position: "left" o "right" — decide de qué lado va el margen normal.
// Para círculo/óvalo/hexágono se usa shape-margin, porque el margen CSS
// normal no afecta a shape-outside cuando la caja de referencia es el
// border-box (lo necesitamos así para que el texto calce con la forma
// visible, no con un rectángulo invisible más grande).
export function categoryImageStyle(shape, height, width, position, gap) {
  const g = gap ?? CATEGORY_IMAGE_GAP_DEFAULT;
  const sideMargin =
    position === "left" ? { marginRight: g } : { marginLeft: g };

  if (shape === "circle") {
    return {
      className: "rounded-full mb-2",
      style: {
        height,
        width,
        ...sideMargin,
        shapeOutside: "circle(50% at 50% 50%) border-box",
        WebkitShapeOutside: "circle(50% at 50% 50%) border-box",
        shapeMargin: `${g}px`,
        WebkitShapeMargin: `${g}px`,
      },
    };
  }
  if (shape === "oval") {
    return {
      className: "rounded-[50%] mb-2",
      style: {
        height,
        width,
        ...sideMargin,
        shapeOutside: "ellipse(50% 50% at 50% 50%) border-box",
        WebkitShapeOutside: "ellipse(50% 50% at 50% 50%) border-box",
        shapeMargin: `${g}px`,
        WebkitShapeMargin: `${g}px`,
      },
    };
  }
  if (shape === "hexagon") {
    const clip = `polygon(${HEXAGON_POINTS})`;
    return {
      className: "mb-2",
      style: {
        height,
        width,
        ...sideMargin,
        clipPath: clip,
        WebkitClipPath: clip,
        shapeOutside: `polygon(${HEXAGON_POINTS}) border-box`,
        WebkitShapeOutside: `polygon(${HEXAGON_POINTS}) border-box`,
        shapeMargin: `${g}px`,
        WebkitShapeMargin: `${g}px`,
      },
    };
  }
  return {
    className: "rounded-xl mb-2",
    style: { height, width, ...sideMargin },
  };
}

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
