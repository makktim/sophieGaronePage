"use client";

import { useEffect, useMemo } from "react";
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
} from "../store/slices/shippingSlice"; // igazítsd az elérési utat

const PickupPointPicker = dynamic(
  () => import("../components/shipping/PickupPointPicker"),
  { ssr: false }
);

// szállítási díjak
const SHIPPING_PRICES = {
  foxpost_courier: 1890,
  foxpost_locker: 990,
  pickup: 0,
};

function formatHUF(v) {
  const n = Number(v);
  const safe = Number.isFinite(n) ? n : 0;
  try {
    return new Intl.NumberFormat("hu-HU", {
      style: "currency",
      currency: "HUF",
    }).format(safe);
  } catch {
    return `${safe} Ft`;
  }
}

function buildPayloadItems(items) {
  return items.map((i) => ({
    id: i.productId ?? i.id, // a backend "id"-t vár → legyen ez a Product.id
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

  const items = useSelector((s) => s.cart.items);
  const subtotal = useSelector((s) => s.cart.totalAmount);

  const st = useSelector((s) => s.shipping);

  useEffect(() => {
    if (!st.shipping) dispatch(setShippingMethod("foxpost_courier"));
  }, [st.shipping, dispatch]);

  useEffect(() => {
    dispatch(setField({ key: "subtotal", value: subtotal }));
    dispatch(setField({ key: "itemsCount", value: items.length }));
  }, [dispatch, subtotal, items.length]);

  const shippingCost = useMemo(() => {
    const price = SHIPPING_PRICES?.[st?.shipping];
    return Number.isFinite(price) ? price : 0;
  }, [st?.shipping]);

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
    const emailOk = /\S+@\S+\.\S+/.test(st.email);
    const phoneOk = st.phone.trim().length >= 6;
    const billingOk =
      st.billingName && st.billingZip && st.billingCity && st.billingAddr;
    const shipOk = !st.shipDiff || (st.shipZip && st.shipCity && st.shipAddr);
    const hasItems = items.length > 0;
    const pickupOk = !requiresPickup || !!st.pickupPoint;
    return (
      emailOk &&
      phoneOk &&
      billingOk &&
      shipOk &&
      pickupOk &&
      st.acceptTos &&
      hasItems
    );
  }, [st, requiresPickup, items.length]);

  async function onSubmit() {
    if (!valid || st.submitting) return;
    dispatch(setError(null));
    dispatch(setSubmitting(true));

    const payloadItems = buildPayloadItems(items);
    if (payloadItems.some((it) => !it.id)) {
      dispatch(
        setError(
          "Hiba a kosárban: hiányzik egy termékazonosító. Tedd újra a kosárba."
        )
      );
      return;
    }

    try {
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
            shippingAddress, // nálad már kiszámolva
          },
          shippingMethod: st.shipping,
          pickupPoint: st.pickupPoint || null,
          shippingCost,
          paymentHint: st.paymentHint,
          coupon: st.coupon,
          note: st.note,
          acceptTos: st.acceptTos,
          marketing: st.marketing,
          subtotal,
          discount,
          total,
          totals: { subtotal, shipping: shippingCost, discount, total },
        }),
      });

      // --- robusztus válaszfeldolgozás ---
      const raw = await res.text();
      let data = null;
      try {
        data = raw ? JSON.parse(raw) : null;
      } catch {
        throw new Error(`Hibás szerverválasz (nem JSON). HTTP ${res.status}`);
      }
      if (!res.ok) {
        let data = null;
        try {
          data = raw ? JSON.parse(raw) : null;
        } catch {}
        let msg =
          data?.error || `Hiba a fizetés indításakor (HTTP ${res.status})`;
        if (data?.missingProductIds?.length) {
          msg += `\nHiányzó ID-k: ${data.missingProductIds.join(", ")}`;
        }
        throw new Error(msg);
      }

      // --- session eltárolása a /success fallbackhez
      if (data?.id) {
        try {
          localStorage.setItem("lastSessionId", data.id);
        } catch {}
      }

      if (data.cod && data.redirect) {
        // utánvét: saját success oldal
        window.location.href = data.redirect;
      } else if (data?.url) {
        window.location.assign(data.url);
      } else {
        throw new Error("Hiányzik a fizetési link a szerver válaszából.");
      }
    } catch (e) {
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
          <Link href="/" className={styles.linkBtn}>
            Vissza a főoldalra
          </Link>
        </div>
      ) : (
        <div className={styles.grid}>
          {/* BAL – űrlap */}
          <section className={styles.formCol}>
            <fieldset className={styles.group}>
              <legend>Elérhetőségek</legend>
              <div className={styles.row2}>
                <div className={styles.field}>
                  <label htmlFor="email">Email *</label>
                  <input
                    id="email"
                    type="email"
                    value={st.email}
                    onChange={(e) =>
                      dispatch(
                        setField({ key: "email", value: e.target.value })
                      )
                    }
                    required
                  />
                </div>
                <div className={styles.field}>
                  <label htmlFor="phone">Telefon *</label>
                  <input
                    id="phone"
                    type="tel"
                    value={st.phone}
                    onChange={(e) =>
                      dispatch(
                        setField({ key: "phone", value: e.target.value })
                      )
                    }
                    required
                  />
                </div>
              </div>
            </fieldset>

            <fieldset className={styles.group}>
              <legend>Számlázási adatok</legend>
              <div className={styles.field}>
                <label htmlFor="bname">Név / Cégnév *</label>
                <input
                  id="bname"
                  type="text"
                  value={st.billingName}
                  onChange={(e) =>
                    dispatch(
                      setField({ key: "billingName", value: e.target.value })
                    )
                  }
                  required
                />
              </div>
              <div className={styles.row3}>
                <div className={styles.field}>
                  <label htmlFor="bzip">Irányítószám *</label>
                  <input
                    id="bzip"
                    inputMode="numeric"
                    type="number"
                    value={st.billingZip}
                    onChange={(e) =>
                      dispatch(
                        setField({ key: "billingZip", value: e.target.value })
                      )
                    }
                    required
                  />
                </div>
                <div className={styles.field}>
                  <label htmlFor="bcity">Város *</label>
                  <input
                    id="bcity"
                    type="text"
                    value={st.billingCity}
                    onChange={(e) =>
                      dispatch(
                        setField({ key: "billingCity", value: e.target.value })
                      )
                    }
                    required
                  />
                </div>
                <div className={styles.field}>
                  <label htmlFor="baddr">Cím *</label>
                  <input
                    id="baddr"
                    type="text"
                    value={st.billingAddr}
                    onChange={(e) =>
                      dispatch(
                        setField({ key: "billingAddr", value: e.target.value })
                      )
                    }
                    required
                  />
                </div>
              </div>
              <div className={styles.field}>
                <label htmlFor="vat">Adószám (ha céges)</label>
                <input
                  id="vat"
                  type="text"
                  value={st.companyVat}
                  onChange={(e) =>
                    dispatch(
                      setField({ key: "companyVat", value: e.target.value })
                    )
                  }
                  placeholder="pl. HU12345678"
                />
              </div>
            </fieldset>

            <fieldset className={styles.group}>
              <legend>Szállítás</legend>
              <div className={styles.radioCol}>
                <label className={styles.radio}>
                  <input
                    type="radio"
                    name="ship"
                    checked={st.shipping === "foxpost_courier"}
                    onChange={() =>
                      dispatch(setShippingMethod("foxpost_courier"))
                    }
                  />
                  <span>Foxpost házhozszállítás (futár)</span>
                  <em className={styles.badge}>
                    {formatHUF(SHIPPING_PRICES.foxpost_courier)}
                  </em>
                </label>

                <label className={styles.radio}>
                  <input
                    type="radio"
                    name="ship"
                    checked={st.shipping === "foxpost_locker"}
                    onChange={() =>
                      dispatch(setShippingMethod("foxpost_locker"))
                    }
                  />
                  <span>Foxpost automata</span>
                  <em className={styles.badge}>
                    {formatHUF(SHIPPING_PRICES.foxpost_locker)}
                  </em>
                </label>
              </div>

              <label className={styles.check}>
                <input
                  type="checkbox"
                  checked={st.shipDiff}
                  onChange={(e) =>
                    dispatch(
                      setField({ key: "shipDiff", value: e.target.checked })
                    )
                  }
                />
                Eltérő szállítási cím
              </label>

              {st.shipDiff && (
                /* a meglévő három mezős cím blokk marad */
                <div className={styles.row3}>
                  {/* ...szállítási cím mezők... */}
                </div>
              )}

              {requiresPickup && (
                <div className={styles.pickupBox}>
                  <button
                    type="button"
                    className={styles.stickyBtn}
                    onClick={() => dispatch(togglePicker(true))}
                  >
                    {st.pickupPoint
                      ? "Átvevőpont módosítása"
                      : "Átvevőpont választása"}
                  </button>
                  {st.pickupPoint ? (
                    <div className={styles.pickupSummary}>
                      <strong>{st.pickupPoint.name}</strong>
                      <div>{st.pickupPoint.address}</div>
                    </div>
                  ) : (
                    <p className={styles.smallNote}>
                      Kérlek válassz átvevőpontot a továbblépéshez.
                    </p>
                  )}
                </div>
              )}
            </fieldset>

            <fieldset className={styles.group}>
              <legend>Fizetés módja</legend>
              <div className={styles.radioRow}>
                <label className={styles.radio}>
                  <input
                    type="radio"
                    name="pay"
                    checked={st.paymentHint === "card"}
                    onChange={() =>
                      dispatch(setField({ key: "paymentHint", value: "card" }))
                    }
                  />
                  <span>Bankkártya (online)</span>
                </label>
                <label className={styles.radio}>
                  <input
                    type="radio"
                    name="pay"
                    checked={st.paymentHint === "cod"}
                    onChange={() =>
                      dispatch(setField({ key: "paymentHint", value: "cod" }))
                    }
                  />
                  <span>Utánvét (készpénz/kártya a futárnál)</span>
                </label>
              </div>
            </fieldset>

            <fieldset className={styles.group}>
              <legend>Kiegészítők</legend>
              <div className={styles.row2}>
                {/*                 <div className={styles.field}>
                  <label htmlFor="coupon">Kuponkód</label>
                  <input
                    id="coupon"
                    type="text"
                    value={st.coupon}
                    onChange={(e) =>
                      dispatch(
                        setField({ key: "coupon", value: e.target.value })
                      )
                    }
                  />
                </div> */}
                <div className={styles.field}>
                  <label htmlFor="note">Megjegyzés</label>
                  <input
                    id="note"
                    type="text"
                    value={st.note}
                    onChange={(e) =>
                      dispatch(setField({ key: "note", value: e.target.value }))
                    }
                    placeholder="Pl. kapucsengő, időablak…"
                  />
                </div>
              </div>
              <label className={styles.check}>
                <input
                  type="checkbox"
                  checked={st.marketing}
                  onChange={(e) =>
                    dispatch(
                      setField({ key: "marketing", value: e.target.checked })
                    )
                  }
                />
                Szeretnék hírlevelet és akciókat kapni (opcionális)
              </label>
              <label className={styles.check}>
                <input
                  type="checkbox"
                  checked={st.acceptTos}
                  onChange={(e) =>
                    dispatch(
                      setField({ key: "acceptTos", value: e.target.checked })
                    )
                  }
                />
                Elfogadom az{" "}
                <a href="/aszf" target="_blank" rel="noopener">
                  ÁSZF
                </a>
                -et és megismertem az{" "}
                <a href="/adatvedelem" target="_blank" rel="noopener">
                  Adatkezelési tájékoztatót
                </a>
                . *
              </label>
            </fieldset>

            {st.error && (
              <div className={styles.error} role="alert">
                {st.error}
              </div>
            )}

            <button
              className={styles.primary}
              onClick={onSubmit}
              disabled={!valid || st.submitting}
              aria-disabled={!valid || st.submitting}
            >
              {st.submitting ? "Továbbítás…" : "Tovább a fizetéshez"}
            </button>
          </section>

          {/* JOBB – összegző */}
          <aside className={styles.summary}>
            <div className={styles.sumCard}>
              <h2>Összegzés</h2>
              <div className={styles.sumRow}>
                <span>Részösszeg</span>
                <span>{formatHUF(subtotal)}</span>
              </div>
              <div className={styles.sumRow}>
                <span>Szállítás</span>
                <span>{formatHUF(shippingCost)}</span>
              </div>
              <div className={styles.sumTotal}>
                <span>Végösszeg</span>
                <strong>{formatHUF(total)}</strong>
              </div>
              <button
                className={styles.primaryGhost}
                onClick={onSubmit}
                disabled={!valid || st.submitting}
              >
                Fizetés indítása
              </button>
              <p className={styles.summaryNote}>
                A szállítási díj és adatok a választásaid alapján kerülnek
                véglegesítésre.
              </p>
            </div>
          </aside>
        </div>
      )}

      {/* Mobil ragadós sáv */}
      {items.length > 0 && (
        <div className={styles.sticky}>
          <span className={styles.stickyPrice}>{formatHUF(total)}</span>
          <button
            className={styles.stickyBtn}
            onClick={onSubmit}
            disabled={!valid || st.submitting}
          >
            Fizetés
          </button>
        </div>
      )}

      {/* Átvevőpont-picker modál */}
      {st.showPicker && requiresPickup && (
        <PickupPointPicker
          carrier={"FOXPOST"}
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
