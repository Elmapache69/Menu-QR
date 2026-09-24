"use client";

import Image from "next/image";
import { deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { formatCLP, sortCategories } from "@/lib/format";
import FlameIcon from "@/components/FlameIcon";

export default function AdminItemList({ items, onEdit }) {
  const categories = sortCategories(
    Array.from(new Set(items.map((i) => i.category || "Otros")))
  );

  const handleDelete = async (item) => {
    if (!confirm(`¿Eliminar "${item.name}" de la carta?`)) return;
    await deleteDoc(doc(db, "items", item.id));
  };

  const toggleHidden = async (item) => {
    await updateDoc(doc(db, "items", item.id), { hidden: !item.hidden });
  };

  if (items.length === 0) {
    return (
      <p className="mt-6 text-sm text-smoke-300">
        Todavía no hay platos cargados.
      </p>
    );
  }

  return (
    <div className="mt-6 space-y-8">
      {categories.map((cat) => (
        <div key={cat}>
          <h3 className="mb-2 font-display text-lg tracking-wide text-ember-400">
            {cat}
          </h3>
          <ul className="divide-y divide-char-800 rounded border border-char-800">
            {items
              .filter((i) => (i.category || "Otros") === cat)
              .map((item) => (
                <li
                  key={item.id}
                  className="flex flex-wrap items-center gap-3 p-3"
                >
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      width={48}
                      height={48}
                      className="h-12 w-12 flex-shrink-0 rounded object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded bg-char-800">
                      <FlameIcon className="h-5 w-5 text-ember-500/70" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-smoke-100">
                      {item.name}
                      {item.hidden && (
                        <span className="ml-2 rounded-full bg-char-800 px-2 py-0.5 text-[10px] uppercase tracking-wide text-smoke-300">
                          Oculto
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-smoke-300">
                      {formatCLP(item.price)}
                    </p>
                  </div>
                  <div className="flex flex-shrink-0 flex-wrap gap-2">
                    <button
                      onClick={() => toggleHidden(item)}
                      className="rounded border border-char-600 px-3 py-1 text-sm text-smoke-300 hover:border-ember-500"
                    >
                      {item.hidden ? "Mostrar" : "Ocultar"}
                    </button>
                    <button
                      onClick={() => onEdit(item)}
                      className="rounded border border-char-600 px-3 py-1 text-sm text-smoke-300 hover:border-ember-500"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(item)}
                      className="rounded border border-ember-700 px-3 py-1 text-sm text-ember-400 hover:bg-ember-700/20"
                    >
                      Eliminar
                    </button>
                  </div>
                </li>
              ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
