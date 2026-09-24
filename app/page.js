"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { formatCLP, sortCategories, categoryKicker } from "@/lib/format";
import FlameIcon from "@/components/FlameIcon";
import PromoCarousel from "@/components/PromoCarousel";

const RESTAURANT_NAME =
  process.env.NEXT_PUBLIC_RESTAURANT_NAME || "Rincón El Sauce";

export default function MenuPage() {
  const [items, setItems] = useState(null);
  const [promos, setPromos] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [error, setError] = useState(null);

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

  const activePromos = useMemo(
    () => promos.filter((p) => p.active !== false),
    [promos]
  );

  const categories = useMemo(() => {
    const set = new Set(visibleItems.map((i) => i.category).filter(Boolean));
    const sorted = sortCategories([...set]);
    if (sorted.length && activeCategory === null) setActiveCategory(sorted[0]);
    return sorted;
  }, [visibleItems]); // eslint-disable-line react-hooks/exhaustive-deps

  const grouped = useMemo(() => {
    return visibleItems.reduce((acc, item) => {
      const cat = item.category || "Otros";
      acc[cat] = acc[cat] || [];
      acc[cat].push(item);
      return acc;
    }, {});
  }, [visibleItems]);

  const scrollTo = (cat) => {
    setActiveCategory(cat);
    document
      .getElementById(`cat-${cat}`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <main className="min-h-screen pb-20">
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

        {categories.length > 0 && (
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
          </section>
        ))}
      </div>

      <footer className="mt-20 text-center text-xs text-char-600">
        <a href="/admin" className="hover:text-smoke-300">
          Panel de administración
        </a>
      </footer>
    </main>
  );
}
