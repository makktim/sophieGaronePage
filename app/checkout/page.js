"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useDispatch, useSelector } from "react-redux";
import styles from "./checkout.module.css";

import {
  setField,
  setShippingMethod,
  setPickupPoint,
  togglePicker,
  setSubmitting,
  setError,
} from "../store/slices/shippingSlice";

const PickupPointPicker = dynamic(
  () => import("../components/shipping/PickupPointPicker"),
  { ssr: false }
);

const SHIPPING_PRICES = {
  foxpost_courier: 2500,
  foxpost_locker: 1190,
  pickup: 0,
};

const FREE_HOME_SHIPPING_THRESHOLD_HUF = 15_000;

function formatHUF(v) {
  const n = Number(v);
  const safe = Number.isFinite(n) ? n : 0;
  try {
    return new Intl.NumberFormat("hu-HU", { style: "currency", currency: "HUF" }).format(safe);
  } catch {
    return `${safe} Ft`;
  }
}

function buildPayloadItems(items) {
  return items.map((i) => ({
    id: i.productId ?? i.id,
    name: i.title ?? i.name ?? "Termék",
    quantity: Number.isFinite(Number(i.qty))
      ? Number(i.qty)
      : Number.isFinite(Number(i.quantity))
      ? Number(i.quantity)
      : 1,
  }));
}

