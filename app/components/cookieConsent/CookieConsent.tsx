"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./cookieConsent.module.css";

const STORAGE_KEY = "sg_cookie_consent";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) !== "accepted") {
        setVisible(true);
      }
    } catch {
      setVisible(true);
    }
  }, []);

  const accept = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "accepted");
    } catch {
      // ignore storage errors
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className={styles.banner}
      role="dialog"
      aria-live="polite"
      aria-label="Süti tájékoztató"
    >
      <p className={styles.text}>
        Kedves Látogató! Tájékoztatjuk, hogy a honlap felhasználói élmény
        fokozásának érdekében sütiket alkalmazunk. A honlapunk használatával ön
        a tájékoztatásunkat tudomásul veszi.
      </p>

      <div className={styles.actions}>
        <button type="button" className={styles.btn} onClick={accept}>
          Elfogadom
        </button>
        <Link href="/adatvedelem" className={styles.btn}>
          Adatvédelmi nyilatkozat
        </Link>
        <button
          type="button"
          className={styles.close}
          onClick={accept}
          aria-label="Bezárás"
        >
          ×
        </button>
      </div>
    </div>
  );
}
