"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { deleteDoc, doc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { uploadToCloudinary } from "@/lib/cloudinary";
import {
  formatCLP,
  CATEGORY_IMAGE_HEIGHT_RANGE,
  CATEGORY_IMAGE_GAP_RANGE,
  CATEGORY_IMAGE_GAP_DEFAULT,
  resolveCategoryImageHeight,
  categoryImageBox,
  categoryImageStyle,
} from "@/lib/format";

const SIZES = [
  { value: "auto", label: "Automática (según cant. de platos)" },
  { value: "sm", label: "Pequeña" },
  { value: "md", label: "Mediana" },
  { value: "lg", label: "Grande" },
];

const SHAPES = [
  { value: "rect", label: "Rectángulo" },
  { value: "circle", label: "Círculo" },
  { value: "oval", label: "Óvalo" },
  { value: "hexagon", label: "Hexágono" },
];

export default function AdminCategoryImages({
  categories,
  categoryImages,
  items,
}) {
  const [uploadingCat, setUploadingCat] = useState(null);
  const [previewCat, setPreviewCat] = useState(null);
  const [localHeight, setLocalHeight] = useState({});
  const [localGap, setLocalGap] = useState({});
  const [error, setError] = useState("");
  const debounceRef = useRef({});
  const gapDebounceRef = useRef({});

  const dataFor = (cat) => categoryImages.find((c) => c.id === cat) || null;
  const itemsFor = (cat) =>
    items.filter((i) => (i.category || "Otros") === cat);

  const heightFor = (cat) => {
    if (localHeight[cat] != null) return localHeight[cat];
    return resolveCategoryImageHeight(dataFor(cat), itemsFor(cat).length);
  };

  const gapFor = (cat) => {
    if (localGap[cat] != null) return localGap[cat];
    return dataFor(cat)?.textGap ?? CATEGORY_IMAGE_GAP_DEFAULT;
  };

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
        size: existing?.size || "auto",
        customHeight: existing?.customHeight || null,
        shape: existing?.shape || "rect",
        textGap: existing?.textGap ?? CATEGORY_IMAGE_GAP_DEFAULT,
      });
      setPreviewCat(cat);
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

  const changeShape = async (cat, shape) => {
    await updateDoc(doc(db, "categoryImages", cat), { shape });
  };

  const changePreset = async (cat, size) => {
    setLocalHeight((prev) => ({ ...prev, [cat]: undefined }));
    await updateDoc(doc(db, "categoryImages", cat), { size });
  };

  const handleSlider = (cat, value) => {
    const height = Number(value);
    setLocalHeight((prev) => ({ ...prev, [cat]: height }));

    clearTimeout(debounceRef.current[cat]);
    debounceRef.current[cat] = setTimeout(() => {
      updateDoc(doc(db, "categoryImages", cat), {
        size: "custom",
        customHeight: height,
      });
    }, 250);
  };

  const handleGapSlider = (cat, value) => {
    const gap = Number(value);
    setLocalGap((prev) => ({ ...prev, [cat]: gap }));

    clearTimeout(gapDebounceRef.current[cat]);
    gapDebounceRef.current[cat] = setTimeout(() => {
      updateDoc(doc(db, "categoryImages", cat), { textGap: gap });
    }, 250);
  };

  const handleRemove = async (cat) => {
    if (!confirm(`¿Quitar la foto de portada de "${cat}"?`)) return;
    await deleteDoc(doc(db, "categoryImages", cat));
  };

  useEffect(() => {
    return () => {
      Object.values(debounceRef.current).forEach(clearTimeout);
      Object.values(gapDebounceRef.current).forEach(clearTimeout);
    };
  }, []);

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
        acomoda alrededor de esa foto. Abre "Vista previa" para ver cómo
        queda con los platos reales de esa categoría y ajustar el tamaño
        con el control deslizante hasta que calce bien.
      </p>

      {error && <p className="mt-2 text-sm text-ember-400">{error}</p>}

      <ul className="mt-4 space-y-3">
        {categories.map((cat) => {
          const data = dataFor(cat);
          const img = data?.imageUrl || null;
          const position = data?.position || "right";
          const size = data?.size || "auto";
          const shape = data?.shape || "rect";
          const height = heightFor(cat);
          const gap = gapFor(cat);
          const box = categoryImageBox(shape, height);
          const visual = categoryImageStyle(
            shape,
            box.height,
            box.width,
            position,
            gap
          );
          const catItems = itemsFor(cat);

          return (
            <li key={cat} className="rounded border border-char-800 p-3">
              <div className="flex flex-wrap items-center gap-3">
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
                  {cat}{" "}
                  <span className="text-xs font-normal text-smoke-300">
                    ({catItems.length} platos)
                  </span>
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
                    <select
                      value={size === "custom" ? "auto" : size}
                      onChange={(e) => changePreset(cat, e.target.value)}
                      className="rounded border border-char-600 bg-char-800 px-2 py-1 text-sm text-smoke-300"
                    >
                      {SIZES.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                    <select
                      value={shape}
                      onChange={(e) => changeShape(cat, e.target.value)}
                      className="rounded border border-char-600 bg-char-800 px-2 py-1 text-sm text-smoke-300"
                    >
                      {SHAPES.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() =>
                        setPreviewCat(previewCat === cat ? null : cat)
                      }
                      className="rounded border border-char-600 px-3 py-1 text-sm text-smoke-300 hover:border-ember-500"
                    >
                      {previewCat === cat ? "Ocultar vista previa" : "Vista previa"}
                    </button>
                    <button
                      onClick={() => handleRemove(cat)}
                      className="rounded border border-ember-700 px-3 py-1 text-sm text-ember-400 hover:bg-ember-700/20"
                    >
                      Quitar
                    </button>
                  </>
                )}
              </div>

              {img && previewCat === cat && (
                <div className="mt-4 rounded-lg border border-char-700 bg-char-950 p-4">
                  <div className="mb-3 flex items-center gap-3">
                    <span className="text-xs text-smoke-300">
                      Tamaño de la foto
                    </span>
                    <input
                      type="range"
                      min={CATEGORY_IMAGE_HEIGHT_RANGE.min}
                      max={CATEGORY_IMAGE_HEIGHT_RANGE.max}
                      step={4}
                      value={height}
                      onChange={(e) => handleSlider(cat, e.target.value)}
                      className="h-1.5 flex-1 accent-ember-600"
                    />
                    <span className="w-12 text-right text-xs text-smoke-300">
                      {height}px
                    </span>
                  </div>

                  <div className="mb-3 flex items-center gap-3">
                    <span className="text-xs text-smoke-300">
                      Separación del texto
                    </span>
                    <input
                      type="range"
                      min={CATEGORY_IMAGE_GAP_RANGE.min}
                      max={CATEGORY_IMAGE_GAP_RANGE.max}
                      step={2}
                      value={gap}
                      onChange={(e) => handleGapSlider(cat, e.target.value)}
                      className="h-1.5 flex-1 accent-ember-600"
                    />
                    <span className="w-12 text-right text-xs text-smoke-300">
                      {gap}px
                    </span>
                  </div>

                  <div className="overflow-hidden">
                    <Image
                      src={img}
                      alt={cat}
                      width={box.width}
                      height={box.height}
                      style={visual.style}
                      className={`object-cover shadow-lg shadow-black/40 ring-1 ring-char-700 ${
                        visual.className
                      } ${position === "left" ? "float-left" : "float-right"}`}
                    />
                    <ul className="divide-y divide-char-800/80 text-sm">
                      {catItems.length === 0 && (
                        <li className="py-2 text-smoke-300">
                          Esta categoría todavía no tiene platos.
                        </li>
                      )}
                      {catItems.map((item) => (
                        <li
                          key={item.id}
                          className="flex items-baseline gap-2 py-2"
                        >
                          <span className="text-smoke-100">{item.name}</span>
                          <span className="flex-1 border-b border-dotted border-char-600" />
                          <span className="whitespace-nowrap text-ember-400">
                            {formatCLP(item.price)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
