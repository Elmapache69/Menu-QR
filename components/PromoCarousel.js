"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

const AUTO_ADVANCE_MS = 6500;
const SLIDE_TRANSITION = "transform 0.7s cubic-bezier(0.22, 1, 0.36, 1)";
const SWIPE_THRESHOLD_RATIO = 0.18; // % del ancho para cambiar de slide

export default function PromoCarousel({ promos }) {
  const [index, setIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const trackRef = useRef(null);
  const timerRef = useRef(null);
  const dragState = useRef(null);

  useEffect(() => {
    if (index >= promos.length) setIndex(0);
  }, [promos.length, index]);

  const restartTimer = () => {
    clearInterval(timerRef.current);
    if (promos.length > 1) {
      timerRef.current = setInterval(() => {
        setIndex((i) => (i + 1) % promos.length);
      }, AUTO_ADVANCE_MS);
    }
  };

  useEffect(() => {
    restartTimer();
    return () => clearInterval(timerRef.current);
  }, [promos.length]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!promos || promos.length === 0) return null;

  const goTo = (i) => {
    setIndex(i);
    restartTimer();
  };

  const onPointerDown = (e) => {
    if (promos.length <= 1) return;
    const width = trackRef.current?.offsetWidth || 1;
    dragState.current = { startX: e.clientX, width };
    setIsDragging(true);
    clearInterval(timerRef.current);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e) => {
    if (!dragState.current) return;
    const delta = e.clientX - dragState.current.startX;
    setDragOffset(delta);
  };

  const endDrag = () => {
    if (!dragState.current) return;
    const { width } = dragState.current;
    const ratio = dragOffset / width;

    let nextIndex = index;
    if (Math.abs(ratio) > SWIPE_THRESHOLD_RATIO) {
      if (ratio < 0) nextIndex = (index + 1) % promos.length;
      else nextIndex = (index - 1 + promos.length) % promos.length;
    }

    dragState.current = null;
    setIsDragging(false);
    setDragOffset(0);
    setIndex(nextIndex);
    restartTimer();
  };

  const promo = promos[index] || promos[0];
  const viewportWidth = trackRef.current?.offsetWidth || 1;
  const trackWidth = viewportWidth * promos.length;
  const dragPercent = isDragging ? (dragOffset / trackWidth) * 100 : 0;

  return (
    <div className="mx-auto mt-4 max-w-xl px-4 sm:px-5">
      <div
        ref={trackRef}
        className="relative aspect-[16/9] w-full touch-pan-y select-none overflow-hidden rounded-xl ring-1 ring-char-700"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onPointerLeave={() => dragState.current && endDrag()}
      >
        <div
          className="flex h-full"
          style={{
            width: `${promos.length * 100}%`,
            transform: `translateX(calc(${-index * (100 / promos.length)}% + ${dragPercent}%))`,
            transition: isDragging ? "none" : SLIDE_TRANSITION,
          }}
        >
          {promos.map((p) => (
            <div
              key={p.id}
              className="relative h-full flex-shrink-0"
              style={{ width: `${100 / promos.length}%` }}
            >
              {p.imageUrl ? (
                <Image
                  src={p.imageUrl}
                  alt={p.title || "Promoción"}
                  fill
                  draggable={false}
                  sizes="(max-width: 640px) 100vw, 576px"
                  className="pointer-events-none object-cover"
                  priority={p.id === promo.id}
                />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-ember-700 to-char-900" />
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-char-950/95 via-char-950/20 to-transparent" />

              {(p.title || p.description) && (
                <div className="absolute inset-x-0 bottom-0 p-4">
                  {p.title && (
                    <h3 className="font-display text-2xl leading-none tracking-wide text-smoke-100">
                      {p.title}
                    </h3>
                  )}
                  {p.description && (
                    <p className="mt-1 text-sm text-smoke-300">
                      {p.description}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
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
