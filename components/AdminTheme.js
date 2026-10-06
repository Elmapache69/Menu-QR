"use client";

import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/components/Toast";

const THEMES = [
  {
    value: "default",
    label: "Normal",
    desc: "Los colores de siempre (naranja y rojo brasa).",
  },
  {
    value: "halloween",
    label: "🎃 Halloween",
    desc: "Naranja calabaza y morado.",
  },
  {
    value: "christmas",
    label: "🎄 Navidad",
    desc: "Dorado, rojo y verde pino.",
  },
  {
    value: "fiestasPatrias",
    label: "🇨🇱 Fiestas Patrias",
    desc: "Blanco, azul y rojo, colores de la bandera.",
  },
];

export default function AdminTheme({ theme }) {
  const current = theme || "default";
  const showToast = useToast();

  const changeTheme = async (value) => {
    await setDoc(doc(db, "settings", "general"), { theme: value }, { merge: true });
    const label = THEMES.find((t) => t.value === value)?.label || value;
    showToast(`Modo "${label}" activado`);
  };

  return (
    <div className="mt-4">
      <p className="text-sm text-smoke-300">
        Cambia los colores de acento de toda la carta pública según la
        fecha. El resto del diseño (fotos, fondo oscuro, orden de platos)
        no cambia — solo los tonos destacados.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {THEMES.map((t) => (
          <button
            key={t.value}
            onClick={() => changeTheme(t.value)}
            className={`rounded-lg border p-4 text-left transition-colors ${
              current === t.value
                ? "border-ember-500 bg-char-900"
                : "border-char-700 bg-char-900/50 hover:border-char-600"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-smoke-100">{t.label}</span>
              {current === t.value && (
                <span className="text-xs text-ember-400">Activo</span>
              )}
            </div>
            <p className="mt-1 text-xs text-smoke-300">{t.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
