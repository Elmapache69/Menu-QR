"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { collection, doc, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { sortCategories } from "@/lib/format";
import { getTheme, resolveAppearance } from "@/lib/appearance";
import FlameIcon from "@/components/FlameIcon";
import ThemeDecorations from "@/components/ThemeDecorations";
import PromoCarousel from "@/components/PromoCarousel";
import MenuIntro from "@/components/MenuIntro";
import MenuSection from "@/components/MenuSection";

const RESTAURANT_NAME = process.env.NEXT_PUBLIC_RESTAURANT_NAME || "Rincón El Sauce";
const INSTAGRAM_URL = process.env.NEXT_PUBLIC_INSTAGRAM_URL || "";
const FACEBOOK_URL = process.env.NEXT_PUBLIC_FACEBOOK_URL || "";

function normalize(value) {
  return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export default function MenuPage() {
  const [items, setItems] = useState(null);
  const [promos, setPromos] = useState([]);
  const [categoryImages, setCategoryImages] = useState({});
  const [appearance, setAppearance] = useState(() => resolveAppearance());
  const [activeCategory, setActiveCategory] = useState(null);
  const [error, setError] = useState(null);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const headerRef = useRef(null);
  const searchButtonRef = useRef(null);
  const categoryNavRef = useRef(null);

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    const observer = new ResizeObserver(() => {
      header.closest("main")?.style.setProperty("--menu-header-height", `${header.offsetHeight}px`);
    });
    observer.observe(header);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const previousTheme = root.getAttribute("data-theme");
    const previousMotion = root.getAttribute("data-motion");
    const browserColor = document.querySelector('meta[name="theme-color"]');
    const previousColor = browserColor?.getAttribute("content");
    root.setAttribute("data-theme", appearance.theme);
    root.setAttribute("data-motion", appearance.motion ? "on" : "off");
    browserColor?.setAttribute("content", getTheme(appearance.theme).background);
    return () => {
      previousTheme === null ? root.removeAttribute("data-theme") : root.setAttribute("data-theme", previousTheme);
      previousMotion === null ? root.removeAttribute("data-motion") : root.setAttribute("data-motion", previousMotion);
      if (browserColor && previousColor !== null) browserColor.setAttribute("content", previousColor);
    };
  }, [appearance.theme, appearance.motion]);

  useEffect(() => {
    const q = query(collection(db, "items"), orderBy("createdAt", "asc"));
    return onSnapshot(q, (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setError(null);
    }, (err) => {
      console.error(err);
      setError("No pudimos cargar la carta. Intenta recargar la página en unos momentos.");
    });
  }, []);

  useEffect(() => onSnapshot(doc(db, "settings", "general"), (snap) => {
    setAppearance(resolveAppearance(snap.data()));
  }, (err) => console.error("No se pudo cargar la apariencia", err)), []);

  useEffect(() => {
    const q = query(collection(db, "promos"), orderBy("createdAt", "asc"));
    return onSnapshot(q, (snap) => {
      setPromos(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    }, (err) => console.error("No se pudieron cargar las promociones", err));
  }, []);

  useEffect(() => onSnapshot(collection(db, "categoryImages"), (snap) => {
    const images = Object.create(null);
    snap.docs.forEach((d) => { images[d.id] = d.data(); });
    setCategoryImages(images);
  }, (err) => console.error("No se pudieron cargar las fotos de categoría", err)), []);

  const visibleItems = useMemo(() => (items || []).filter((item) => !item.hidden), [items]);
  const heroImage = useMemo(() => {
    const photographedItem = visibleItems.find((item) => item.imageUrl);
    if (photographedItem) return { imageUrl: photographedItem.imageUrl, alt: photographedItem.name };
    const category = sortCategories([...new Set(visibleItems.map((item) => item.category || "Otros"))])
      .find((name) => categoryImages[name]?.imageUrl);
    return category ? { ...categoryImages[category], alt: category } : null;
  }, [visibleItems, categoryImages]);
  const searchTerm = normalize(searchQuery.trim());
  const displayItems = useMemo(() => !searchTerm ? visibleItems : visibleItems.filter((item) =>
    normalize(item.name).includes(searchTerm) || normalize(item.description).includes(searchTerm)
  ), [visibleItems, searchTerm]);
  const activePromos = useMemo(() => promos.filter((promo) => promo.active !== false), [promos]);
  const categories = useMemo(() => sortCategories([...new Set(displayItems.map((item) => item.category || "Otros"))]), [displayItems]);
  const grouped = useMemo(() => {
    const groups = new Map();
    displayItems.forEach((item) => {
      const category = item.category || "Otros";
      if (!groups.has(category)) groups.set(category, []);
      groups.get(category).push(item);
    });
    groups.forEach((group) => group.sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity)));
    return groups;
  }, [displayItems]);

  useEffect(() => {
    setActiveCategory((current) => categories.includes(current) ? current : categories[0] || null);
  }, [categories]);

  useEffect(() => {
    const nav = categoryNavRef.current;
    const selected = nav?.querySelector('[aria-current="true"]');
    if (!selected || !nav.clientWidth) return;
    const bounds = nav.getBoundingClientRect();
    const itemBounds = selected.getBoundingClientRect();
    if (itemBounds.left < bounds.left || itemBounds.right > bounds.right) {
      nav.scrollTo({ left: nav.scrollLeft + itemBounds.left - bounds.left - (nav.clientWidth - selected.clientWidth) / 2, behavior: "instant" });
    }
  }, [activeCategory]);

  useEffect(() => {
    const onScroll = () => {
      setShowBackToTop(window.scrollY > 500);
      const threshold = (headerRef.current?.offsetHeight || 140) + 24;
      let current = categories[0] || null;
      document.querySelectorAll("[data-cat-section]").forEach((section) => {
        if (section.getBoundingClientRect().top <= threshold) current = section.dataset.catSection;
      });
      setActiveCategory(current);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [categories]);

  const scrollBehavior = () => appearance.motion && !window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "smooth" : "auto";
  const scrollToCategory = (category) => {
    const section = document.getElementById(`cat-${category}`);
    if (!section) return;
    setActiveCategory(category);
    window.scrollTo({ top: section.getBoundingClientRect().top + window.scrollY - (headerRef.current?.offsetHeight || 0) - 20, behavior: scrollBehavior() });
  };

  return (
    <main className="site-menu" data-theme={appearance.theme} data-density={appearance.density} data-motion={appearance.motion ? "on" : "off"}>
      <a href="#carta" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-char-900 focus:p-3">Ir a los platos</a>
      <header ref={headerRef} className="menu-header">
        <div className="menu-container">
          <div className="menu-brand">
            <Image src="/logo.png" alt="" width={48} height={48} priority className="menu-brand-logo" />
            <div className="min-w-0 flex-1">
              <p className="menu-brand-name">{RESTAURANT_NAME}</p>
              <p className="menu-eyebrow mt-1">Parrilladas · Carta digital</p>
            </div>
            <p className="menu-header-note">Bienvenidos a nuestra mesa</p>
            <button ref={searchButtonRef} type="button" onClick={() => { setSearchOpen(!searchOpen); if (searchOpen) setSearchQuery(""); }}
              aria-label={searchOpen ? "Cerrar búsqueda" : "Buscar en la carta"} aria-expanded={searchOpen}
              aria-controls="menu-search" className="menu-icon-button">
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
                {searchOpen ? <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /> : <>
                  <circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" strokeWidth="1.5" />
                  <path d="m16 16 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </>}
              </svg>
            </button>
          </div>
          {searchOpen && <div id="menu-search" className="menu-search">
            <label className="sr-only" htmlFor="search-dishes">Buscar platos o ingredientes</label>
            <input id="search-dishes" type="search" autoFocus value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Escape") { setSearchOpen(false); setSearchQuery(""); searchButtonRef.current?.focus(); } }}
              placeholder="Busca un plato o ingrediente…" />
          </div>}
          {categories.length > 0 && <nav ref={categoryNavRef} className="menu-categories scrollbar-none" aria-label="Categorías de la carta">
            {categories.map((category) => <button type="button" key={category} className="menu-category"
              aria-current={activeCategory === category ? "true" : undefined}
              onClick={() => scrollToCategory(category)}>{category}</button>)}
          </nav>}
        </div>
      </header>

      <div className="menu-welcome menu-container">
        {appearance.decorations && <ThemeDecorations theme={appearance.theme} />}
        <MenuIntro theme={appearance.theme} image={heroImage} />
      </div>
      <PromoCarousel promos={activePromos} motion={appearance.motion} />
      <div className={`menu-container menu-layout${categories.length ? " menu-layout-with-nav" : ""}`}>
        {categories.length > 0 && <aside className="menu-sidebar">
          <p className="menu-eyebrow">Explora la carta</p>
          <nav aria-label="Secciones de la carta">
            {categories.map((category, index) => <button type="button" key={category}
              aria-current={activeCategory === category ? "true" : undefined} onClick={() => scrollToCategory(category)}>
              <span className="menu-sidebar-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
              <span className="min-w-0 flex-1">{category}</span>
              <span className="menu-sidebar-count">{grouped.get(category).length}</span>
            </button>)}
          </nav>
          <div className="menu-sidebar-note"><FlameIcon className="h-5 w-5" /><p>Elige, comparte<br />y disfruta.</p></div>
        </aside>}
      <div className="menu-content" id="carta" tabIndex={-1}>
        {!error && visibleItems.length > 0 && <div className="menu-content-heading">
          <p className="menu-eyebrow">{searchTerm ? "Tu búsqueda" : "De nuestra cocina a tu mesa"}</p>
          <span>Precios en CLP</span>
        </div>}
        {error && <div role="alert" className="menu-state">
          <FlameIcon className="mx-auto h-8 w-8 text-ember-400" />
          <p className="menu-state-title">Un momento, por favor</p>
          <p className="mt-2 text-sm">{error}</p>
          <button type="button" onClick={() => window.location.reload()} className="appearance-primary mt-4">Volver a cargar</button>
        </div>}
        {!error && items === null && <div className="animate-pulse space-y-5" role="status" aria-label="Cargando la carta">
          {[0, 1].map((index) => <div key={index} className="rounded-2xl border border-char-700 bg-char-900 p-6">
            <div className="mb-6 h-7 w-32 rounded bg-char-800" />
            {[0, 1, 2].map((row) => <div key={row} className="my-5 flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-char-800" />
              <div className="flex-1 space-y-2"><div className="h-4 w-2/3 rounded bg-char-800" /><div className="h-3 w-1/2 rounded bg-char-800" /></div>
              <div className="h-5 w-12 rounded bg-char-800" />
            </div>)}
          </div>)}
        </div>}
        {!error && items !== null && visibleItems.length === 0 && <div className="menu-state">
          <FlameIcon className="mx-auto h-8 w-8 text-ember-400" />
          <p className="menu-state-title">Estamos preparando la carta</p>
          <p className="mt-2 text-sm">Pronto podrás descubrir nuestros platos aquí.</p>
        </div>}
        {!error && searchTerm && visibleItems.length > 0 && <div className="menu-search-results">
          <p role="status">{displayItems.length} {displayItems.length === 1 ? "plato encontrado" : "platos encontrados"}</p>
          <button type="button" onClick={() => setSearchQuery("")}>Limpiar búsqueda ×</button>
        </div>}
        {!error && visibleItems.length > 0 && searchTerm && displayItems.length === 0 && <div className="menu-state">
          <p className="menu-state-title">No encontramos “{searchQuery}”</p>
          <p className="mt-2 text-sm">Prueba con otro nombre o ingrediente.</p>
          <button type="button" onClick={() => setSearchQuery("")} className="appearance-primary mt-4">Ver toda la carta</button>
        </div>}
        {categories.map((category, index) => <MenuSection key={category} category={category}
          items={grouped.get(category)} image={categoryImages[category]} index={index} />)}
      </div>
      </div>

      <footer className="menu-footer">
        <FlameIcon className="mx-auto mb-3 h-7 w-7 text-ember-400" />
        <p className="menu-footer-brand">{RESTAURANT_NAME}</p>
        <p className="mb-6 mt-1">Siempre hay un lugar en nuestra mesa.</p>
        {(INSTAGRAM_URL || FACEBOOK_URL) && (
          <div className="mb-4 flex justify-center gap-4">
            {INSTAGRAM_URL && (
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="text-smoke-300 transition-colors hover:text-ember-400"
              >
                <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
                  <rect
                    x="3"
                    y="3"
                    width="18"
                    height="18"
                    rx="5"
                    stroke="currentColor"
                    strokeWidth="1.6"
                  />
                  <circle
                    cx="12"
                    cy="12"
                    r="4"
                    stroke="currentColor"
                    strokeWidth="1.6"
                  />
                  <circle cx="17.2" cy="6.8" r="1" fill="currentColor" />
                </svg>
              </a>
            )}
            {FACEBOOK_URL && (
              <a
                href={FACEBOOK_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="text-smoke-300 transition-colors hover:text-ember-400"
              >
                <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
                  <path
                    d="M14 9h2.5V6H14c-1.93 0-3.5 1.57-3.5 3.5V11H8v3h2.5v6h3v-6h2.3l.7-3h-3V9.5c0-.3.2-.5.5-.5Z"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinejoin="round"
                  />
                </svg>
              </a>
            )}
          </div>
        )}

        <a href="/admin" className="inline-block px-3 py-3 text-smoke-300 underline-offset-4 hover:underline">Administración</a>
      </footer>
      {showBackToTop && <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: scrollBehavior() })}
        aria-label="Volver arriba" className="menu-icon-button menu-back-top">
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
          <path d="M12 19V5m-6 6 6-6 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>}
    </main>
  );
}
