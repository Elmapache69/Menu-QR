"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import FlameIcon from "@/components/FlameIcon";
import { getPromoType } from "@/lib/promotions";

export default function PromoCard({ promo, priority = false, preview = false }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [promo.imageUrl]);
  const type = getPromoType(promo.type);
  const hasImage = Boolean(promo.imageUrl) && !failed;

  return (
    <article className="promo-card">
      {hasImage ? (
        <div className="promo-card-media">
          <Image src={promo.imageUrl} alt={promo.title || `${type.label} del restaurante`}
            fill priority={priority} sizes="(max-width: 640px) 100vw, 576px"
            className="promo-card-image" draggable={false} onError={() => setFailed(true)} />
        </div>
      ) : (
        <div className="promo-card-mark" aria-hidden="true"><FlameIcon className="h-12 w-12" /></div>
      )}
      <div className="promo-card-copy">
        <p className="promo-card-type">{type.label}</p>
        <h3>{promo.title || (preview ? "Título de la publicación" : `${type.label} del restaurante`)}</h3>
        {promo.description && <p className="promo-card-description">{promo.description}</p>}
        {failed && <p className="promo-card-description">La imagen no está disponible en este momento.</p>}
      </div>
    </article>
  );
}
