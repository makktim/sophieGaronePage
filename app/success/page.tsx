// app/success/page.js
"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import styles from "./success.module.css";
import { useDispatch } from "react-redux";
import { clearCart } from "../store/slices/cartSlice";

export default function SuccessPage() {
  const qp = useSearchParams();
  const dispatch = useDispatch();

  const sessionId = qp.get("session_id") || "";
  const orderNo =
    qp.get("order_no") || (sessionId ? sessionId.slice(-8).toUpperCase() : "");
  const email = qp.get("e") || "";
  const orderUrl = qp.get("order_url") || "/";

  // ürítés: ha van session_id VAGY order_no, egyszerűsítsünk
  useEffect(() => {
    if (sessionId || orderNo) {
      dispatch(clearCart());
    }
  }, [sessionId, orderNo, dispatch]);

  return (
    <main className={styles.page} aria-labelledby="success-title">
      <section className={styles.card}>
        <header className={styles.header}>
          <div className={styles.icon} aria-hidden>
            ✓
          </div>
          <h1 id="success-title" className={styles.title}>
            Köszönjük a rendelésed! 🎉
          </h1>
          <p className={styles.lead}>
            A visszaigazoló e-mailt{" "}
            {email ? <strong>{email}</strong> : "a megadott e-mail címedre"}{" "}
            elküldtük.
          </p>
        </header>

        <div className={styles.block}>
          <div className={styles.row}>
            <span className={styles.label}>Rendelés azonosító</span>
            <span className={styles.valueMono}>{orderNo || "—"}</span>
          </div>
        </div>

        <div className={styles.actions}>
          <Link href="/" className={styles.primaryBtn}>
            Vissza a főoldalra
          </Link>
          {/*           <Link href={orderUrl} className={styles.ghostBtn} prefetch={false}>
            Rendelés megtekintése
          </Link> */}
        </div>
      </section>
    </main>
  );
}
