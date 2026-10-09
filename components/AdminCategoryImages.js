"use client";

import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import { deleteDoc, doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { IMAGE_ACCEPT, uploadToCloudinary, validateImageFile } from "@/lib/cloudinary";
import { resolveCategoryImage } from "@/lib/image-settings";
import useObjectUrl from "@/lib/use-object-url";
import MenuSection from "@/components/MenuSection";
import { ImageRange } from "@/components/ImageControls";
import { useToast } from "@/components/Toast";

function CategoryEditor({ category, data, items, expanded, onToggle }) {
  const inputId = useId();
  const saved = resolveCategoryImage(data);
  const savedSignature = JSON.stringify(saved);
  const previousSaved = useRef(savedSignature);
  const [draft, setDraft] = useState(saved);
  const [file, setFile] = useState(null);
  const [removed, setRemoved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [previewSize, setPreviewSize] = useState("desktop");
  const uploaded = useRef(null);
  const previewUrl = useObjectUrl(file);
  const showToast = useToast();
  const dirty = Boolean(file) || removed || JSON.stringify(draft) !== savedSignature;
  const imageUrl = previewUrl || (removed ? "" : draft.imageUrl);

  useEffect(() => {
    const previous = previousSaved.current;
    setDraft((current) => JSON.stringify(current) === previous ? JSON.parse(savedSignature) : current);
    previousSaved.current = savedSignature;
  }, [savedSignature]);

  const update = (key, value) => { setDraft((current) => ({ ...current, [key]: value })); setError(""); };
  const reset = () => {
    setDraft(saved); setFile(null); setRemoved(false); setError(""); uploaded.current = null;
  };
  const selectFile = (event) => {
    const selected = event.target.files?.[0];
    event.target.value = "";
    if (!selected) return;
    try {
      validateImageFile(selected);
      setFile(selected); setRemoved(false); setError(""); uploaded.current = null;
    } catch (err) { setError(err.message); }
  };

  const save = async () => {
    if (saving || !dirty) return;
    if (!removed && !file && !imageUrl) { setError("Elige una imagen para esta categoría."); return; }
    setSaving(true); setError("");
    try {
      if (removed) {
        await deleteDoc(doc(db, "categoryImages", category));
        setDraft(resolveCategoryImage(null)); setRemoved(false); setFile(null);
        showToast("Imagen de categoría retirada");
      } else {
        let savedUrl = draft.imageUrl;
        if (file) {
          if (uploaded.current?.file !== file) uploaded.current = { file, url: await uploadToCloudinary(file, "category-images") };
          savedUrl = uploaded.current.url;
        }
        const payload = { ...draft, imageUrl: savedUrl };
        await setDoc(doc(db, "categoryImages", category), payload, { merge: true });
        setDraft(payload); setFile(null); uploaded.current = null;
        showToast("Imagen de categoría guardada");
      }
    } catch (err) {
      console.error(err);
      setError(err.code ? "No se pudo guardar. Tus ajustes siguen aquí; vuelve a intentarlo." : err.message || "No se pudo guardar. Intenta de nuevo.");
      showToast("No se pudo guardar", "error");
    } finally { setSaving(false); }
  };

  return <section className="category-editor-card" aria-label={category}>
    <div className="category-editor-summary">
      {data?.imageUrl ? <Image src={data.imageUrl} alt="" width={56} height={56} className="category-editor-thumbnail" />
        : <span className="category-editor-placeholder" aria-hidden="true">＋</span>}
      <div className="min-w-0 flex-1"><h3>{category}</h3><p>{items.length} {items.length === 1 ? "plato visible" : "platos visibles"}{dirty ? " · Cambios sin guardar" : data?.imageUrl ? " · Con imagen" : ""}</p></div>
      <button type="button" onClick={onToggle} aria-expanded={expanded} aria-controls={inputId + "-editor"}
        className="image-secondary">{expanded ? "Cerrar editor" : data?.imageUrl ? "Editar imagen" : "Agregar imagen"}</button>
    </div>
    {expanded && <div id={inputId + "-editor"} className="category-editor-body">
      <fieldset disabled={saving} className="image-editor-grid">
        <legend className="sr-only">Imagen de {category}</legend>
        <div className="image-editor-fields">
          <div className="image-upload">
            <label htmlFor={inputId} className="image-field-label">{imageUrl ? "Cambiar imagen" : "Elige una imagen"}</label>
            <input id={inputId} type="file" accept={IMAGE_ACCEPT} onChange={selectFile} />
            <p>JPG, PNG, WebP, AVIF o GIF · Máximo 10 MB.</p>
            {file && <p>{file.name}</p>}
            {(imageUrl || file) && <button type="button" className="image-text-button" onClick={() => {
              setFile(null); uploaded.current = null;
              if (data?.imageUrl) setRemoved(true);
              else setDraft(resolveCategoryImage(null));
            }}>Quitar imagen</button>}
            {removed && <p>La imagen se retirará al guardar. Puedes deshacer el cambio.</p>}
          </div>
          <ImageRange label="Oscurecer el fondo" value={draft.overlayShade} min={60} max={90}
            onChange={(value) => update("overlayShade", value)} />
          <ImageRange label="Encuadre horizontal" value={draft.imageFocusX} onChange={(value) => update("imageFocusX", value)} />
          <ImageRange label="Encuadre vertical" value={draft.imageFocusY} onChange={(value) => update("imageFocusY", value)} />
        </div>
        <div className="image-editor-preview">
          <div className="image-preview-toolbar"><span>Vista previa</span>
            <div role="group" aria-label="Tamaño de la vista previa">
              {[["desktop", "Escritorio"], ["mobile", "Móvil"]].map(([value, label]) => <button type="button" key={value}
                aria-pressed={previewSize === value} onClick={() => setPreviewSize(value)}>{label}</button>)}
            </div>
          </div>
          <div className="category-editor-preview" data-size={previewSize}>
            <MenuSection category={category} items={items} image={imageUrl ? { ...draft, imageUrl } : null} preview />
          </div>
          <p className="image-preview-help">La foto cubre el fondo de toda la categoría. Ajusta el encuadre y el sombreado para que los nombres y precios se lean con claridad.</p>
          {items.length === 0 && <p className="image-preview-help">Esta categoría todavía no tiene platos visibles para comprobar el texto.</p>}
        </div>
      </fieldset>
      {error && <p role="alert" className="image-editor-error">{error}</p>}
      <div className="image-editor-actions">
        <p role="status">{saving ? "Guardando imagen…" : dirty ? "Tienes cambios sin guardar" : "Los cambios se publican al guardar"}</p>
        <button type="button" onClick={reset} disabled={!dirty || saving} className="image-secondary">Deshacer</button>
        <button type="button" onClick={save} disabled={!dirty || saving || (!file && !imageUrl && !removed)}
          className="appearance-primary">{saving ? "Guardando…" : "Guardar imagen"}</button>
      </div>
    </div>}
  </section>;
}

export default function AdminCategoryImages({ categories, categoryImages, items }) {
  const [expanded, setExpanded] = useState(null);
  if (!categories.length) return <p className="mt-6 text-sm text-smoke-300">Agrega primero un plato para crear una categoría y colocar su imagen.</p>;
  return <div className="category-images-editor">
    <div className="image-editor-heading"><p className="menu-eyebrow">Una imagen para cada sabor</p>
      <h2>Las fotos también cuentan tu carta.</h2>
      <p>Elige una foto de fondo para cada categoría y ajusta cómo se verá detrás de tus platos. Revisa el resultado antes de guardarlo.</p>
    </div>
    <div className="space-y-4">{categories.map((category) => <CategoryEditor key={category} category={category}
      data={categoryImages.find((image) => image.id === category)}
      items={items.filter((item) => !item.hidden && (item.category || "Otros") === category).sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity))}
      expanded={expanded === category} onToggle={() => setExpanded((current) => current === category ? null : category)} />)}</div>
  </div>;
}
