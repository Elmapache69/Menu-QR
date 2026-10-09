"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { THEMES, getTheme, sameAppearance } from "@/lib/appearance";
import { sortCategories } from "@/lib/format";
import { useToast } from "@/components/Toast";
import FlameIcon from "@/components/FlameIcon";
import MenuIntro from "@/components/MenuIntro";
import MenuSection from "@/components/MenuSection";
import ThemeDecorations from "@/components/ThemeDecorations";

const EXAMPLE_ITEMS = [
  { id: "preview-1", name: "Parrillada para compartir", description: "Una selección de sabores para disfrutar en la mesa.", price: 32900, category: "Parrilladas" },
  { id: "preview-2", name: "Lomo a la parrilla", description: "Con el acompañamiento que más te gusta.", price: 14900, category: "Parrilladas" },
];
const RESTAURANT_NAME = process.env.NEXT_PUBLIC_RESTAURANT_NAME || "Rincón El Sauce";

function Toggle({ label, description, checked, onChange }) {
  return (
    <div className="appearance-toggle-row">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-smoke-100">{label}</p>
        <p className="mt-1 text-xs leading-relaxed text-smoke-300">{description}</p>
      </div>
      <button type="button" role="switch" aria-checked={checked} aria-label={label}
        onClick={() => onChange(!checked)} className="appearance-switch"><span /></button>
    </div>
  );
}

