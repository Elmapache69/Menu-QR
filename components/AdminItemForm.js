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
import { CATEGORY_ORDER } from "@/lib/format";

async function uploadToCloudinary(file) {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error(
      "Falta configurar NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME / NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET"
    );
  }

  const body = new FormData();
  body.append("file", file);
  body.append("upload_preset", uploadPreset);
  body.append("folder", "menu-images");

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: "POST", body }
  );

  if (!res.ok) {
    throw new Error("Error subiendo la imagen a Cloudinary");
  }

  const data = await res.json();
  return data.secure_url;
}

const emptyForm = { name: "", description: "", price: "", category: "" };

export default function AdminItemForm({
  editingItem,
  existingCategories,
  onDone,
}) {
  const [form, setForm] = useState(
    editingItem
      ? {
          name: editingItem.name || "",
          description: editingItem.description || "",
          price: editingItem.price || "",
          category: editingItem.category || "",
        }
      : emptyForm
  );
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const categoryOptions = Array.from(
    new Set([...CATEGORY_ORDER, ...existingCategories])
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.name.trim() || !form.category.trim() || form.price === "") {
      setError("Nombre, categoría y precio son obligatorios.");
      return;
    }

    setSaving(true);
    try {
      let imageUrl = editingItem?.imageUrl || "";

      if (file) {
        imageUrl = await uploadToCloudinary(file);
      }

      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        price: Number(form.price) || 0,
        category: form.category.trim(),
        imageUrl,
      };

      if (editingItem) {
        await updateDoc(doc(db, "items", editingItem.id), payload);
      } else {
        await addDoc(collection(db, "items"), {
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
        {editingItem ? "Editar plato" : "Agregar plato"}
      </h3>

      <div>
        <label className="mb-1 block text-sm text-smoke-300">Nombre</label>
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full rounded border border-char-600 bg-char-800 px-3 py-2 text-smoke-100 focus:border-ember-500"
          placeholder="Ej: Lomo vetado"
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
          placeholder="Ingredientes o detalle del plato"
        />
      </div>

      <div className="flex gap-3">
        <div className="flex-1">
          <label className="mb-1 block text-sm text-smoke-300">
            Precio (CLP)
          </label>
          <input
            type="number"
            min="0"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            className="w-full rounded border border-char-600 bg-char-800 px-3 py-2 text-smoke-100 focus:border-ember-500"
            placeholder="8990"
          />
        </div>
        <div className="flex-1">
          <label className="mb-1 block text-sm text-smoke-300">
            Categoría
          </label>
          <input
            list="category-options"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="w-full rounded border border-char-600 bg-char-800 px-3 py-2 text-smoke-100 focus:border-ember-500"
            placeholder="Ej: Parrilladas"
          />
          <datalist id="category-options">
            {categoryOptions.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm text-smoke-300">
          Imagen {editingItem?.imageUrl ? "(deja vacío para conservar)" : ""}
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="w-full text-sm text-smoke-300 file:mr-3 file:rounded file:border-0 file:bg-ember-600 file:px-3 file:py-1.5 file:text-smoke-100"
        />
      </div>

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
