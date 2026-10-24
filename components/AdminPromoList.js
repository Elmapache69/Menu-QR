"use client";

import Image from "next/image";
import { useState } from "react";
import { deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import FlameIcon from "@/components/FlameIcon";
import { getPromoType } from "@/lib/promotions";

export default function AdminPromoList({ promos, onEdit }) {
  const [pendingId, setPendingId] = useState(null);
  const [error, setError] = useState("");
  const handleDelete = async (promo) => {
    if (pendingId) return;
    if (!confirm(`¿Eliminar la promoción "${promo.title || "sin título"}"?`))
      return;
    setPendingId(promo.id);
    setError("");
    try {
      await deleteDoc(doc(db, "promos", promo.id));
    } catch (err) {
      console.error(err);
      setError("No pudimos eliminar la publicación. Inténtalo de nuevo.");
    } finally {
      setPendingId(null);
    }
  };

  const toggleActive = async (promo) => {
    if (pendingId) return;
    setPendingId(promo.id);
    setError("");
    try {
      await updateDoc(doc(db, "promos", promo.id), { active: promo.active === false });
    } catch (err) {
      console.error(err);
      setError("No pudimos cambiar la visibilidad. Inténtalo de nuevo.");
    } finally {
      setPendingId(null);
    }
  };

  if (promos.length === 0) {
    return (
      <div className="promo-admin-empty">
        <FlameIcon className="h-6 w-6 text-ember-400" />
        <p>Todavía no hay publicaciones en el carrusel.</p>
        <p>Usa «Agregar publicación» para crear tu primera oferta, evento o novedad.</p>
      </div>
    );
  }

  return (
    <>
    {error && <p role="alert" className="promo-editor-error">{error}</p>}
    <ul className="mt-6 space-y-2">
      {promos.map((promo) => (
        <li
          key={promo.id}
          className="flex flex-wrap items-center gap-3 rounded border border-char-800 p-3"
        >
          {promo.imageUrl ? (
            <Image
              src={promo.imageUrl}
              alt={promo.title || "Promoción"}
              width={56}
              height={56}
              className="h-14 w-14 flex-shrink-0 rounded object-cover"
            />
          ) : (
            <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded bg-char-800">
              <FlameIcon className="h-6 w-6 text-ember-500/70" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-smoke-100">
              {promo.title || "(Sin título)"}
            </p>
            <p className="text-xs text-smoke-300">{getPromoType(promo.type).label}</p>
            <span
              className={`text-xs ${
                promo.active !== false ? "text-ember-400" : "text-smoke-300"
              }`}
            >
              {promo.active !== false ? "Visible en la carta" : "Oculta"}
            </span>
          </div>
          <fieldset disabled={pendingId !== null} className="flex flex-shrink-0 flex-wrap gap-2 disabled:opacity-50" aria-label={`Acciones de ${promo.title || "publicación"}`}>
            <button
              onClick={() => toggleActive(promo)}
              className="rounded border border-char-600 px-3 py-1 text-sm text-smoke-300 hover:border-ember-500"
            >
              {promo.active !== false ? "Ocultar" : "Mostrar"}
            </button>
            <button
              onClick={() => onEdit(promo)}
              className="rounded border border-char-600 px-3 py-1 text-sm text-smoke-300 hover:border-ember-500"
            >
              Editar
            </button>
            <button
              onClick={() => handleDelete(promo)}
              className="rounded border border-ember-700 px-3 py-1 text-sm text-ember-400 hover:bg-ember-700/20"
            >
              Eliminar
            </button>
          </fieldset>
        </li>
      ))}
    </ul>
    </>
  );
}
