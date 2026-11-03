"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { formatCLP } from "@/lib/format";
import { getOrderedCategories, itemCategory, planCategoryMove, planItemMove, sortMenuItems } from "@/lib/menu-order";
import { saveMenuOrder } from "@/lib/menu-order-store";
import FlameIcon from "@/components/FlameIcon";

export default function AdminItemList({ items, onEdit }) {
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const pending = useRef(false);
  const categories = getOrderedCategories(items);

  const save = async (action, message) => {
    if (pending.current) return;
    const focused = document.activeElement;
    pending.current = true;
    setSaving(true);
    setError("");
    setFeedback("");
    try {
      await action();
      setFeedback(message);
    } catch (err) {
      console.error(err);
      setError("No se pudo guardar el cambio. Intenta de nuevo.");
    } finally {
      pending.current = false;
      setSaving(false);
      requestAnimationFrame(() => {
        if (!focused?.isConnected) return;
        const target = focused.disabled
          ? focused.closest("[data-order-controls]")?.querySelector("button:not(:disabled)") : focused;
        target?.focus({ preventScroll: true });
      });
    }
  };

  const moveCategory = (category, direction) => {
    const changes = planCategoryMove(items, category, direction);
    if (changes.length) save(() => saveMenuOrder(changes), `Orden de categorías guardado. ${category} se movió ${direction < 0 ? "hacia arriba" : "hacia abajo"}.`);
  };

  const moveItem = (item, direction) => {
    const changes = planItemMove(items, item.id, direction);
    if (changes.length) save(() => saveMenuOrder(changes), `Orden guardado. ${item.name} se movió ${direction < 0 ? "hacia arriba" : "hacia abajo"}.`);
  };

  const handleDelete = async (item) => {
    if (!confirm(`¿Eliminar "${item.name}" de la carta?`)) return;
    await save(() => deleteDoc(doc(db, "items", item.id)), "Plato eliminado.");
  };

  const toggleHidden = async (item) => {
    await save(() => updateDoc(doc(db, "items", item.id), { hidden: !item.hidden }), item.hidden ? "Plato visible en la carta." : "Plato oculto de la carta.");
  };

  if (items.length === 0) {
    return (
      <p className="mt-6 text-sm text-smoke-300">
        Todavía no hay platos cargados.
      </p>
    );
  }

  return (
    <div className="admin-item-manager">
      <p className="admin-order-help">Usa las flechas para ordenar categorías y platos. Para cambiar un plato de categoría, entra a Editar.</p>
      <p className={`admin-order-feedback${error ? " admin-order-error" : ""}`} role={error ? "alert" : "status"}>
        {saving ? "Guardando cambios…" : error || feedback || "Los cambios se publican al instante."}
      </p>
      <div className="space-y-8" aria-busy={saving}>
      {categories.map((cat, categoryIndex) => {
        const group = sortMenuItems(items.filter((item) => itemCategory(item) === cat));
        return <section key={cat} aria-label={cat}>
          <div className="admin-category-heading">
            <h3 className="font-display text-xl tracking-wide text-ember-400">{cat}</h3>
            <OrderControls kind="categoría" name={cat} index={categoryIndex} count={categories.length}
              disabled={saving} onMove={(direction) => moveCategory(cat, direction)} />
          </div>
          <ul className="divide-y divide-char-800 rounded border border-char-800">
            {group.map((item, itemIndex) => (
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
                  <div className="admin-item-details">
                    <p className="font-medium text-smoke-100">
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
                  <OrderControls kind="plato" name={item.name} index={itemIndex} count={group.length}
                    disabled={saving} onMove={(direction) => moveItem(item, direction)} />
                  <div className="admin-item-actions">
                    <button
                      type="button" disabled={saving}
                      onClick={() => toggleHidden(item)}
                      className="rounded border border-char-600 px-3 py-1 text-sm text-smoke-300 hover:border-ember-500"
                    >
                      {item.hidden ? "Mostrar" : "Ocultar"}
                    </button>
                    <button
                      type="button" disabled={saving}
                      onClick={() => onEdit(item)}
                      className="rounded border border-char-600 px-3 py-1 text-sm text-smoke-300 hover:border-ember-500"
                    >
                      Editar
                    </button>
                    <button
                      type="button" disabled={saving}
                      onClick={() => handleDelete(item)}
                      className="rounded border border-ember-700 px-3 py-1 text-sm text-ember-400 hover:bg-ember-700/20"
                    >
                      Eliminar
                    </button>
                  </div>
                </li>
              ))}
          </ul>
        </section>;
      })}
      </div>
    </div>
  );
}

function OrderControls({ kind, name, index, count, disabled, onMove }) {
  if (count < 2) return null;
  return <div className="admin-order-controls" data-order-controls role="group" aria-label={`Orden de ${kind} ${name}`}>
    {[-1, 1].map((direction) => {
      const label = `${direction < 0 ? "Subir" : "Bajar"} ${kind} ${name}`;
      return <button type="button" key={direction} className="admin-order-button" title={label} aria-label={label}
        disabled={disabled || (direction < 0 ? index === 0 : index === count - 1)} onClick={() => onMove(direction)}>
        <svg viewBox="0 0 24 24" fill="none" width="20" height="20" aria-hidden="true">
          <path d={direction < 0 ? "m6 15 6-6 6 6" : "m6 9 6 6 6-6"} stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>;
    })}
  </div>;
}
