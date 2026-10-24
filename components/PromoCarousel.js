"use client";

import { useEffect, useId, useRef, useState } from "react";
import PromoCard from "@/components/PromoCard";

const AUTO_ADVANCE_MS = 6500;

export default function PromoCarousel({ promos = [] }) {
  const [index, setIndex] = useState(0);
  const [interaction, setInteraction] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [pageHidden, setPageHidden] = useState(false);
  const [visible, setVisible] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const sectionRef = useRef(null);
  const pagesRef = useRef(null);
  const gesture = useRef(null);
  const headingId = useId();
  const hasPromos = promos.length > 0;
  const currentIndex = index < promos.length ? index : 0;
  const canAutoplay = promos.length > 1 && !dragging && !pageHidden && visible && !reducedMotion;

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotion = () => setReducedMotion(preference.matches);
    const syncVisibility = () => setPageHidden(document.hidden);
    syncMotion();
    syncVisibility();
    preference.addEventListener("change", syncMotion);
    document.addEventListener("visibilitychange", syncVisibility);
    return () => {
      preference.removeEventListener("change", syncMotion);
      document.removeEventListener("visibilitychange", syncVisibility);
    };
  }, []);

  useEffect(() => {
    if (index >= promos.length) setIndex(0);
  }, [index, promos.length]);

  useEffect(() => {
    if (!sectionRef.current) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, [hasPromos]);

  useEffect(() => {
    if (!canAutoplay) return;
    const timer = setTimeout(() => setIndex((current) => (current + 1) % promos.length), AUTO_ADVANCE_MS);
    return () => clearTimeout(timer);
  }, [index, interaction, canAutoplay, promos.length]);

  useEffect(() => {
    const pages = pagesRef.current;
    const selected = pages?.querySelector('[aria-current="true"]');
    if (!selected) return;
    const bounds = pages.getBoundingClientRect();
    const target = selected.getBoundingClientRect();
    if (target.left < bounds.left || target.right > bounds.right) {
      pages.scrollLeft += target.left - bounds.left - (pages.clientWidth - selected.clientWidth) / 2;
    }
  }, [currentIndex]);

  if (!hasPromos) return null;

  const goTo = (next) => {
    setIndex((next + promos.length) % promos.length);
    setInteraction((current) => current + 1);
  };
  const endGesture = (event, cancelled = false) => {
    if (!gesture.current || event.pointerId !== gesture.current.pointerId) return;
    const deltaX = event.clientX - gesture.current.x;
    const deltaY = event.clientY - gesture.current.y;
    if (!cancelled && Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY)) {
      goTo(currentIndex + (deltaX < 0 ? 1 : -1));
    }
    gesture.current = null;
    setDragging(false);
  };

  return (
    <section ref={sectionRef} className="promo-carousel" aria-labelledby={headingId}
      aria-roledescription="carrusel" tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
          event.preventDefault();
          goTo(currentIndex + (event.key === "ArrowRight" ? 1 : -1));
        } else if (event.key === "Home" || event.key === "End") {
          event.preventDefault();
          goTo(event.key === "Home" ? 0 : promos.length - 1);
        }
      }}>
      <div className="promo-carousel-heading">
        <h2 id={headingId}>Ofertas y novedades</h2>
      </div>
      <div className="promo-viewport"
        onPointerDown={(event) => {
          if (promos.length < 2 || !event.isPrimary || event.button !== 0 || event.target.closest("button")) return;
          gesture.current = { x: event.clientX, y: event.clientY, pointerId: event.pointerId };
          setDragging(true);
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerUp={(event) => endGesture(event)}
        onPointerCancel={(event) => endGesture(event, true)}
        onLostPointerCapture={(event) => endGesture(event, true)}>
        <div className="promo-track" style={{ "--promo-index": currentIndex }} aria-live={canAutoplay ? "off" : "polite"} aria-atomic="false">
          {promos.map((promo, slideIndex) => (
            <div key={promo.id} className="promo-slide" role="group" aria-roledescription="diapositiva"
              aria-label={`${slideIndex + 1} de ${promos.length}`} aria-hidden={slideIndex !== currentIndex}>
              <PromoCard promo={promo} priority={slideIndex === 0} />
            </div>
          ))}
        </div>
        {promos.length > 1 && <div className="promo-carousel-arrows">
          <button type="button" className="promo-arrow promo-arrow-previous" onClick={() => goTo(currentIndex - 1)} aria-label="Publicación anterior">←</button>
          <button type="button" className="promo-arrow promo-arrow-next" onClick={() => goTo(currentIndex + 1)} aria-label="Publicación siguiente">→</button>
        </div>}
      </div>
      {promos.length > 1 && <div className="promo-carousel-footer">
        <nav ref={pagesRef} className="promo-pages scrollbar-none" aria-label="Elegir publicación">
          {promos.map((promo, slideIndex) => <button type="button" key={promo.id}
            onClick={() => goTo(slideIndex)} aria-label={`Ver publicación ${slideIndex + 1}: ${promo.title || "Sin título"}`}
            aria-current={slideIndex === currentIndex ? "true" : undefined}>
            <span className="promo-dot" aria-hidden="true" />
          </button>)}
        </nav>
      </div>}
    </section>
  );
}
