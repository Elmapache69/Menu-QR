"use client";

import { useState } from "react";
import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { uploadToCloudinary } from "@/lib/cloudinary";

const emptyForm = { title: "", description: "", active: true };

export default function AdminPromoForm({ editingPromo, onDone }) {
  const [form, setForm] = useState(
    editingPromo
      ? {
          title: editingPromo.title || "",
          description: editingPromo.description || "",
          active: editingPromo.active !== false,
        }
      : emptyForm
  );
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.title.trim() && !file && !editingPromo?.imageUrl) {
      setError("Agrega al menos un título o una imagen.");
      return;
    }

    setSaving(true);
    try {
      let imageUrl = editingPromo?.imageUrl || "";

      if (file) {
        imageUrl = await uploadToCloudinary(file, "promo-images");
      }

      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        active: form.active,
        imageUrl,
      };

      if (editingPromo) {
        await updateDoc(doc(db, "promos", editingPromo.id), payload);
      } else {
        await addDoc(collection(db, "promos"), {
          ...payload,
          createdAt: serverTimestamp(),
        });
      }

      onDone();
    } catch (err) {
      console.error(err);
      setError("No se pudo guardar. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-lg border border-char-700 bg-char-900 p-5"
    >
      <h3 className="font-display text-xl tracking-wide text-ember-400">
        {editingPromo ? "Editar promoción" : "Agregar promoción o evento"}
      </h3>

      <div>
        <label className="mb-1 block text-sm text-smoke-300">Título</label>
        <input
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="w-full rounded border border-char-600 bg-char-800 px-3 py-2 text-smoke-100 focus:border-ember-500"
          placeholder="Ej: 2x1 en tragos los jueves"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm text-smoke-300">
          Descripción
        </label>
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="w-full rounded border border-char-600 bg-char-800 px-3 py-2 text-smoke-100 focus:border-ember-500"
          rows={2}
          placeholder="Detalle breve de la promoción o evento"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm text-smoke-300">
          Imagen {editingPromo?.imageUrl ? "(deja vacío para conservar)" : ""}
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="w-full text-sm text-smoke-300 file:mr-3 file:rounded file:border-0 file:bg-ember-600 file:px-3 file:py-1.5 file:text-smoke-100"
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-smoke-300">
        <input
          type="checkbox"
          checked={form.active}
          onChange={(e) => setForm({ ...form, active: e.target.checked })}
          className="h-4 w-4 rounded border-char-600 bg-char-800 accent-ember-600"
        />
        Mostrar en la carta ahora
      </label>

      {error && <p className="text-sm text-ember-400">{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded bg-ember-600 px-4 py-2 font-medium text-smoke-100 hover:bg-ember-500 disabled:opacity-50"
        >
          {saving ? "Guardando…" : "Guardar"}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="rounded border border-char-600 px-4 py-2 text-smoke-300 hover:border-smoke-300"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
