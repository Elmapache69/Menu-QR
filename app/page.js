"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { formatCLP, sortCategories } from "@/lib/format";

const RESTAURANT_NAME =
  process.env.NEXT_PUBLIC_RESTAURANT_NAME || "Rincón El Sauce";

function FlameIcon({ className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M12 2c.5 3-2.5 4.2-3.3 6.7C7.9 11 8.4 13 10 14c-.6-1.6.1-2.7 1-3.6.3 1.4 1.1 2 1.9 2.8 1 1 1.4 2.2 1.1 3.5 2-1 3-2.9 3-4.9 0-3.4-2.6-4-3-6-.3 1.3-1 1.7-1.7.9-.6-.8-.5-2.3-.3-4.7Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path
        d="M9.5 15.8c.2 2 1.9 3.4 3.9 3.1"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function MenuPage() {
  const [items, setItems] = useState(null);
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

  const categories = useMemo(() => {
    if (!items) return [];
    const set = new Set(items.map((i) => i.category).filter(Boolean));
    const sorted = sortCategories([...set]);
    if (sorted.length && activeCategory === null) setActiveCategory(sorted[0]);
    return sorted;
  }, [items]); // eslint-disable-line react-hooks/exhaustive-deps

  const grouped = useMemo(() => {
    if (!items) return {};
    return items.reduce((acc, item) => {
      const cat = item.category || "Otros";
      acc[cat] = acc[cat] || [];
      acc[cat].push(item);
      return acc;
    }, {});
  }, [items]);

  const scrollTo = (cat) => {
    setActiveCategory(cat);
    document
      .getElementById(`cat-${cat}`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <main className="min-h-screen pb-20">
      <header className="sticky top-0 z-20 border-b border-char-800 bg-char-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-xl items-center gap-3 px-5 pt-5">
          <div className="relative h-14 w-14 flex-shrink-0">
            <div className="absolute inset-0 -z-10 rounded-full bg-ember-600/30 blur-md" />
            <Image
              src="/logo.png"
              alt={RESTAURANT_NAME}
              width={56}
              height={56}
              className="h-14 w-14 rounded-full ring-1 ring-ember-500/40"
              priority
            />
          </div>
          <div>
            <h1 className="font-display text-3xl leading-none tracking-wide text-smoke-100">
              {RESTAURANT_NAME}
            </h1>
            <p className="mt-1 text-[11px] uppercase tracking-[0.25em] text-ember-400">
              Parrilladas
            </p>
          </div>
        </div>

        <div className="mx-auto mt-3 h-[2px] max-w-xl">
          <div className="ember-rule h-full" />
        </div>

        {categories.length > 0 && (
          <nav className="scrollbar-none mx-auto flex max-w-xl gap-2 overflow-x-auto px-5 py-3">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => scrollTo(cat)}
                className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
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

      <div className="mx-auto max-w-xl px-5">
        {error && (
          <p className="mt-8 rounded-lg border border-ember-700 bg-char-900 p-4 text-sm text-smoke-300">
            {error}
          </p>
        )}

        {!error && items === null && (
          <p className="mt-10 text-center text-smoke-300">Cargando carta…</p>
        )}

        {!error && items !== null && items.length === 0 && (
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
            <div className="mb-5 flex items-center gap-3">
              <FlameIcon className="h-5 w-5 flex-shrink-0 text-ember-500" />
              <h2 className="font-display text-[1.7rem] leading-none tracking-wide text-smoke-100">
                {cat}
              </h2>
              <div className="ember-rule h-[2px] flex-1 opacity-70" />
            </div>

            <ul className="divide-y divide-char-800/80">
              {grouped[cat].map((item) => (
                <li key={item.id} className="flex items-start gap-4 py-4">
                  {item.imageUrl && (
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      width={80}
                      height={80}
                      className="h-20 w-20 flex-shrink-0 rounded-md object-cover"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <h3 className="whitespace-nowrap font-medium text-smoke-100">
                        {item.name}
                      </h3>
                      <span
                        className="mb-1 flex-1 border-b border-dotted border-char-600"
                        aria-hidden="true"
                      />
                      <span className="whitespace-nowrap font-display text-lg tracking-wide text-ember-400">
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
    </main>
  );
}
