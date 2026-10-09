"use client";

import { createContext, useContext, useRef, useState } from "react";

const ToastContext = createContext(() => {});

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const timerRef = useRef(null);

  const showToast = (message, kind = "ok") => {
    setToast({ message, kind, key: Date.now() });
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setToast(null), 2200);
  };

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 top-5 z-50 flex justify-center px-4"
      >
        {toast && (
          <div
            key={toast.key}
            className={`rounded-full px-4 py-2 text-sm text-smoke-100 shadow-lg ring-1 ${
              toast.kind === "error"
                ? "bg-char-900 ring-ember-700"
                : "bg-char-900 ring-ember-600/50"
            }`}
          >
            {toast.kind === "error" ? "⚠ " : "✓ "}
            {toast.message}
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
