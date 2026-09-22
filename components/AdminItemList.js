"use client";

import Image from "next/image";
import { deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { formatCLP, sortCategories } from "@/lib/format";

export default function AdminItemList({ items, onEdit }) {
  const categories = sortCategories(
    Array.from(new Set(items.map((i) => i.category || "Otros")))
  );

  const handleDelete = async (item) => {
    if (!confirm(`¿Eliminar "${item.name}" de la carta?`)) return;
    await deleteDoc(doc(db, "items", item.id));
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
                  className="flex items-center gap-3 p-3"
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
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded bg-char-800 text-lg">
                      🔥
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium text-smoke-100">
                      {item.name}
                    </p>
                    <p className="text-sm text-smoke-300">
                      {formatCLP(item.price)}
                    </p>
                  </div>
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
                </li>
              ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
