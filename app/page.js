"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { formatCLP, sortCategories } from "@/lib/format";
import FlameIcon from "@/components/FlameIcon";
import PromoCarousel from "@/components/PromoCarousel";

const RESTAURANT_NAME =
  process.env.NEXT_PUBLIC_RESTAURANT_NAME || "Rincón El Sauce";

function normalize(value) {
  return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export default function MenuPage() {
  const [items, setItems] = useState(null);
  const [promos, setPromos] = useState([]);
  const [promosLoading, setPromosLoading] = useState(true);
  const [promosError, setPromosError] = useState("");
  const [activeCategory, setActiveCategory] = useState(null);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [showBackToStart, setShowBackToStart] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(90);
  const headerRef = useRef(null);
  const browserRef = useRef(null);
  const searchRef = useRef(null);
  const searchButtonRef = useRef(null);
  const categoryNavRef = useRef(null);

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    const measure = () => setHeaderHeight(Math.ceil(header.getBoundingClientRect().height));
    const observer = new ResizeObserver(measure);
    observer.observe(header);
    measure();
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const q = query(collection(db, "items"), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      (err) => {
        console.error(err);
        setError(
          "No se pudo cargar la carta. Revisa la configuración de Firebase."
        );
      }
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    const q = query(collection(db, "promos"), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      setPromos(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setPromosLoading(false);
      setPromosError("");
    }, (err) => {
      console.error(err);
      setPromosLoading(false);
      setPromosError("No pudimos cargar las ofertas y novedades. Puedes seguir consultando los platos.");
    });
    return () => unsub();
  }, []);

  // Los platos marcados como ocultos desde el admin no se muestran aquí.
  const visibleItems = useMemo(
    () => (items || []).filter((i) => !i.hidden),
    [items]
  );

  const searchTerm = normalize(searchQuery.trim());
  const displayItems = useMemo(() => {
    if (!searchTerm) return visibleItems;
    const terms = searchTerm.split(/\s+/);
    return visibleItems.filter((item) => {
      const text = normalize([item.name, item.description, item.category || "Otros"].filter(Boolean).join(" "));
      return terms.every((term) => text.includes(term));
    });
  }, [visibleItems, searchTerm]);
  const hasBrowser = !error && items !== null && visibleItems.length > 0;

  useEffect(() => {
    if (searchOpen && hasBrowser) searchRef.current?.focus({ preventScroll: true });
  }, [searchOpen, hasBrowser]);

  const activePromos = useMemo(
    () => promos.filter((p) => p.active !== false),
    [promos]
  );

  const categories = useMemo(() => {
    return sortCategories([...new Set(displayItems.map((item) => item.category || "Otros"))]);
  }, [displayItems]);

  const grouped = useMemo(() => {
    const groups = new Map();
    displayItems.forEach((item) => {
      const category = item.category || "Otros";
      if (!groups.has(category)) groups.set(category, []);
      groups.get(category).push(item);
    });
    return groups;
  }, [displayItems]);

  useEffect(() => {
    setActiveCategory((current) => categories.includes(current) ? current : categories[0] || null);
  }, [categories]);

  useEffect(() => {
    if (!hasBrowser || !browserRef.current) {
      setShowBackToStart(false);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      setShowBackToStart(!entry.isIntersecting && entry.boundingClientRect.bottom <= headerHeight);
    }, { rootMargin: `-${headerHeight}px 0px 0px 0px` });
    observer.observe(browserRef.current);
    return () => observer.disconnect();
  }, [hasBrowser, headerHeight]);

  useEffect(() => {
    let observer;
    const observeSections = () => {
      observer?.disconnect();
      const threshold = Math.min(headerHeight + 24, window.innerHeight - 1);
      observer = new IntersectionObserver((entries) => {
        const current = entries.find((entry) => entry.isIntersecting);
        if (current) setActiveCategory(current.target.dataset.catSection);
      }, { rootMargin: `-${threshold}px 0px -${window.innerHeight - threshold - 1}px 0px` });
      document.querySelectorAll("[data-cat-section]").forEach((section) => observer.observe(section));
    };
    observeSections();
    window.addEventListener("resize", observeSections);
    return () => { observer.disconnect(); window.removeEventListener("resize", observeSections); };
  }, [categories, headerHeight]);

  useEffect(() => {
    const nav = categoryNavRef.current;
    const selected = nav?.querySelector('[aria-current="true"]');
    if (!selected) return;
    const bounds = nav.getBoundingClientRect();
    const target = selected.getBoundingClientRect();
    if (target.left < bounds.left || target.right > bounds.right) {
      nav.scrollLeft += target.left - bounds.left - (nav.clientWidth - selected.clientWidth) / 2;
    }
  }, [activeCategory]);

  const scrollBehavior = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
  const clearSearch = () => { setSearchQuery(""); searchRef.current?.focus(); };
  const returnToStart = () => {
    browserRef.current?.scrollIntoView({ behavior: scrollBehavior(), block: "start" });
    browserRef.current?.focus({ preventScroll: true });
  };
  const closeSearch = () => {
    setSearchOpen(false);
    setSearchQuery("");
    searchButtonRef.current?.focus({ preventScroll: true });
  };
  const openSearch = () => {
    returnToStart();
    setSearchOpen(true);
  };

  const scrollTo = (cat) => {
    setActiveCategory(cat);
    document
      .getElementById(`cat-${cat}`)
      ?.scrollIntoView({ behavior: scrollBehavior(), block: "start" });
  };

  return (
    <main className="min-h-screen pb-20" style={{ "--menu-header-height": `${headerHeight}px` }}>
      <header ref={headerRef} className="sticky top-0 z-20 border-b border-char-800 bg-char-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-xl items-center gap-3 px-4 pt-4 sm:px-5 sm:pt-5">
          <div className="relative h-12 w-12 flex-shrink-0 sm:h-14 sm:w-14">
            <div className="absolute inset-0 -z-10 rounded-full bg-ember-600/30 blur-md" />
            <Image
              src="/logo.png"
              alt={RESTAURANT_NAME}
              width={56}
              height={56}
              className="h-12 w-12 rounded-full ring-1 ring-ember-500/40 sm:h-14 sm:w-14"
              priority
            />
          </div>
          <div className="min-w-0">
            <h1 className="truncate font-display text-2xl leading-none tracking-wide text-smoke-100 sm:text-3xl">
              {RESTAURANT_NAME}
            </h1>
            <p className="mt-1 text-[10px] uppercase tracking-[0.25em] text-ember-400 sm:text-[11px]">
              Parrilladas
            </p>
          </div>
        </div>

        <div className="mx-auto mt-3 h-[2px] max-w-xl px-4 sm:px-0">
          <div className="ember-rule h-full" />
        </div>

      </header>

      {promosLoading && <div className="promo-carousel" role="status" aria-label="Cargando ofertas y novedades">
        <div className="animate-pulse space-y-3 rounded-xl border border-char-700 bg-char-900 p-4">
          <div className="aspect-[16/10] rounded-lg bg-char-800" />
          <div className="h-4 w-1/3 rounded bg-char-800" />
          <div className="h-6 w-2/3 rounded bg-char-800" />
        </div>
      </div>}
      {promosError && <p role="status" className="promo-carousel text-sm text-smoke-300">{promosError}</p>}
      <PromoCarousel promos={activePromos} />

      {hasBrowser && <section ref={browserRef} id="menu-start" className="menu-browser" tabIndex={-1} aria-label="Explorar la carta">
        {searchTerm && <p role="status" className="menu-search-status">{displayItems.length} {displayItems.length === 1 ? "plato encontrado" : "platos encontrados"}</p>}
        {categories.length > 0 && <div className="menu-category-picker">
          <h2>Elige tu categoría</h2>
          <p>Toca una categoría para ver sus platos.</p>
          <nav ref={categoryNavRef} aria-label="Categorías de la carta" className="menu-category-nav scrollbar-none">
          {categories.map((cat) => (
            <button
              type="button"
              key={cat}
              aria-current={activeCategory === cat ? "true" : undefined}
              onClick={() => scrollTo(cat)}
              className="menu-category-button"
            >
              {cat}
            </button>
          ))}
          </nav>
        </div>}
      </section>}

      <div id="menu-dishes" className="mx-auto max-w-xl px-4 sm:px-5">
        {error && (
          <p className="mt-8 rounded-lg border border-ember-700 bg-char-900 p-4 text-sm text-smoke-300">
            {error}
          </p>
        )}

        {!error && items === null && (
          <p className="mt-10 text-center text-smoke-300">Cargando carta…</p>
        )}

        {!error && items !== null && visibleItems.length === 0 && (
          <div className="mt-16 text-center text-smoke-300">
            <FlameIcon className="mx-auto h-9 w-9 text-ember-500" />
            <p className="mt-3 font-display text-2xl tracking-wide text-ember-400">
              La carta está vacía
            </p>
            <p className="mt-2 text-sm">
              Entra al panel de administración para agregar los primeros
              platos.
            </p>
          </div>
        )}

        {hasBrowser && searchTerm && displayItems.length === 0 && <div className="menu-no-results">
          <p>No encontramos “{searchQuery.trim()}”.</p>
          <p>Prueba con otro nombre, ingrediente o categoría.</p>
          <button type="button" onClick={clearSearch}>Ver toda la carta</button>
        </div>}

        {categories.map((cat) => (
          <section
            key={cat}
            id={`cat-${cat}`}
            data-cat-section={cat}
            className="menu-category-section"
          >
            <div className="menu-category-heading">
              <FlameIcon className="h-5 w-5 flex-shrink-0 text-ember-500" />
              <h2>
                {cat}
              </h2>
              <div className="ember-rule h-[2px] flex-1 opacity-70" aria-hidden="true" />
            </div>

            <ul className="divide-y divide-char-800/80">
              {grouped.get(cat).map((item) => (
                <li key={item.id} className="flex items-start gap-3 py-4 sm:gap-4">
                  {item.imageUrl && (
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      width={80}
                      height={80}
                      className="h-16 w-16 flex-shrink-0 rounded-md object-cover sm:h-20 sm:w-20"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-2">
                      <h3 className="break-words font-medium text-smoke-100">
                        {item.name}
                      </h3>
                      <span
                        className="mb-1 hidden min-w-[16px] flex-1 border-b border-dotted border-char-600 sm:block"
                        aria-hidden="true"
                      />
                      <span className="ml-auto whitespace-nowrap font-display text-lg tracking-wide text-ember-400 sm:ml-0">
                        {formatCLP(item.price)}
                      </span>
                    </div>
                    {item.description && (
                      <p className="mt-1 text-sm italic leading-snug text-smoke-300">
                        {item.description}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <footer className="mt-20 text-center text-xs text-char-600">
        <a href="/admin" className="hover:text-smoke-300">
          Panel de administración
        </a>
      </footer>
      {hasBrowser && <>
        {searchOpen && <form id="menu-search-panel" className="menu-search-panel" role="search" aria-label="Buscar platos"
          onSubmit={(event) => { event.preventDefault(); searchRef.current?.blur(); returnToStart(); }}
          onKeyDown={(event) => { if (event.key === "Escape") { event.preventDefault(); closeSearch(); } }}>
          <div className="menu-search-panel-heading">
            <label htmlFor="dish-search" className="menu-search-label">Busca en la carta</label>
            <button type="button" className="menu-search-clear" onClick={closeSearch} aria-label="Cerrar búsqueda">×</button>
          </div>
          <div className="menu-search-field">
            <input ref={searchRef} id="dish-search" type="search" value={searchQuery} autoComplete="off"
              placeholder="Plato, ingrediente o categoría" aria-controls="menu-dishes" enterKeyHint="search"
              onChange={(event) => setSearchQuery(event.target.value)} />
            {searchQuery && <button type="button" className="menu-search-clear" onClick={clearSearch} aria-label="Limpiar búsqueda">×</button>}
          </div>
        </form>}
        <button ref={searchButtonRef} type="button" className="menu-search-launcher" aria-label="Buscar en la carta"
          aria-expanded={searchOpen} aria-controls="menu-search-panel" onClick={searchOpen ? closeSearch : openSearch}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <circle cx="10.5" cy="10.5" r="6.5" />
            <path d="m16 16 5 5" />
          </svg>
        </button>
      </>}
      {showBackToStart && <button type="button" className="menu-back-start" onClick={returnToStart}
        aria-label="Volver al inicio de la carta">
        <span aria-hidden="true">↑</span> Volver al inicio
      </button>}
    </main>
  );
}