export default function AdminTheme({ appearance, items = [], categoryImages = [], loaded = true, loadError = "" }) {
  const [draft, setDraft] = useState(appearance);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [previewCategory, setPreviewCategory] = useState("");
  const previousAppearance = useRef(appearance);
  const showToast = useToast();
  const dirty = !sameAppearance(draft, appearance);

  useEffect(() => {
    const previous = previousAppearance.current;
    setDraft((current) => sameAppearance(current, previous) ? appearance : current);
    previousAppearance.current = appearance;
  }, [appearance]);

  const update = (key, value) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setError("");
  };

  const save = async () => {
    if (!dirty || saving || !loaded || loadError) return;
    setSaving(true);
    setError("");
    try {
      await setDoc(doc(db, "settings", "general"), {
        theme: draft.theme,
        appearance: { density: draft.density, decorations: draft.decorations, motion: draft.motion },
      }, { merge: true });
      showToast("Apariencia actualizada");
    } catch (err) {
      console.error(err);
      setError("No pudimos guardar la apariencia. Tus cambios siguen aquí; vuelve a intentarlo.");
      showToast("No se pudo guardar", "error");
    } finally {
      setSaving(false);
    }
  };

  const visibleItems = items.filter((item) => !item.hidden);
  const previewItems = visibleItems.length ? visibleItems : EXAMPLE_ITEMS;
  const categories = sortCategories([...new Set(previewItems.map((item) => item.category || "Otros"))]);
  const category = categories.includes(previewCategory) ? previewCategory : categories[0];
  const categoryItems = previewItems.filter((item) => (item.category || "Otros") === category)
    .sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity));
  const selected = getTheme(draft.theme);
  const categoryImage = categoryImages.find((image) => image.id === category);
  const photographedItem = previewItems.find((item) => item.imageUrl);
  const firstImageCategory = categories.find((name) => categoryImages.some((image) => image.id === name && image.imageUrl));
  const heroImage = photographedItem ? { imageUrl: photographedItem.imageUrl, alt: photographedItem.name }
    : categoryImages.find((image) => image.id === firstImageCategory);

  return (
    <div className="pb-6">
      <div className="mt-8">
        <p className="menu-eyebrow">La identidad de tu mesa</p>
        <h2 className="appearance-heading">Dale tu estilo a la carta.</h2>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-smoke-300">
          Elige una paleta, ajusta los detalles y mira cómo queda. Los cambios se publican al guardar.
        </p>
        <a href="#appearance-preview" className="mt-3 inline-block py-2 text-sm text-ember-400 underline underline-offset-4 min-[900px]:hidden">Ver vista previa ↓</a>
      </div>
      {(loadError || !loaded) && <p role={loadError ? "alert" : "status"} className="mt-4 text-sm text-smoke-300">
        {loadError || "Cargando la apariencia actual…"}
      </p>}
      <div className="appearance-layout">
        <fieldset disabled={saving || !loaded || Boolean(loadError)} className="min-w-0 disabled:opacity-60">
          <legend className="sr-only">Personalizar apariencia</legend>
          {["Clásicos", "Celebraciones"].map((group) => (
            <div key={group} className="mb-7">
              <h3 className="appearance-section-label">{group}</h3>
              <div className="grid grid-cols-2 gap-3 min-[380px]:grid-cols-3">
                {THEMES.filter((theme) => theme.group === group).map((theme) => (
                  <button type="button" key={theme.id} onClick={() => update("theme", theme.id)}
                    aria-pressed={draft.theme === theme.id} aria-label={theme.name} className="theme-card">
                    <div data-theme={theme.id} className="theme-card-sample" aria-hidden="true">
                      <FlameIcon className="mb-2 h-4 w-4 text-ember-400" />
                      <p className="theme-card-title">A la <span className="text-ember-400">mesa.</span></p>
                      <div className="mt-3 flex items-center gap-1.5">
                        <span className="theme-swatch bg-ember-400" />
                        <span className="theme-swatch bg-ember-600" />
                        <span className="theme-swatch bg-smoke-100" />
                        <span className="ml-auto h-px w-6 bg-char-700" />
                      </div>
                    </div>
                    <div className="px-1 pb-1 pt-3">
                      <p className="text-xs font-medium text-smoke-100">{theme.name}</p>
                      <p className="mt-1 min-h-4 text-[10px] text-smoke-300">
                        {appearance.theme === theme.id ? "Publicado" : draft.theme === theme.id ? "Seleccionado" : theme.group === "Clásicos" ? "Todo el año" : "De temporada"}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
          <div className="mt-8">
            <h3 className="appearance-section-label">Los detalles</h3>
            <fieldset>
              <legend className="text-sm font-medium text-smoke-100">Espacio entre platos</legend>
              <p className="mt-1 text-xs text-smoke-300">Ajusta el ritmo de lectura de tu carta.</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {[["comfortable", "Relajado", "Más aire para cada plato"], ["compact", "Compacto", "Más platos a la vista"]].map(([value, label, description]) => (
                  <label key={value} className={`cursor-pointer rounded-lg border p-3 ${draft.density === value ? "border-ember-400 bg-ember-400/5" : "border-char-700"}`}>
                    <span className="flex items-center gap-2 text-sm">
                      <input type="radio" name="menu-density" value={value} checked={draft.density === value}
                        onChange={() => update("density", value)} className="accent-ember-400" />
                      {label}
                    </span>
                    <span className="mt-1 block text-[11px] text-smoke-300">{description}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <Toggle label="Decoraciones de temporada" description="Luces, telarañas o banderines en los temas de celebración."
              checked={draft.decorations} onChange={(value) => update("decorations", value)} />
            <Toggle label="Movimiento suave" description="Activa el fondo ambiental y el avance automático de promociones."
              checked={draft.motion} onChange={(value) => update("motion", value)} />
          </div>
        </fieldset>
        <div id="appearance-preview" className="appearance-preview-column min-w-0 scroll-mt-6">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="appearance-section-label !mb-0 after:!hidden">Vista previa</h3>
            <span className="text-[11px] text-smoke-300">{visibleItems.length ? "Con tus platos" : "Platos de ejemplo"}</span>
          </div>
          <label htmlFor="preview-category" className="sr-only">Categoría de la vista previa</label>
          <select id="preview-category" value={category} onChange={(event) => setPreviewCategory(event.target.value)}
            className="appearance-category-select">
            {categories.map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
          <div className="appearance-preview-frame">
            <div className="appearance-preview" data-theme={draft.theme} data-density={draft.density}
              data-motion={draft.motion ? "on" : "off"}>
              <div className="appearance-preview-scroll" tabIndex={0} role="region" aria-label="Vista previa de la carta">
                <div className="flex items-center gap-3 border-b border-char-700 px-4 py-4">
                  <Image src="/logo.png" alt="" width={36} height={36} className="h-9 w-9 rounded-full" />
                  <div className="min-w-0">
                    <p className="break-words font-display text-xl leading-none">{RESTAURANT_NAME}</p>
                    <p className="menu-eyebrow mt-1">Parrilladas · Carta</p>
                  </div>
                </div>
                <div className="menu-welcome">
                  <div className="pointer-events-none absolute inset-0" aria-hidden="true"><div className="smoke-blob one" /></div>
                  {draft.decorations && <ThemeDecorations theme={draft.theme} />}
                  <MenuIntro theme={draft.theme} image={heroImage} preview />
                </div>
                <MenuSection category={category} items={categoryItems}
                  image={categoryImage} index={categories.indexOf(category)} preview />
              </div>
            </div>
          </div>
          <p className="mt-3 text-sm font-medium text-smoke-100">{selected.name}</p>
          <p className="mt-1 text-xs leading-relaxed text-smoke-300">{selected.description}</p>
        </div>
      </div>
      {error && <p role="alert" className="mt-4 rounded-lg border border-ember-600 p-3 text-sm text-smoke-100">{error}</p>}
      <div className="appearance-save-bar" data-dirty={dirty || saving}>
        <p role="status" className="min-w-0 flex-1 text-xs text-smoke-300">
          {saving ? "Guardando tu estilo…" : dirty ? "Tienes cambios sin publicar" : "Tu carta está al día"}
        </p>
        <button type="button" disabled={!dirty || saving || !loaded} onClick={() => { setDraft(appearance); setError(""); }}
          className="min-h-11 px-2 text-xs text-smoke-300 hover:text-smoke-100 disabled:opacity-40">Deshacer</button>
        <button type="button" onClick={save} disabled={!dirty || saving || !loaded || Boolean(loadError)}
          className="appearance-primary">{saving ? "Guardando…" : "Guardar apariencia"}</button>
      </div>
    </div>
  );
}
