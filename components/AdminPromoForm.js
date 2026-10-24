"use client";

import { useEffect, useId, useRef, useState } from "react";
import { addDoc, collection, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { getPromoType, PROMO_TYPES } from "@/lib/promotions";
import PromoCard from "@/components/PromoCard";

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"]);

export default function AdminPromoForm({ editingPromo, onDone }) {
  const [form, setForm] = useState(() => ({
    title: editingPromo?.title || "",
    description: editingPromo?.description || "",
    active: editingPromo?.active !== false,
    type: getPromoType(editingPromo?.type).value,
  }));
  const [file, setFile] = useState(null);
  const [localUrl, setLocalUrl] = useState("");
  const [imageRemoved, setImageRemoved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fileError, setFileError] = useState("");
  const fileRef = useRef(null);
  const fieldId = useId();
  const savedImage = imageRemoved ? "" : editingPromo?.imageUrl || "";

  useEffect(() => {
    if (!file) { setLocalUrl(""); return; }
    const url = URL.createObjectURL(file);
    setLocalUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const update = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setError("");
  };

  const selectFile = (event) => {
    const selected = event.target.files?.[0] || null;
    setError("");
    setFileError("");
    if (selected && (!IMAGE_TYPES.has(selected.type) || selected.size > 10 * 1024 * 1024)) {
      setFile(null);
      event.target.value = "";
      setFileError("Elige una imagen JPG, PNG, WebP, AVIF o GIF de hasta 10 MB.");
      return;
    }
    setFile(selected);
  };

  const removeImage = () => {
    setFile(null);
    setImageRemoved(true);
    setFileError("");
    setError("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (saving || fileError) return;
    setError("");
    if (!form.title.trim() && !file && !savedImage) {
      setError("Agrega al menos un título o una imagen.");
      return;
    }

    setSaving(true);
    try {
      const imageUrl = file ? await uploadToCloudinary(file, "promo-images") : savedImage;
      const payload = {
        title: form.title.trim(), description: form.description.trim(),
        type: form.type, active: form.active, imageUrl,
      };
      if (editingPromo) {
        await updateDoc(doc(db, "promos", editingPromo.id), payload);
      } else {
        await addDoc(collection(db, "promos"), { ...payload, createdAt: serverTimestamp() });
      }
      onDone();
    } catch (err) {
      console.error(err);
      setError("No pudimos guardar la publicación. Revisa la conexión y la configuración de imágenes e inténtalo de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="promo-editor" aria-busy={saving}>
      <h3>{editingPromo ? "Editar publicación" : "Agregar oferta, evento o novedad"}</h3>
      <p className="promo-editor-intro">La publicación aparecerá en el carrusel de la carta. Revisa cómo queda antes de guardar.</p>
      <fieldset disabled={saving}>
        <legend className="sr-only">Datos de la publicación</legend>
        <div className="promo-editor-fields">
          <div>
            <label htmlFor={`${fieldId}-type`}>Tipo de publicación</label>
            <select id={`${fieldId}-type`} value={form.type} onChange={(event) => update("type", event.target.value)}>
              {PROMO_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor={`${fieldId}-title`}>Título</label>
            <input id={`${fieldId}-title`} value={form.title} onChange={(event) => update("title", event.target.value)}
              placeholder="Por ejemplo: 2x1 en tragos los jueves" />
          </div>
          <div>
            <label htmlFor={`${fieldId}-description`}>Descripción</label>
            <textarea id={`${fieldId}-description`} value={form.description} rows={3}
              onChange={(event) => update("description", event.target.value)} placeholder="Detalle de la oferta, fecha del evento o condiciones" />
          </div>
          <div>
            <label htmlFor={`${fieldId}-image`}>Imagen o afiche <span>(opcional)</span></label>
            <input ref={fileRef} id={`${fieldId}-image`} type="file" accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
              onChange={selectFile} aria-invalid={Boolean(fileError)} aria-describedby={`${fieldId}-image-help${fileError ? ` ${fieldId}-file-error` : ""}`} />
            <p id={`${fieldId}-image-help`} className="promo-editor-help">JPG, PNG, WebP, AVIF o GIF. Máximo 10 MB. La imagen se sube al guardar.</p>
            {fileError && <p id={`${fieldId}-file-error`} role="alert" className="promo-editor-error">{fileError}</p>}
            {(file || savedImage || fileError) && <button type="button" className="promo-text-button" onClick={removeImage}>Quitar imagen</button>}
          </div>
          <p className="promo-editor-help">Las imágenes se ajustan completas a un espacio fijo, sin recortarse. El carrusel mantiene su tamaño al cambiar de publicación.</p>
          <label className="promo-editor-checkbox">
            <input type="checkbox" checked={form.active} onChange={(event) => update("active", event.target.checked)} />
            Mostrar en la carta al guardar
          </label>
        </div>
        <div className="promo-editor-preview">
          <p>Vista previa {form.active ? "· visible al guardar" : "· oculta al guardar"}</p>
          <PromoCard promo={{ ...form, imageUrl: file ? localUrl : savedImage }} preview />
        </div>
        {error && <p role="alert" className="promo-editor-error">{error}</p>}
        <div className="promo-editor-actions">
          <button type="submit" disabled={Boolean(fileError)} className="promo-primary">{saving ? "Guardando…" : "Guardar publicación"}</button>
          <button type="button" onClick={onDone} className="promo-secondary">Cancelar</button>
        </div>
      </fieldset>
    </form>
  );
}
