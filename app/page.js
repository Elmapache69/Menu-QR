"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  formatCLP,
  sortCategories,
  categoryKicker,
  resolveCategoryImageHeight,
} from "@/lib/format";
import FlameIcon from "@/components/FlameIcon";
import ThemeDecorations from "@/components/ThemeDecorations";
import PromoCarousel from "@/components/PromoCarousel";
import CategoryImageBlock from "@/components/CategoryImageBlock";

const RESTAURANT_NAME =
  process.env.NEXT_PUBLIC_RESTAURANT_NAME || "Rincón El Sauce";

const INSTAGRAM_URL = process.env.NEXT_PUBLIC_INSTAGRAM_URL || "";
const FACEBOOK_URL = process.env.NEXT_PUBLIC_FACEBOOK_URL || "";

function normalize(str) {
  return (str || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

const THEME_EMOJI = {
  halloween: "🎃",
  christmas: "🎄",
  fiestasPatrias: "🇨🇱",
};

export default function MenuPage() {
  const [items, setItems] = useState(null);
  const [promos, setPromos] = useState([]);
  const [categoryImages, setCategoryImages] = useState({});
  const [theme, setTheme] = useState("default");

  // El fondo de <body> es ANCESTRO de <main>, así que una variable CSS
  // puesta solo en <main data-theme=...> nunca le llega (las variables
  // CSS no suben). Por eso el tema también se aplica en <html>.
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [error, setError] = useState(null);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 500);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
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
    const unsub = onSnapshot(doc(db, "settings", "general"), (snap) => {
      setTheme(snap.data()?.theme || "default");
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const q = query(collection(db, "promos"), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      setPromos(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "categoryImages"), (snap) => {
      const map = {};
      snap.docs.forEach((d) => {
        const data = d.data();
        map[d.id] = {
          imageUrl: data.imageUrl,
          position: data.position === "left" ? "left" : "right",
          size: data.size || "auto",
          customHeight: data.customHeight || null,
          shape: data.shape || "rect",
          textGap: data.textGap,
          layout: data.layout || "beside",
          focusY: data.focusY,
        };
      });
      setCategoryImages(map);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!activeCategory) return;
    const onScroll = () => {
      const sections = document.querySelectorAll("[data-cat-section]");
      let current = activeCategory;
      sections.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.top <= 140) current = el.dataset.catSection;
      });
      setActiveCategory(current);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [activeCategory]);

  // Los platos marcados como ocultos desde el admin no se muestran aquí.
  const visibleItems = useMemo(
    () => (items || []).filter((i) => !i.hidden),
    [items]
  );

  const searchTerm = normalize(searchQuery.trim());
  const displayItems = useMemo(() => {
    if (!searchTerm) return visibleItems;
    return visibleItems.filter(
      (i) =>
        normalize(i.name).includes(searchTerm) ||
        normalize(i.description).includes(searchTerm)
    );
  }, [visibleItems, searchTerm]);

  const activePromos = useMemo(
    () => promos.filter((p) => p.active !== false),
    [promos]
  );

  const categories = useMemo(() => {
    const set = new Set(displayItems.map((i) => i.category).filter(Boolean));
    const sorted = sortCategories([...set]);
    if (sorted.length && activeCategory === null) setActiveCategory(sorted[0]);
    return sorted;
  }, [displayItems]); // eslint-disable-line react-hooks/exhaustive-deps

  const grouped = useMemo(() => {
    const acc = displayItems.reduce((acc, item) => {
      const cat = item.category || "Otros";
      acc[cat] = acc[cat] || [];
      acc[cat].push(item);
      return acc;
    }, {});
    // Respeta el orden que el admin dejó para cada categoría (flechas
    // subir/bajar). Los platos sin "order" (más antiguos) conservan su
    // orden por fecha de creación.
    Object.keys(acc).forEach((cat) => {
      acc[cat].sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity));
    });
    return acc;
  }, [displayItems]);

  const scrollTo = (cat) => {
    setActiveCategory(cat);
    document
      .getElementById(`cat-${cat}`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <main className="min-h-screen pb-20" data-theme={theme}>
      <ThemeDecorations theme={theme} />
      <header className="sticky top-0 z-20 border-b border-char-800 bg-char-950/90 backdrop-blur">
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
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-2xl leading-none tracking-wide text-smoke-100 sm:text-3xl">
              {RESTAURANT_NAME}
            </h1>
            <p className="mt-1 text-[10px] uppercase tracking-[0.25em] text-ember-400 sm:text-[11px]">
              Parrilladas{" "}
              {THEME_EMOJI[theme] && (
                <span className="tracking-normal">{THEME_EMOJI[theme]}</span>
              )}
            </p>
          </div>
          <button
            onClick={() => {
              setSearchOpen((v) => !v);
              if (searchOpen) setSearchQuery("");
            }}
            aria-label="Buscar en la carta"
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-smoke-300 transition-colors hover:text-ember-400"
          >
            {searchOpen ? (
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                <path
                  d="M6 6l12 12M18 6 6 18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="2" />
                <path
                  d="m20 20-3.8-3.8"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            )}
          </button>
        </div>

        {searchOpen && (
          <div className="mx-auto mt-3 max-w-xl px-4 sm:px-5">
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar un plato…"
              className="w-full rounded-full border border-char-700 bg-char-900 px-4 py-2 text-sm text-smoke-100 placeholder:text-smoke-300 focus:border-ember-500"
            />
          </div>
        )}

        <div className="mx-auto mt-3 h-[2px] max-w-xl px-4 sm:px-0">
          <div className="ember-rule h-full" />
        </div>

        {categories.length > 0 && (
          <div className="relative">
            <nav className="scrollbar-none mx-auto flex max-w-xl gap-2 overflow-x-auto px-4 py-3 sm:px-5">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => scrollTo(cat)}
                  className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition-all sm:px-4 ${
                    activeCategory === cat
                      ? "bg-gradient-to-r from-ember-600 to-ember-500 text-smoke-100 brand-glow"
                      : "bg-char-900 text-smoke-300 ring-1 ring-char-700 hover:ring-ember-600/50"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </nav>
            <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-char-950 to-transparent" />
          </div>
        )}
      </header>

      <PromoCarousel promos={activePromos} />

      <div className="mx-auto max-w-xl px-4 sm:px-5">
        {error && (
          <p className="mt-8 rounded-lg border border-ember-700 bg-char-900 p-4 text-sm text-smoke-300">
            {error}
          </p>
        )}

        {!error && items === null && (
          <div className="mt-10 animate-pulse space-y-10">
            {[0, 1].map((section) => (
              <div key={section}>
                <div className="mb-5 flex items-center gap-3">
                  <div className="h-5 w-5 rounded-full bg-char-800" />
                  <div className="h-6 w-32 rounded bg-char-800" />
                  <div className="h-[2px] flex-1 bg-char-800" />
                </div>
                <div className="space-y-4">
                  {[0, 1, 2].map((row) => (
                    <div key={row} className="flex items-center gap-3 py-1">
                      <div className="h-4 w-36 rounded bg-char-800" />
                      <div className="h-px flex-1 bg-char-800" />
                      <div className="h-4 w-14 rounded bg-char-800" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
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

        {!error &&
          visibleItems.length > 0 &&
          searchTerm &&
          displayItems.length === 0 && (
            <div className="mt-16 text-center text-smoke-300">
              <p className="font-display text-xl tracking-wide text-ember-400">
                No encontramos "{searchQuery}"
              </p>
              <p className="mt-2 text-sm">Prueba con otra palabra.</p>
            </div>
          )}

        {categories.map((cat) => (
          <section
            key={cat}
            id={`cat-${cat}`}
            data-cat-section={cat}
            className="mt-12 scroll-mt-36"
          >
            <div className="mb-5">
              {categoryKicker(cat) && (
                <p className="mb-1 pl-7 text-[11px] font-medium uppercase tracking-[0.15em] text-ember-500/80">
                  {categoryKicker(cat)}
                </p>
              )}
              <div className="flex items-center gap-3">
                <FlameIcon className="h-5 w-5 flex-shrink-0 text-ember-500" />
                <h2 className="font-display text-[1.7rem] leading-none tracking-wide text-smoke-100">
                  {cat}
                </h2>
                <div className="ember-rule h-[2px] flex-1 opacity-70" />
              </div>
            </div>

            {(() => {
              const itemList = (
                <ul className="divide-y divide-char-800/80">
                  {grouped[cat].map((item) => (
                    <li key={item.id} className="flex items-start gap-3 py-4 sm:gap-4">
                      {item.imageUrl && (
                        <div className="group relative flex-shrink-0 overflow-hidden rounded-lg">
                          <Image
                            src={item.imageUrl}
                            alt={item.name}
                            width={96}
                            height={96}
                            className="h-20 w-20 rounded-lg object-cover transition-transform duration-300 ease-out active:scale-105 sm:h-24 sm:w-24 sm:group-hover:scale-105"
                          />
                          <div className="pointer-events-none absolute inset-0 rounded-lg ring-1 ring-inset ring-black/20" />
                          <div className="pointer-events-none absolute inset-0 rounded-lg bg-gradient-to-t from-ember-700/10 to-transparent" />
                        </div>
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
                          <span className="ml-auto whitespace-nowrap font-display text-xl tracking-wide text-ember-400 [text-shadow:0_0_14px_rgba(232,114,44,0.35)] sm:ml-0">
                            {formatCLP(item.price)}
                          </span>
                        </div>
                        {item.description && (
                          <p className="mt-1 text-sm italic leading-snug text-smoke-100/70">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              );

              const catImg = categoryImages[cat];
              if (!catImg) return itemList;

              return (
                <CategoryImageBlock
                  imageUrl={catImg.imageUrl}
                  alt={cat}
                  shape={catImg.shape}
                  height={resolveCategoryImageHeight(catImg, grouped[cat].length)}
                  position={catImg.position}
                  gap={catImg.textGap}
                  layout={catImg.layout}
                  focusY={catImg.focusY}
                >
                  {itemList}
                </CategoryImageBlock>
              );
            })()}
          </section>
        ))}
      </div>

      <footer className="mt-20 text-center text-xs text-char-600">
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
        <a href="/admin" className="hover:text-smoke-300">
          Panel de administración
        </a>
      </footer>

      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="Volver arriba"
        className={`fixed bottom-5 right-5 z-30 flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-r from-ember-600 to-ember-500 text-smoke-100 brand-glow transition-all duration-300 ${
          showBackToTop
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-4 opacity-0"
        }`}
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
          <path
            d="M12 19V5M12 5l-6 6M12 5l6 6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </main>
  );
}
