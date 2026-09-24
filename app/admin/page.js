"use client";

import { useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import AdminItemForm from "@/components/AdminItemForm";
import AdminItemList from "@/components/AdminItemList";
import AdminPromoForm from "@/components/AdminPromoForm";
import AdminPromoList from "@/components/AdminPromoList";

export default function AdminPage() {
  const [user, setUser] = useState(undefined); // undefined = cargando
  const [tab, setTab] = useState("items");

  const [items, setItems] = useState([]);
  const [showItemForm, setShowItemForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [promos, setPromos] = useState([]);
  const [showPromoForm, setShowPromoForm] = useState(false);
  const [editingPromo, setEditingPromo] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;
    const qItems = query(collection(db, "items"), orderBy("createdAt", "asc"));
    const unsubItems = onSnapshot(qItems, (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    const qPromos = query(
      collection(db, "promos"),
      orderBy("createdAt", "asc")
    );
    const unsubPromos = onSnapshot(qPromos, (snap) => {
      setPromos(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubItems();
      unsubPromos();
    };
  }, [user]);

  if (user === undefined) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-char-950 text-smoke-300">
        Cargando…
      </main>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  const existingCategories = Array.from(
    new Set(items.map((i) => i.category).filter(Boolean))
  );

  return (
    <main className="min-h-screen bg-char-950 pb-16">
      <header className="border-b border-char-700 bg-char-900 px-4 py-4">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <h1 className="font-display text-2xl tracking-wide text-smoke-100">
            Panel de administración
          </h1>
          <button
            onClick={() => signOut(auth)}
            className="text-sm text-smoke-300 hover:text-ember-400"
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4">
        <div className="mt-6 flex items-center justify-between">
          <a href="/" className="text-sm text-smoke-300 hover:text-ember-400">
            ← Ver carta pública
          </a>
        </div>

        <div className="mt-4 flex gap-2 border-b border-char-800">
          <button
            onClick={() => setTab("items")}
            className={`border-b-2 px-3 py-2 text-sm font-medium ${
              tab === "items"
                ? "border-ember-500 text-ember-400"
                : "border-transparent text-smoke-300 hover:text-smoke-100"
            }`}
          >
            Platos
          </button>
          <button
            onClick={() => setTab("promos")}
            className={`border-b-2 px-3 py-2 text-sm font-medium ${
              tab === "promos"
                ? "border-ember-500 text-ember-400"
                : "border-transparent text-smoke-300 hover:text-smoke-100"
            }`}
          >
            Promociones y eventos
          </button>
        </div>

        {tab === "items" && (
          <>
            <div className="mt-4 flex justify-end">
              {!showItemForm && (
                <button
                  onClick={() => {
                    setEditingItem(null);
                    setShowItemForm(true);
                  }}
                  className="rounded bg-ember-600 px-4 py-2 font-medium text-smoke-100 hover:bg-ember-500"
                >
                  + Agregar plato
                </button>
              )}
            </div>

            {showItemForm && (
              <div className="mt-4">
                <AdminItemForm
                  editingItem={editingItem}
                  existingCategories={existingCategories}
                  onDone={() => {
                    setShowItemForm(false);
                    setEditingItem(null);
                  }}
                />
              </div>
            )}

            <AdminItemList
              items={items}
              onEdit={(item) => {
                setEditingItem(item);
                setShowItemForm(true);
              }}
            />
          </>
        )}

        {tab === "promos" && (
          <>
            <p className="mt-4 text-sm text-smoke-300">
              Aparecen como un carrusel arriba de la carta pública. Úsalas
              para 2x1, cumpleaños, fiestas patrias, partidos, etc.
            </p>
            <div className="mt-4 flex justify-end">
              {!showPromoForm && (
                <button
                  onClick={() => {
                    setEditingPromo(null);
                    setShowPromoForm(true);
                  }}
                  className="rounded bg-ember-600 px-4 py-2 font-medium text-smoke-100 hover:bg-ember-500"
                >
                  + Agregar promoción
                </button>
              )}
            </div>

            {showPromoForm && (
              <div className="mt-4">
                <AdminPromoForm
                  editingPromo={editingPromo}
                  onDone={() => {
                    setShowPromoForm(false);
                    setEditingPromo(null);
                  }}
                />
              </div>
            )}

            <AdminPromoList
              promos={promos}
              onEdit={(promo) => {
                setEditingPromo(promo);
                setShowPromoForm(true);
              }}
            />
          </>
        )}
      </div>
    </main>
  );
}

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError("Correo o contraseña incorrectos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-char-950 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 rounded-lg border border-char-700 bg-char-900 p-6"
      >
        <h1 className="font-display text-2xl tracking-wide text-ember-400">
          Ingreso administración
        </h1>
        <div>
          <label className="mb-1 block text-sm text-smoke-300">Correo</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded border border-char-600 bg-char-800 px-3 py-2 text-smoke-100 focus:border-ember-500"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-smoke-300">
            Contraseña
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded border border-char-600 bg-char-800 px-3 py-2 text-smoke-100 focus:border-ember-500"
            required
          />
        </div>
        {error && <p className="text-sm text-ember-400">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-ember-600 px-4 py-2 font-medium text-smoke-100 hover:bg-ember-500 disabled:opacity-50"
        >
          {loading ? "Ingresando…" : "Ingresar"}
        </button>
      </form>
    </main>
  );
}
