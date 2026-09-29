"use client";

import { useState } from "react";
import Image from "next/image";
import { deleteDoc, doc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { uploadToCloudinary } from "@/lib/cloudinary";

export default function AdminCategoryImages({ categories, categoryImages }) {
  const [uploadingCat, setUploadingCat] = useState(null);
  const [error, setError] = useState("");

  const dataFor = (cat) => categoryImages.find((c) => c.id === cat) || null;

  const handleFile = async (cat, file) => {
    if (!file) return;
    setError("");
    setUploadingCat(cat);
    try {
      const imageUrl = await uploadToCloudinary(file, "category-images");
      const existing = dataFor(cat);
      await setDoc(doc(db, "categoryImages", cat), {
        imageUrl,
        position: existing?.position || "right",
      });
    } catch (err) {
      console.error(err);
      setError("No se pudo subir la imagen. Intenta de nuevo.");
    } finally {
      setUploadingCat(null);
    }
  };

  const togglePosition = async (cat) => {
    const existing = dataFor(cat);
    const next = existing?.position === "left" ? "right" : "left";
    await updateDoc(doc(db, "categoryImages", cat), { position: next });
  };

  const handleRemove = async (cat) => {
    if (!confirm(`¿Quitar la foto de portada de "${cat}"?`)) return;
    await deleteDoc(doc(db, "categoryImages", cat));
  };

  if (categories.length === 0) {
    return (
      <p className="mt-6 text-sm text-smoke-300">
        Agrega primero algún plato para poder elegir una categoría.
      </p>
    );
  }

  return (
    <div className="mt-4">
      <p className="text-sm text-smoke-300">
        Una foto grande por categoría (por ejemplo, una pizza bien lograda
        para "Platos de fondo"). En la carta, el texto de los platos se
        acomoda alrededor de esa foto. Es opcional — las categorías sin
        foto se ven como una lista normal. Alterna el lado (izquierda /
        derecha) entre categorías para que no todas queden iguales.
      </p>

      {error && <p className="mt-2 text-sm text-ember-400">{error}</p>}

      <ul className="mt-4 space-y-2">
        {categories.map((cat) => {
          const data = dataFor(cat);
          const img = data?.imageUrl || null;
          const position = data?.position || "right";
          return (
            <li
              key={cat}
              className="flex flex-wrap items-center gap-3 rounded border border-char-800 p-3"
            >
              {img ? (
                <Image
                  src={img}
                  alt={cat}
                  width={56}
                  height={56}
                  className="h-14 w-14 flex-shrink-0 rounded object-cover"
                />
              ) : (
                <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded bg-char-800 text-xs text-smoke-300">
                  Sin foto
                </div>
              )}

              <p className="min-w-0 flex-1 truncate font-medium text-smoke-100">
                {cat}
              </p>

              <label className="cursor-pointer rounded border border-char-600 px-3 py-1 text-sm text-smoke-300 hover:border-ember-500">
                {uploadingCat === cat
                  ? "Subiendo…"
                  : img
                  ? "Cambiar"
                  : "Agregar foto"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploadingCat === cat}
                  onChange={(e) => handleFile(cat, e.target.files?.[0])}
                />
              </label>

              {img && (
                <>
                  <button
                    onClick={() => togglePosition(cat)}
                    className="rounded border border-char-600 px-3 py-1 text-sm text-smoke-300 hover:border-ember-500"
                    title="Cambiar de lado"
                  >
                    {position === "left" ? "◧ Izquierda" : "◨ Derecha"}
                  </button>
                  <button
                    onClick={() => handleRemove(cat)}
                    className="rounded border border-ember-700 px-3 py-1 text-sm text-ember-400 hover:bg-ember-700/20"
                  >
                    Quitar
                  </button>
                </>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
