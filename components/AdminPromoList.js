"use client";

import Image from "next/image";
import { deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import FlameIcon from "@/components/FlameIcon";

export default function AdminPromoList({ promos, onEdit }) {
  const handleDelete = async (promo) => {
    if (!confirm(`¿Eliminar la promoción "${promo.title || "sin título"}"?`))
      return;
    await deleteDoc(doc(db, "promos", promo.id));
  };

  const toggleActive = async (promo) => {
    await updateDoc(doc(db, "promos", promo.id), { active: !promo.active });
  };

  if (promos.length === 0) {
    return (
      <p className="mt-6 text-sm text-smoke-300">
        Todavía no hay promociones ni eventos cargados.
      </p>
    );
  }

  return (
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
            <span
              className={`text-xs ${
                promo.active ? "text-ember-400" : "text-smoke-300"
              }`}
            >
              {promo.active ? "Visible en la carta" : "Oculta"}
            </span>
          </div>
          <div className="flex flex-shrink-0 gap-2">
            <button
              onClick={() => toggleActive(promo)}
              className="rounded border border-char-600 px-3 py-1 text-sm text-smoke-300 hover:border-ember-500"
            >
              {promo.active ? "Ocultar" : "Mostrar"}
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
          </div>
        </li>
      ))}
    </ul>
  );
}
