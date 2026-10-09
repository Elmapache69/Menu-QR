"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import FlameIcon from "@/components/FlameIcon";
import { resolvePromoImage } from "@/lib/image-settings";

export default function PromoSlide({ promo, priority = false }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [promo.imageUrl]);
  const settings = resolvePromoImage(promo);
  const hasImage = Boolean(promo.imageUrl) && !failed;
  const hasText = Boolean(promo.title || promo.description);
  const overlay = hasImage && hasText && settings.textPosition === "overlay";
  return <article className="promo-card" data-fit={settings.imageFit} data-caption={overlay ? "overlay" : "below"} data-image={hasImage}>
    {hasImage ? <div className="promo-media">
      {settings.imageFit === "contain" && <Image src={promo.imageUrl} alt="" fill aria-hidden="true" draggable={false}
        sizes="(max-width: 1152px) 100vw, 1088px" className="promo-ambient" />}
      <Image src={promo.imageUrl} alt={promo.title || "Promoción del restaurante"} fill draggable={false}
        sizes="(max-width: 1152px) 100vw, 1088px" priority={priority}
        className="promo-image" onError={() => setFailed(true)}
        style={{ objectFit: settings.imageFit, objectPosition: `${settings.imageFocusX}% ${settings.imageFocusY}%` }} />
      {overlay && <div className="promo-image-shade" />}
    </div> : <FlameIcon className="promo-empty-mark" aria-hidden="true" />}
    {(hasText || !hasImage) && <div className="promo-info">
      {promo.title && <h2 className="promo-title">{promo.title}</h2>}
      {promo.description && <p className="promo-copy">{promo.description}</p>}
      {!hasText && !hasImage && <p className="promo-copy">{failed ? "La imagen no está disponible en este momento." : "Vista previa de tu promoción"}</p>}
    </div>}
  </article>;
}
