"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import styles from "./toast.module.css";

type Toast = {
  id: string;
  title: string;
  description?: string;
  duration?: number; // ms
};

type ToastContextValue = {
  show: (t: Omit<Toast, "id">) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider />");
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const hostRef = useRef<HTMLElement | null>(null);

  // Host feloldása mount után (SSR-en a div már a HTML-ben van)
  useEffect(() => {
    hostRef.current = document.getElementById(
      "toast-root"
    ) as HTMLElement | null;
  }, []);

  const show = useCallback((t: Omit<Toast, "id">) => {
    const toast: Toast = { id: crypto.randomUUID(), duration: 2500, ...t };
    setToasts((prev) => [...prev, toast]);
    const timeout = setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== toast.id));
    }, toast.duration);
    return () => clearTimeout(timeout);
  }, []);

  // ESC-re legutóbbi toast zárása
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setToasts((prev) => prev.slice(0, -1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {
        // Fontos: itt NEM renderelünk semmit SSR-en (hostRef még null),
        // így a szerver/kliens első render megegyezik; a portal csak mount után jelenik meg,
        // de a host div már a layoutban stabilan ott van.
        hostRef.current &&
          createPortal(
            <div className={styles.toastToot} aria-live="polite">
              {toasts.map((t) => (
                <div key={t.id} className={styles.toast}>
                  <div>
                    <strong className={styles.title}>{t.title}</strong>
                    {t.description && (
                      <div className={styles.desc}>{t.description}</div>
                    )}
                  </div>
                  <button
                    className={styles.close}
                    aria-label="Értesítés bezárása"
                    onClick={() =>
                      setToasts((prev) => prev.filter((x) => x.id !== t.id))
                    }
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>,
            hostRef.current
          )
      }
    </ToastContext.Provider>
  );
}
