"use client";

import { useRef, useState } from "react";
import { addDoc, collection, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { IMAGE_ACCEPT, uploadToCloudinary, validateImageFile } from "@/lib/cloudinary";
import { resolvePromoImage } from "@/lib/image-settings";
import useObjectUrl from "@/lib/use-object-url";
import { useToast } from "@/components/Toast";
import { ImageChoices, ImageRange } from "@/components/ImageControls";
import PromoSlide from "@/components/PromoSlide";

export default function AdminPromoForm({ editingPromo, onDone }) {
  const [form, setForm] = useState(() => ({
    title: editingPromo?.title || "", description: editingPromo?.description || "",
    active: editingPromo?.active !== false, ...resolvePromoImage(editingPromo),
  }));
  const [file, setFile] = useState(null);
  const [removed, setRemoved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [previewSize, setPreviewSize] = useState("desktop");
  const uploaded = useRef(null);
  const previewUrl = useObjectUrl(file);
  const imageUrl = previewUrl || (removed ? "" : editingPromo?.imageUrl || "");
  const showToast = useToast();
  const update = (key, value) => { setForm((current) => ({ ...current, [key]: value })); setError(""); };

  const selectFile = (event) => {
    const selected = event.target.files?.[0];
    event.target.value = "";
    if (!selected) return;
    try {
      validateImageFile(selected);
      setFile(selected); setRemoved(false); setError(""); uploaded.current = null;
    } catch (err) { setError(err.message); }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (saving) return;
    setError("");
    if (!form.title.trim() && !file && (!editingPromo?.imageUrl || removed)) {
      setError("Agrega al menos un título o una imagen."); return;
    }
    setSaving(true);
    try {
      let savedUrl = removed ? "" : editingPromo?.imageUrl || "";
      if (file) {
        if (uploaded.current?.file !== file) uploaded.current = { file, url: await uploadToCloudinary(file, "promo-images") };
        savedUrl = uploaded.current.url;
      }
      const payload = { ...form, title: form.title.trim(), description: form.description.trim(), imageUrl: savedUrl };
      if (editingPromo) await updateDoc(doc(db, "promos", editingPromo.id), payload);
      else await addDoc(collection(db, "promos"), { ...payload, createdAt: serverTimestamp() });
      showToast(editingPromo ? "Promoción actualizada" : "Promoción agregada");
      onDone();
    } catch (err) {
      console.error(err);
      setError(err.code ? "No se pudo guardar la promoción. Conservamos tus cambios para que puedas intentarlo de nuevo." : err.message || "No se pudo guardar. Intenta de nuevo.");
      showToast("No se pudo guardar", "error");
    } finally { setSaving(false); }
  };

  return <form onSubmit={handleSubmit} className="image-editor" aria-busy={saving}>
    <div className="image-editor-heading">
      <p className="menu-eyebrow">Promociones & encuentros</p>
      <h3>{editingPromo ? "Cuida cada detalle de tu promoción." : "Una nueva invitación a la mesa."}</h3>
      <p>Elige tu imagen y comprueba cómo se verá antes de publicarla.</p>
    </div>
    <fieldset disabled={saving} className="image-editor-grid">
      <legend className="sr-only">Editar promoción</legend>
      <div className="image-editor-fields">
        <div><label htmlFor="promo-title" className="image-field-label">Título</label>
          <input id="promo-title" value={form.title} onChange={(event) => update("title", event.target.value)}
            className="image-field" placeholder="Ej: 2x1 en tragos los jueves" /></div>
        <div><label htmlFor="promo-description" className="image-field-label">Descripción</label>
          <textarea id="promo-description" value={form.description} onChange={(event) => update("description", event.target.value)}
            className="image-field" rows={3} placeholder="Los detalles de tu promoción" /></div>
        <div className="image-upload">
          <label htmlFor="promo-photo" className="image-field-label">{imageUrl ? "Cambiar imagen" : "Agregar imagen"}</label>
          <input id="promo-photo" type="file" accept={IMAGE_ACCEPT} onChange={selectFile} />
          <p>JPG, PNG, WebP, AVIF o GIF · Máximo 10 MB.</p>
          {file && <p>{file.name}</p>}
          {(imageUrl || file) && <button type="button" className="image-text-button"
            onClick={() => { setFile(null); setRemoved(true); uploaded.current = null; }}>Quitar imagen</button>}
          {removed && editingPromo?.imageUrl && <button type="button" className="image-text-button"
            onClick={() => setRemoved(false)}>Restaurar imagen guardada</button>}
        </div>
        {imageUrl && <>
          <ImageChoices label="Cómo mostrar la imagen" value={form.imageFit} onChange={(value) => update("imageFit", value)}
            options={[["contain", "Imagen completa", "Ideal para afiches con texto"], ["cover", "Rellenar", "Recorta los bordes para llenar el espacio"]]} />
          {form.imageFit === "cover" && <>
            <ImageRange label="Encuadre horizontal" value={form.imageFocusX} onChange={(value) => update("imageFocusX", value)} />
            <ImageRange label="Encuadre vertical" value={form.imageFocusY} onChange={(value) => update("imageFocusY", value)} />
          </>}
          <ImageChoices label="Ubicación del texto" value={form.textPosition} onChange={(value) => update("textPosition", value)}
            options={[["below", "Debajo de la imagen"], ["overlay", "Sobre la imagen"]]} />
        </>}
        <label className="image-checkbox"><input type="checkbox" checked={form.active}
          onChange={(event) => update("active", event.target.checked)} />Mostrar en la carta</label>
      </div>
      <div className="image-editor-preview">
        <div className="image-preview-toolbar"><span>Vista previa</span>
          <div role="group" aria-label="Tamaño de la vista previa">
            {[["desktop", "Escritorio"], ["mobile", "Móvil"]].map(([value, label]) => <button type="button" key={value}
              aria-pressed={previewSize === value} onClick={() => setPreviewSize(value)}>{label}</button>)}
          </div>
        </div>
        <div className="promo-editor-preview" data-size={previewSize}><PromoSlide promo={{ ...form, imageUrl }} /></div>
        <p className="image-preview-help">{form.imageFit === "contain" ? "La imagen se muestra completa, sin cortar sus bordes." : "Mueve el encuadre para mantener visible lo más importante."}</p>
      </div>
    </fieldset>
    {error && <p role="alert" className="image-editor-error">{error}</p>}
    <div className="image-editor-actions">
      <p>Se publica al guardar.</p>
      <button type="button" disabled={saving} onClick={onDone} className="image-secondary">Cancelar</button>
      <button type="submit" disabled={saving} className="appearance-primary">{saving ? "Guardando…" : "Guardar promoción"}</button>
    </div>
  </form>;
}
