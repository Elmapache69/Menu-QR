"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { formatCLP, sortCategories } from "@/lib/format";

const RESTAURANT_NAME =
  process.env.NEXT_PUBLIC_RESTAURANT_NAME || "Rincón El Sauce";

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

  const categories = useMemo(() => {
    if (!items) return [];
    const set = new Set(items.map((i) => i.category).filter(Boolean));
    return sortCategories([...set]);
  }, [items]);

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
    <main className="min-h-screen bg-char-950 pb-16">
      <header className="sticky top-0 z-20 border-b border-char-700 bg-char-950/95 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 pt-4">
          <Image
            src="/logo.png"
            alt={RESTAURANT_NAME}
            width={52}
            height={52}
            className="rounded-full"
            priority
          />
          <div>
            <h1 className="font-display text-3xl leading-none tracking-wide text-smoke-100">
              {RESTAURANT_NAME}
            </h1>
            <p className="text-xs text-ember-400">Parrilladas</p>
          </div>
        </div>

        {categories.length > 0 && (
          <nav className="scrollbar-none mt-3 flex gap-2 overflow-x-auto px-4 pb-3">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => scrollTo(cat)}
                className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-sm transition-colors ${
                  activeCategory === cat
                    ? "border-ember-500 bg-ember-600 text-smoke-100"
                    : "border-char-600 text-smoke-300 hover:border-ember-500"
                }`}
              >
                {cat}
              </button>
            ))}
          </nav>
        )}
      </header>

      <div className="mx-auto max-w-2xl px-4">
        {error && (
          <p className="mt-8 rounded border border-ember-700 bg-char-900 p-4 text-sm text-smoke-300">
            {error}
          </p>
        )}

        {!error && items === null && (
          <p className="mt-10 text-center text-smoke-300">Cargando carta…</p>
        )}

        {!error && items !== null && items.length === 0 && (
          <div className="mt-16 text-center text-smoke-300">
            <p className="font-display text-2xl text-ember-400">
              La carta está vacía
            </p>
            <p className="mt-2 text-sm">
              Entra al panel de administración para agregar los primeros
              platos.
            </p>
          </div>
        )}

        {categories.map((cat) => (
          <section key={cat} id={`cat-${cat}`} className="mt-10 scroll-mt-32">
            <div className="mb-4 flex items-center gap-3">
              <h2 className="font-display text-2xl tracking-wide text-ember-400">
                {cat}
              </h2>
              <div className="h-px flex-1 bg-char-700" />
            </div>

            <ul className="divide-y divide-char-800">
              {grouped[cat].map((item) => (
                <li key={item.id} className="flex items-start gap-4 py-4">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      width={72}
                      height={72}
                      className="h-[72px] w-[72px] flex-shrink-0 rounded object-cover"
                    />
                  ) : (
                    <div className="flex h-[72px] w-[72px] flex-shrink-0 items-center justify-center rounded bg-char-800 text-2xl">
                      🔥
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="font-medium text-smoke-100">
                        {item.name}
                      </h3>
                      <span className="whitespace-nowrap font-display text-lg text-ember-400">
                        {formatCLP(item.price)}
                      </span>
                    </div>
                    {item.description && (
                      <p className="mt-1 text-sm text-smoke-300">
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

      <footer className="mt-16 text-center text-xs text-char-600">
        <a href="/admin" className="hover:text-smoke-300">
          Panel de administración
        </a>
      </footer>
    </main>
  );
}