export default function CheckoutPage() {
  const dispatch = useDispatch();
  const idempotencyKeyRef = useRef(null);
  const items    = useSelector((s) => s.cart.items);
  const subtotal = useSelector((s) => s.cart.totalAmount);
  const st       = useSelector((s) => s.shipping);
  const [couponFeedback, setCouponFeedback] = useState(null); // { type: "ok"|"error", text: string }
  const [couponChecking, setCouponChecking] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState("");

  useEffect(() => {
    if (!st.shipping) dispatch(setShippingMethod("foxpost_courier"));
  }, [st.shipping, dispatch]);

  useEffect(() => {
    dispatch(setField({ key: "subtotal",   value: subtotal }));
    dispatch(setField({ key: "itemsCount", value: items.length }));
  }, [dispatch, subtotal, items.length]);

  const shippingCost = useMemo(() => {
    const sub = Number.isFinite(Number(subtotal)) ? Number(subtotal) : 0;
    const method = st?.shipping;
    if (
      (method === "foxpost_courier" || method === "foxpost_home") &&
      sub >= FREE_HOME_SHIPPING_THRESHOLD_HUF
    ) {
      return 0;
    }
    const price = SHIPPING_PRICES?.[method];
    return Number.isFinite(price) ? price : 0;
  }, [st?.shipping, subtotal]);

  const homeShippingBadge = useMemo(() => {
    const sub = Number.isFinite(Number(subtotal)) ? Number(subtotal) : 0;
    if (sub >= FREE_HOME_SHIPPING_THRESHOLD_HUF) return "Ingyenes";
    return formatHUF(SHIPPING_PRICES.foxpost_courier);
  }, [subtotal]);

  const requiresPickup = st.shipping === "foxpost_locker";

  const shippingAddress = st.shipDiff
    ? { zip: st.shipZip, city: st.shipCity, address: st.shipAddr }
    : { zip: st.billingZip, city: st.billingCity, address: st.billingAddr };

  const discount = 0;
  const total = useMemo(() => {
    const sub = Number.isFinite(Number(subtotal)) ? Number(subtotal) : 0;
    return Math.max(0, sub + shippingCost - discount);
  }, [subtotal, shippingCost]);

  const valid = useMemo(() => {
    const emailOk   = /\S+@\S+\.\S+/.test(st.email);
    const phoneOk   = st.phone.trim().length >= 6;
    const billingOk = st.billingName && st.billingZip && st.billingCity && st.billingAddr;
    const shipOk    = !st.shipDiff || (st.shipZip && st.shipCity && st.shipAddr);
    const hasItems  = items.length > 0;
    const pickupOk  = !requiresPickup || !!st.pickupPoint;
    return emailOk && phoneOk && billingOk && shipOk && pickupOk && st.acceptTos && hasItems;
  }, [st, requiresPickup, items.length]);

  async function applyCoupon() {
    const code = String(st.coupon || "").trim();
    if (!code) {
      setAppliedCoupon("");
      setCouponFeedback({ type: "error", text: "Érvénytelen kód" });
      return;
    }

    setCouponChecking(true);
    setCouponFeedback(null);
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json().catch(() => null);
      if (data?.valid) {
        setAppliedCoupon(data.code || code);
        setCouponFeedback({ type: "ok", text: "A kód hozzáadva" });
      } else {
        setAppliedCoupon("");
        setCouponFeedback({
          type: "error",
          text: data?.message || "Érvénytelen kód",
        });
      }
    } catch {
      setAppliedCoupon("");
      setCouponFeedback({ type: "error", text: "Érvénytelen kód" });
    } finally {
      setCouponChecking(false);
    }
  }

  async function onSubmit() {
    if (!valid || st.submitting) return;
    dispatch(setError(null));
    dispatch(setSubmitting(true));

    const payloadItems = buildPayloadItems(items);
    if (payloadItems.some((it) => !it.id)) {
      dispatch(setError("Hiba a kosárban: hiányzik egy termékazonosító. Tedd újra a kosárba."));
      dispatch(setSubmitting(false));
      return;
    }

    // Fresh key per submit attempt. Double-clicks are blocked by `st.submitting`.
    // Reusing one key across retries fails once the server creates a new order
    // (different Stripe parameters) with the same Idempotency-Key.
    const idempotencyKey =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `checkout-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    idempotencyKeyRef.current = idempotencyKey;

    try {
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify({
          items: payloadItems,
          customer: {
            email: st.email,
            phone: st.phone,
            billing: {
              name: st.billingName,
              zip: st.billingZip,
              city: st.billingCity,
              address: st.billingAddr,
              vat: st.companyVat,
            },
            shippingAddress,
          },
          shippingMethod: st.shipping,
          pickupPoint:    st.pickupPoint || null,
          paymentHint:    st.paymentHint,
          note:           st.note,
          acceptTos:      st.acceptTos,
        }),
      });

      const raw = await res.text();
      let data = null;
      try { data = raw ? JSON.parse(raw) : null; } catch {
        throw new Error(`Hibás szerverválasz (nem JSON). HTTP ${res.status}`);
      }
      if (!res.ok) {
        let errData = null;
        try { errData = raw ? JSON.parse(raw) : null; } catch {}
        let msg = errData?.error || `Hiba a fizetés indításakor (HTTP ${res.status})`;
        if (errData?.missingProductIds?.length) msg += `\nHiányzó ID-k: ${errData.missingProductIds.join(", ")}`;
        throw new Error(msg);
      }

      if (data?.id) { try { localStorage.setItem("lastSessionId", data.id); } catch {} }

      if ((data.cod || data.transfer) && data.redirect) {
        window.location.href = data.redirect;
      } else if (data?.url) {
        window.location.assign(data.url);
      } else {
        throw new Error("Hiányzik a fizetési link a szerver válaszából.");
      }
    } catch (e) {
      idempotencyKeyRef.current = null;
      dispatch(setError(e?.message || "Nem sikerült elindítani a fizetést."));
    } finally {
      dispatch(setSubmitting(false));
    }
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Pénztár</h1>

      {items.length === 0 ? (
        <div className={styles.empty}>
          <p>A kosarad üres.</p>
          <Link href="/" className={styles.linkBtn}>Vissza a főoldalra</Link>
        </div>
      ) : (
        <div className={styles.grid}>

          {/* ── LEFT – form ─────────────────────────────────────────────── */}
          <section className={styles.formCol}>

            {/* Elérhetőségek */}
            <fieldset className={styles.group}>
              <legend className={styles.legend}>Elérhetőségeik</legend>
              <div className={styles.row2}>
                <div className={styles.field}>
                  <label htmlFor="email">E-mail</label>
                  <div className={styles.inputWrap}>
                    <input
                      id="email" type="email" value={st.email}
                      placeholder="pl. nev@email.hu"
                      onChange={(e) => dispatch(setField({ key: "email", value: e.target.value }))}
                      required
                    />
                    <span className={styles.inputIcon}>✉</span>
                  </div>
                </div>
                <div className={styles.field}>
                  <label htmlFor="phone">Telefon</label>
                  <div className={styles.inputWrap}>
                    <input
                      id="phone" type="tel" value={st.phone}
                      placeholder="+36 ..."
                      onChange={(e) => dispatch(setField({ key: "phone", value: e.target.value }))}
                      required
                    />
                    <span className={styles.inputIcon}>📞</span>
                  </div>
                </div>
              </div>
            </fieldset>

            {/* Számlázási adatok */}
            <fieldset className={styles.group}>
              <legend className={styles.legend}>Számlázási adatok</legend>
              <div className={styles.field}>
                <label htmlFor="bname">Név / Cégnév *</label>
                <input
                  id="bname" type="text" value={st.billingName}
                  onChange={(e) => dispatch(setField({ key: "billingName", value: e.target.value }))}
                  required
                />
              </div>
              <div className={styles.row3}>
                <div className={styles.field}>
                  <label htmlFor="bzip">Irányítószám *</label>
                  <input
                    id="bzip" inputMode="numeric" type="number" value={st.billingZip}
                    onChange={(e) => dispatch(setField({ key: "billingZip", value: e.target.value }))}
                    required
                  />
                </div>
                <div className={styles.field}>
                  <label htmlFor="bcity">Város *</label>
                  <input
                    id="bcity" type="text" value={st.billingCity}
                    onChange={(e) => dispatch(setField({ key: "billingCity", value: e.target.value }))}
                    required
                  />
                </div>
                <div className={styles.field}>
                  <label htmlFor="baddr">Cím *</label>
                  <input
                    id="baddr" type="text" value={st.billingAddr}
                    onChange={(e) => dispatch(setField({ key: "billingAddr", value: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div className={styles.field}>
                <label htmlFor="vat">Adószám (ha céges)</label>
                <input
                  id="vat" type="text" value={st.companyVat}
                  placeholder="pl. HU12345678"
                  onChange={(e) => dispatch(setField({ key: "companyVat", value: e.target.value }))}
                />
              </div>
            </fieldset>

            {/* Szállítás */}
            <fieldset className={styles.group}>
              <legend className={styles.legend}>Szállítás</legend>
              <div className={styles.radioCol}>
                <label className={styles.radio}>
                  <input
                    type="radio" name="ship"
                    checked={st.shipping === "foxpost_courier"}
                    onChange={() => dispatch(setShippingMethod("foxpost_courier"))}
                  />
                  <span>Foxpost házhozszállítás (futár)</span>
                  <em className={styles.badge}>{homeShippingBadge}</em>
                </label>
                <label className={styles.radio}>
                  <input
                    type="radio" name="ship"
                    checked={st.shipping === "foxpost_locker"}
                    onChange={() => dispatch(setShippingMethod("foxpost_locker"))}
                  />
                  <span>Foxpost automata</span>
                  <em className={styles.badge}>{formatHUF(SHIPPING_PRICES.foxpost_locker)}</em>
                </label>
              </div>

              <p className={styles.shipNote}>
                15&nbsp;000&nbsp;Ft kosárérték felett a házhozszállítás ingyenes.
              </p>

              <label className={styles.check}>
                <input
                  type="checkbox" checked={st.shipDiff}
                  onChange={(e) => dispatch(setField({ key: "shipDiff", value: e.target.checked }))}
                />
                <span>Eltérő szállítási cím</span>
              </label>

              {st.shipDiff && (
                <div className={styles.row3}>
                  <div className={styles.field}>
                    <label htmlFor="szip">Irányítószám *</label>
                    <input
                      id="szip" inputMode="numeric" type="number" value={st.shipZip}
                      onChange={(e) => dispatch(setField({ key: "shipZip", value: e.target.value }))}
                      required
                    />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="scity">Város *</label>
                    <input
                      id="scity" type="text" value={st.shipCity}
                      onChange={(e) => dispatch(setField({ key: "shipCity", value: e.target.value }))}
                      required
                    />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="saddr">Cím *</label>
                    <input
                      id="saddr" type="text" value={st.shipAddr}
                      onChange={(e) => dispatch(setField({ key: "shipAddr", value: e.target.value }))}
                      required
                    />
                  </div>
                </div>
              )}

              {requiresPickup && (
                <div className={styles.pickupBox}>
                  <button
                    type="button" className={styles.pickupBtn}
                    onClick={() => dispatch(togglePicker(true))}
                  >
                    {st.pickupPoint ? "Átvevőpont módosítása" : "Átvevőpont választása"}
                  </button>
                  {st.pickupPoint ? (
                    <div className={styles.pickupSummary}>
                      <strong>{st.pickupPoint.name}</strong>
                      <div>{st.pickupPoint.address}</div>
                    </div>
                  ) : (
                    <p className={styles.smallNote}>Kérlek válassz átvevőpontot a továbblépéshez.</p>
                  )}
                </div>
              )}
            </fieldset>

            {/* Fizetés módja */}
            <fieldset className={styles.group}>
              <legend className={styles.legend}>Fizetés módja</legend>
              <div className={styles.radioCol}>
                <label className={styles.radio}>
                  <input
                    type="radio" name="pay"
                    checked={st.paymentHint === "card"}
                    onChange={() => dispatch(setField({ key: "paymentHint", value: "card" }))}
                  />
                  <span>Bankkártyás (online)</span>
                  <span className={styles.cardIcons}>
                    <span className={`${styles.cardBrand} ${styles.cardVisa}`}>VISA</span>
                    <span className={`${styles.cardBrand} ${styles.cardMc}`}>MC</span>
                    <span className={`${styles.cardBrand} ${styles.cardAmex}`}>AMEX</span>
                  </span>
                </label>
                <label className={styles.radio}>
                  <input
                    type="radio" name="pay"
                    checked={st.paymentHint === "transfer"}
                    onChange={() => dispatch(setField({ key: "paymentHint", value: "transfer" }))}
                  />
                  <span>Átutalás</span>
                </label>
              </div>
            </fieldset>

            {st.error && (
              <div className={styles.error} role="alert">{st.error}</div>
            )}
          </section>

          {/* ── RIGHT – summary ──────────────────────────────────────────── */}
          <aside className={styles.summary}>
            <div className={styles.sumCard}>

              {/* Header + coupon */}
              <div>
                <h2 style={{ margin: "0 0 10px", fontSize: 18, fontWeight: 700 }}>Összegzés</h2>
                <div className={styles.couponRow}>
                  <input
                    type="text"
                    value={st.coupon}
                    placeholder="Kuponkód"
                    aria-invalid={couponFeedback?.type === "error" || undefined}
                    aria-describedby={couponFeedback ? "coupon-feedback" : undefined}
                    onChange={(e) => {
                      dispatch(setField({ key: "coupon", value: e.target.value }));
                      if (couponFeedback) setCouponFeedback(null);
                      if (appliedCoupon) setAppliedCoupon("");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        void applyCoupon();
                      }
                    }}
                  />
                  <button
                    type="button"
                    className={styles.couponApply}
                    onClick={() => void applyCoupon()}
                    disabled={couponChecking}
                  >
                    {couponChecking ? "Ellenőrzés…" : "Alkalmaz"}
                  </button>
                </div>
                {couponFeedback && (
                  <p
                    id="coupon-feedback"
                    className={
                      couponFeedback.type === "ok"
                        ? styles.couponFeedbackOk
                        : styles.couponFeedbackError
                    }
                    role="status"
                    aria-live="polite"
                  >
                    {couponFeedback.text}
                  </p>
                )}
              </div>

              {/* Line items */}
              <div className={styles.sumLines}>
                <div className={styles.sumRow}>
                  <span className={styles.sumRowLabel}>Részösszeg</span>
                  <span>{formatHUF(subtotal)}</span>
                </div>
                <div className={styles.sumRow}>
                  <span className={styles.sumRowLabel}>Szállítás</span>
                  <span>{formatHUF(shippingCost)}</span>
                </div>
                <div className={styles.sumRow}>
                  <span className={styles.sumRowLabel}>Kedvezmény</span>
                  <span>-{formatHUF(discount)}</span>
                </div>
                <hr className={styles.sumDivider} />
                <div className={styles.sumTotal}>
                  <span>Összegzés</span>
                  <strong>{formatHUF(total)}</strong>
                </div>
              </div>

              {/* Extras */}
              <div className={styles.extras}>
                <p className={styles.extrasTitle}>Kiegészítők</p>
                <div className={styles.field}>
                  <label htmlFor="note">Megjegyzés</label>
                  <textarea
                    id="note"
                    className={styles.noteTextarea}
                    value={st.note}
                    placeholder="Pl. kapucsengő, időablak…"
                    onChange={(e) => dispatch(setField({ key: "note", value: e.target.value }))}
                  />
                </div>
                <label className={styles.check}>
                  <input
                    type="checkbox" checked={st.marketing}
                    onChange={(e) => dispatch(setField({ key: "marketing", value: e.target.checked }))}
                  />
                  <span>
                    Hírlevelet szeretnék kapni{" "}
                    <a href="/adatvedelem" target="_blank" rel="noopener">(Adatvédelmi nyilatkozat)</a>
                  </span>
                </label>
                <label className={styles.check}>
                  <input
                    type="checkbox" checked={st.acceptTos}
                    onChange={(e) => dispatch(setField({ key: "acceptTos", value: e.target.checked }))}
                  />
                  <span>
                    Elfogadom az{" "}
                    <a href="/aszf" target="_blank" rel="noopener">ÁSZF</a>
                    -et és megismertem az{" "}
                    <a href="/adatvedelem" target="_blank" rel="noopener">Adatkezelési tájékoztatót</a>
                    . *
                  </span>
                </label>
              </div>

              {/* CTA */}
              <button
                className={styles.submitBtn}
                onClick={onSubmit}
                disabled={!valid || st.submitting}
                aria-disabled={!valid || st.submitting}
              >
                {st.submitting ? "Továbbítás…" : "Fizetés indítása 🔒"}
              </button>
              <p className={styles.summaryNote}>
                A szállítási díj és adatok a választásaid alapján kerülnek véglegesítésre.
              </p>
            </div>
          </aside>
        </div>
      )}

      {/* Mobile sticky bar */}
      {items.length > 0 && (
        <div className={styles.sticky}>
          <span className={styles.stickyPrice}>{formatHUF(total)}</span>
          <button
            className={styles.stickyBtn}
            onClick={onSubmit}
            disabled={!valid || st.submitting}
          >
            {st.submitting ? "Továbbítás…" : "Fizetés"}
          </button>
        </div>
      )}

      {/* Pickup-point picker modal */}
      {st.showPicker && requiresPickup && (
        <PickupPointPicker
          carrier="FOXPOST"
          onClose={() => dispatch(togglePicker(false))}
          onSelect={(p) => {
            dispatch(setPickupPoint(p));
            dispatch(togglePicker(false));
          }}
        />
      )}
    </div>
  );
}
