export function clampNumber(value, fallback, min = 0, max = 100) {
  const number = value === null || value === "" ? NaN : Number(value);
  return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
}

export function resolvePromoImage(promo = {}) {
  promo = promo || {};
  return {
    imageFit: promo.imageFit === "cover" ? "cover" : "contain",
    imageFocusX: clampNumber(promo.imageFocusX, 50),
    imageFocusY: clampNumber(promo.imageFocusY, 50),
    textPosition: promo.textPosition === "overlay" ? "overlay" : "below",
  };
}

export function resolveCategoryImage(image) {
  return {
    imageUrl: image?.imageUrl || "",
    layout: "overlay",
    imageFocusX: clampNumber(image?.imageFocusX, 50),
    imageFocusY: clampNumber(image?.imageFocusY, 50),
    overlayShade: clampNumber(image?.overlayShade, 65, 60, 90),
  };
}
