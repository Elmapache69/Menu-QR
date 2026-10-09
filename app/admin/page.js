"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import AdminItemForm from "@/components/AdminItemForm";
import AdminItemList from "@/components/AdminItemList";
import AdminPromoForm from "@/components/AdminPromoForm";
import AdminPromoList from "@/components/AdminPromoList";
import AdminCategoryImages from "@/components/AdminCategoryImages";
import AdminTheme from "@/components/AdminTheme";
import { ToastProvider } from "@/components/Toast";
import { sortCategories } from "@/lib/format";
import { resolveAppearance } from "@/lib/appearance";

const RESTAURANT_NAME = process.env.NEXT_PUBLIC_RESTAURANT_NAME || "Rincón El Sauce";

export default function AdminPage() {
  return (
    <ToastProvider>
      <AdminPageInner />
    </ToastProvider>
  );
}

function AdminPageInner() {
  const [user, setUser] = useState(undefined); // undefined = cargando
  const [tab, setTab] = useState("items");

  const [items, setItems] = useState([]);
  const [showItemForm, setShowItemForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [promos, setPromos] = useState([]);
  const [showPromoForm, setShowPromoForm] = useState(false);
  const [editingPromo, setEditingPromo] = useState(null);

  const [categoryImages, setCategoryImages] = useState([]);
  const [appearance, setAppearance] = useState(() => resolveAppearance());
  const [appearanceLoaded, setAppearanceLoaded] = useState(false);
  const [appearanceError, setAppearanceError] = useState("");

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

    const unsubCategoryImages = onSnapshot(
      collection(db, "categoryImages"),
      (snap) => {
        setCategoryImages(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      }
    );

    setAppearanceLoaded(false);
    setAppearanceError("");
    const unsubTheme = onSnapshot(doc(db, "settings", "general"),
      { includeMetadataChanges: true },
      (snap) => {
        if (snap.metadata.hasPendingWrites) return;
        setAppearance(resolveAppearance(snap.data()));
        setAppearanceLoaded(true);
      },
      (err) => {
        console.error(err);
        setAppearanceError("No pudimos cargar la apariencia actual. Recarga la página para volver a intentarlo.");
      }
    );

    return () => {
      unsubItems();
      unsubPromos();
      unsubCategoryImages();
      unsubTheme();
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
    new Set(items.map((i) => i.category || "Otros"))
  );

  return (
    <main className="admin-shell pb-16" data-theme="default">
      <header className="border-b border-char-700 bg-char-900 px-4 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <div className="admin-brand">
            <Image src="/logo.png" alt="" width={40} height={40} />
            <div><h1>Administración</h1><p>{RESTAURANT_NAME}</p></div>
          </div>
          <button
            onClick={() => signOut(auth)}
            className="text-sm text-smoke-300 hover:text-ember-400"
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      <div className={`mx-auto px-4 sm:px-6 ${tab !== "items" ? "max-w-5xl" : "max-w-3xl"}`}>
        <div className="mt-6 flex items-center justify-between">
          <a href="/" className="text-sm text-smoke-300 hover:text-ember-400">
            ← Ver carta pública
          </a>
        </div>

        <nav className="admin-tabs scrollbar-none" aria-label="Secciones de administración">
          {[["items", "Platos"], ["promos", "Promociones"], ["categoryImages", "Fotos de categoría"], ["theme", "Apariencia"]].map(([value, label]) => (
            <button type="button" key={value} onClick={() => setTab(value)}
              aria-pressed={tab === value} className="admin-tab">{label}</button>
          ))}
        </nav>

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
                  key={editingItem?.id || "new"}
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
                  key={editingPromo?.id || "new"}
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

        {tab === "categoryImages" && (
          <AdminCategoryImages
            categories={sortCategories(existingCategories)}
            categoryImages={categoryImages}
            items={items}
          />
        )}

        {tab === "theme" && <AdminTheme appearance={appearance} items={items} categoryImages={categoryImages}
          loaded={appearanceLoaded} loadError={appearanceError} />}
      </div>
    </main>
  );
}

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (err) {
      setError(err.code === "auth/network-request-failed"
        ? "No pudimos conectarnos. Revisa tu conexión y vuelve a intentarlo."
        : err.code === "auth/too-many-requests"
          ? "Hubo varios intentos de ingreso. Espera unos minutos y vuelve a intentarlo."
          : "No pudimos ingresar. Revisa tu correo y contraseña.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="admin-login" data-theme="default">
      <div className="login-layout">
        <div className="login-brand">
          <div className="login-brand-logo">
            <Image src="/logo.png" alt="" width={52} height={52} priority />
            <span>{RESTAURANT_NAME}</span>
          </div>
          <h1>La carta de tu casa,<br /><em>en tus manos.</em></h1>
          <p className="login-brand-description">Cuida cada detalle de tu carta: los platos, las fotografías y el estilo que recibe a tus clientes.</p>
          <a href="/" className="login-back"><span aria-hidden="true">←</span> Volver a la carta</a>
        </div>
        <form onSubmit={handleSubmit} className="login-form" aria-labelledby="login-title" aria-busy={loading}>
          <p className="menu-eyebrow">Administración</p>
          <h2 id="login-title">Bienvenido de vuelta.</h2>
          <p className="login-form-intro">Ingresa con tu cuenta para gestionar la carta.</p>
          <label htmlFor="admin-email">Correo electrónico</label>
          <input id="admin-email" name="email" type="email" autoComplete="username" value={email}
            onChange={(event) => { setEmail(event.target.value); setError(""); }}
            placeholder="tu@correo.cl" required disabled={loading} />
          <label htmlFor="admin-password">Contraseña</label>
          <div className="login-password">
            <input id="admin-password" name="password" type={showPassword ? "text" : "password"}
              autoComplete="current-password" value={password}
              onChange={(event) => { setPassword(event.target.value); setError(""); }}
              required disabled={loading} />
            <button type="button" aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              aria-controls="admin-password" aria-pressed={showPassword}
              onClick={() => setShowPassword(!showPassword)}>{showPassword ? "Ocultar" : "Mostrar"}</button>
          </div>
          {error && <p role="alert" className="login-error">{error}</p>}
          <button type="submit" disabled={loading} className="appearance-primary login-submit">
            {loading ? "Ingresando…" : "Ingresar al panel"}
          </button>
        </form>
      </div>
    </main>
  );
}
