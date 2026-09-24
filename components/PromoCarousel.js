"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

export default function PromoCarousel({ promos }) {
  const [index, setIndex] = useState(0);
  const touchStartX = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (index >= promos.length) setIndex(0);
  }, [promos.length, index]);

  useEffect(() => {
    if (promos.length <= 1) return;
    timerRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % promos.length);
    }, 5000);
    return () => clearInterval(timerRef.current);
  }, [promos.length]);

  if (!promos || promos.length === 0) return null;

  const resetTimer = () => {
    clearInterval(timerRef.current);
    if (promos.length > 1) {
      timerRef.current = setInterval(() => {
        setIndex((i) => (i + 1) % promos.length);
      }, 5000);
    }
  };

  const goTo = (i) => {
    setIndex(i);
    resetTimer();
  };

  const onTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const onTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 40) {
      if (delta < 0) goTo((index + 1) % promos.length);
      else goTo((index - 1 + promos.length) % promos.length);
    }
    touchStartX.current = null;
  };

  const promo = promos[index] || promos[0];

  return (
    <div className="mx-auto mt-4 max-w-xl px-4 sm:px-5">
      <div
        className="relative aspect-[16/9] w-full overflow-hidden rounded-xl ring-1 ring-char-700"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {promo.imageUrl ? (
          <Image
            src={promo.imageUrl}
            alt={promo.title || "Promoción"}
            fill
            sizes="(max-width: 640px) 100vw, 576px"
            className="object-cover"
            priority
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-ember-700 to-char-900" />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-char-950/95 via-char-950/20 to-transparent" />

        {(promo.title || promo.description) && (
          <div className="absolute inset-x-0 bottom-0 p-4">
            {promo.title && (
              <h3 className="font-display text-2xl leading-none tracking-wide text-smoke-100">
                {promo.title}
              </h3>
            )}
            {promo.description && (
              <p className="mt-1 text-sm text-smoke-300">
                {promo.description}
              </p>
            )}
          </div>
        )}
      </div>

      {promos.length > 1 && (
        <div className="mt-2 flex justify-center gap-1.5">
          {promos.map((p, i) => (
            <button
              key={p.id}
              onClick={() => goTo(i)}
              aria-label={`Ver promoción ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${
                i === index ? "w-5 bg-ember-500" : "w-1.5 bg-char-700"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
