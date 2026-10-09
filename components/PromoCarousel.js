"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";

const AUTO_ADVANCE_MS = 6500;

export default function PromoCarousel({ promos = [], motion = true }) {
  const [index, setIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [paused, setPaused] = useState(false);
  const [focused, setFocused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const trackRef = useRef(null);
  const timerRef = useRef(null);
  const dragState = useRef(null);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(preference.matches);
    sync();
    preference.addEventListener("change", sync);
    return () => preference.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (index >= promos.length) setIndex(0);
  }, [promos.length, index]);

  const restartTimer = useCallback(() => {
    clearInterval(timerRef.current);
    if (promos.length > 1 && motion && !reducedMotion && !paused && !focused) {
      timerRef.current = setInterval(() => setIndex((current) => (current + 1) % promos.length), AUTO_ADVANCE_MS);
    }
  }, [promos.length, motion, reducedMotion, paused, focused]);

  useEffect(() => {
    restartTimer();
    return () => clearInterval(timerRef.current);
  }, [restartTimer]);

  if (!promos.length) return null;

  const goTo = (next) => {
    setIndex((next + promos.length) % promos.length);
    restartTimer();
  };
  const onPointerDown = (event) => {
    if (promos.length <= 1 || (event.pointerType === "mouse" && event.button !== 0)) return;
    dragState.current = { startX: event.clientX, width: trackRef.current?.offsetWidth || 1, delta: 0 };
    setIsDragging(true);
    clearInterval(timerRef.current);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };
  const onPointerMove = (event) => {
    if (!dragState.current) return;
    dragState.current.delta = event.clientX - dragState.current.startX;
    setDragOffset(dragState.current.delta);
  };
  const endDrag = (cancelled = false) => {
    if (!dragState.current) return;
    const { delta, width } = dragState.current;
    if (!cancelled && Math.abs(delta / width) > 0.18) {
      setIndex((current) => (current + (delta < 0 ? 1 : -1) + promos.length) % promos.length);
    }
    dragState.current = null;
    setIsDragging(false);
    setDragOffset(0);
    restartTimer();
  };

  const currentIndex = index < promos.length ? index : 0;
  const dragPercent = isDragging ? (dragOffset / ((trackRef.current?.offsetWidth || 1) * promos.length)) * 100 : 0;

  return (
    <section className="menu-container promo-section" aria-label="Promociones y eventos"
      aria-roledescription="carrusel" onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}>
      <div className="mb-3 flex items-center gap-3">
        <p className="menu-eyebrow">Promociones & encuentros</p>
        <div className="ember-rule flex-1" />
        <span className="promo-position">{String(currentIndex + 1).padStart(2, "0")} / {String(promos.length).padStart(2, "0")}</span>
      </div>
      <div ref={trackRef} className={`promo-surface relative w-full touch-pan-y select-none overflow-hidden${promos.some((promo) => promo.imageUrl) ? "" : " promo-text-only"}`}
        onPointerDown={onPointerDown} onPointerMove={onPointerMove}
        onPointerUp={() => endDrag()} onPointerCancel={() => endDrag(true)}>
        <div className="flex h-full" style={{
          width: `${promos.length * 100}%`,
          transform: `translateX(calc(${-currentIndex * (100 / promos.length)}% + ${dragPercent}%))`,
          transition: isDragging || !motion || reducedMotion ? "none" : "transform .65s cubic-bezier(.22, 1, .36, 1)",
        }}>
          {promos.map((promo, slideIndex) => (
            <div key={promo.id} className="relative h-full flex-shrink-0" style={{ width: `${100 / promos.length}%` }}
              role="group" aria-roledescription="diapositiva" aria-label={`${slideIndex + 1} de ${promos.length}`}
              aria-hidden={slideIndex !== currentIndex}>
              {promo.imageUrl ? <Image src={promo.imageUrl} alt={promo.title || "Promoción"} fill draggable={false}
                sizes="(max-width: 1152px) 100vw, 1088px" className="pointer-events-none object-cover" priority={slideIndex === 0} />
                : <div className="h-full w-full bg-gradient-to-br from-ember-700 to-char-900" />}
              <div className="promo-caption absolute inset-0" />
              {(promo.title || promo.description) && <div className="promo-slide-content">
                {promo.title && <h2 className="promo-title">{promo.title}</h2>}
                {promo.description && <p className="promo-copy">{promo.description}</p>}
              </div>}
            </div>
          ))}
        </div>
      </div>
      {promos.length > 1 && <div className="promo-controls">
        <div className="flex items-center">
          {promos.map((promo, slideIndex) => <button type="button" key={promo.id} onClick={() => goTo(slideIndex)}
            aria-label={`Ver promoción ${slideIndex + 1}`} aria-current={slideIndex === currentIndex ? "true" : undefined}
            className="flex h-10 min-w-8 items-center justify-center">
            <span className={`h-1.5 rounded-full transition-all ${slideIndex === currentIndex ? "w-5 bg-ember-400" : "w-1.5 bg-char-600"}`} />
          </button>)}
        </div>
        <div className="flex items-center gap-1">
          {motion && !reducedMotion && <button type="button" onClick={() => setPaused(!paused)} className="promo-control px-2"
            aria-label={paused ? "Reanudar promociones" : "Pausar promociones"}>{paused ? "Reanudar" : "Pausar"}</button>}
          <button type="button" className="promo-control" onClick={() => goTo(currentIndex - 1)} aria-label="Promoción anterior">←</button>
          <button type="button" className="promo-control" onClick={() => goTo(currentIndex + 1)} aria-label="Promoción siguiente">→</button>
        </div>
      </div>}
    </section>
  );
}
