"use client";

import { useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useDispatch } from "react-redux";
import { clearCart } from "@/app/store/slices/cartSlice";
import { clearCartStorage } from "@/app/store/cartStorage";
import { getBankTransferDetails } from "@/app/lib/bankTransfer";
import styles from "./success.module.css";

function SuccessContent() {
  const qp = useSearchParams();
  const dispatch = useDispatch();
  const sessionId = qp.get("session_id") || "";
  const orderNo = qp.get("order_no") || "";
  const isCod = qp.get("cod") === "1";
  const isTransfer = qp.get("transfer") === "1";
  const isOfflinePayment = isCod || isTransfer;
  const purchaseCompleted = Boolean(isOfflinePayment || sessionId || orderNo);
  const bank = isTransfer ? getBankTransferDetails() : null;

  useEffect(() => {
    if (!purchaseCompleted) return;
    dispatch(clearCart());
    clearCartStorage();
  }, [dispatch, purchaseCompleted]);

  useEffect(() => {
    const triggerCompletion = async () => {
      // Card payments: only finalize via verified Stripe session (webhook fallback).
      // Never send orderId/orderNo — those must not bypass payment verification.
      if (isOfflinePayment || !sessionId) return;

      const dedupeKey = `order-complete:${sessionId}`;
      try {
        if (sessionStorage.getItem(dedupeKey)) return;
        sessionStorage.setItem(dedupeKey, "1");
      } catch {
        // ignore storage errors
      }

      try {
        const res = await fetch("/api/complete-order", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });
        if (!res.ok) {
          console.error("[SUCCESS] order completion failed:", await res.text());
        }
      } catch (err) {
        console.error("[SUCCESS] order completion failed:", err);
      }
    };

    void triggerCompletion();
  }, [sessionId, isOfflinePayment]);

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
            {isTransfer
              ? "A rendelésed sikeresen rögzítésre került. Fizetési mód: átutalás. Kérjük, utald el a végösszeget az alábbi adatokkal — a közleménybe írd a rendelésszámot."
              : "A rendelésed sikeresen rögzítésre került. Hamarosan e-mailben is megkapod a visszaigazolást."}
          </p>
        </header>

        {orderNo ? (
          <div className={styles.block}>
            <div className={styles.row}>
              <span className={styles.label}>Rendelés azonosító</span>
              <span className={styles.valueMono}>{orderNo}</span>
            </div>
            <p className={styles.muted}>
              Kérjük, őrizd meg ezt az azonosítót a rendelésed követéséhez.
            </p>
          </div>
        ) : (
          <div className={styles.block}>
            <p className={styles.muted}>
              A rendelésed feldolgozása folyamatban van. Ha nem látod az azonosítót, ellenőrizd az
              e-mail fiókodat a visszaigazolásért.
            </p>
          </div>
        )}

        {isTransfer && bank ? (
          <div className={styles.transferBox}>
            <h2 className={styles.transferTitle}>Átutalási adatok</h2>
            <div className={styles.row}>
              <span className={styles.label}>Kedvezményezett</span>
              <span className={styles.valueMono}>{bank.beneficiary}</span>
            </div>
            <div className={styles.row}>
              <span className={styles.label}>Számlaszám</span>
              <span className={styles.valueMono}>{bank.accountNumber}</span>
            </div>
            {bank.bankName ? (
              <div className={styles.row}>
                <span className={styles.label}>Bank</span>
                <span className={styles.valueMono}>{bank.bankName}</span>
              </div>
            ) : null}
            <div className={styles.row}>
              <span className={styles.label}>Közlemény</span>
              <span className={styles.valueMono}>{orderNo || "RENDELÉSSZÁM"}</span>
            </div>
            <p className={styles.muted}>
              A közleményben pontosan a rendelésszámot add meg, hogy be tudjuk azonosítani a
              befizetést. Az adatokat e-mailben is elküldjük.
            </p>
          </div>
        ) : null}

        <div className={styles.actions}>
          <Link href="/" className={styles.primaryBtn}>
            Vissza a főoldalra
          </Link>
        </div>
      </section>
    </main>
  );
}

export default function SuccessPageClient() {
  return (
    <Suspense fallback={<div className={styles.page}>Betöltés…</div>}>
      <SuccessContent />
    </Suspense>
  );
}
