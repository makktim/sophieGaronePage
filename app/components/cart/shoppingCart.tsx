"use client";

import { useMemo } from "react";
import Image from "next/image";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../../store/store";
import {
  removeItem,
  updateQuantity,
  clearCart,
} from "../../store/slices/cartSlice";
import styles from "./cart.module.css";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getShopProductDetail,
  resolveProductImageSrc,
} from "@/app/lib/shopProduct";

function cartItemImageSrc(item: {
  id: string;
  imageSrc?: string;
}): string {
  if (item.imageSrc) return resolveProductImageSrc(item.imageSrc);
  const catalog = getShopProductDetail(item.id);
  return resolveProductImageSrc(catalog?.imageSrc);
}

export default function ShoppingCart() {
  const dispatch = useDispatch();
  const cartItems = useSelector((s: RootState) => s.cart.items);
  const totalAmount = useSelector((s: RootState) => s.cart.totalAmount);

  const priceLabel = useMemo(() => {
    try {
      return new Intl.NumberFormat("hu-HU", {
        style: "currency",
        currency: "HUF",
      }).format(totalAmount);
    } catch {
      return `${totalAmount} Ft`;
    }
  }, [totalAmount]);

  const router = useRouter();

  const goToCheckout = () => {
    router.push("/checkout");
  };

  const inc = (id: string) =>
    dispatch(
      updateQuantity({
        id,
        quantity: (cartItems.find((i) => i.id === id)?.quantity ?? 1) + 1,
      })
    );
  const dec = (id: string) =>
    dispatch(
      updateQuantity({
        id,
        quantity: Math.max(
          1,
          (cartItems.find((i) => i.id === id)?.quantity ?? 1) - 1
        ),
      })
    );

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Kosár</h1>

      {cartItems.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyLead}>A kosarad üres.</p>
          <Link className={styles.linkBtn} href="/">
            Vissza a főoldalra
          </Link>
        </div>
      ) : (
        <div className={styles.grid}>
          <section className={styles.items}>
            {cartItems.map((item) => (
              <article key={item.id} className={styles.card}>
                <div className={styles.thumb}>
                  <Image
                    src={cartItemImageSrc(item)}
                    alt={`${item.name} borító`}
                    fill
                    className={styles.thumbImg}
                    sizes="96px"
                  />
                </div>

                <div className={styles.cardMain}>
                  <h3 className={styles.itemTitle}>{item.name}</h3>

                  <div className={styles.metaRow}>
                    <span className={styles.unitPrice}>
                      {new Intl.NumberFormat("hu-HU", {
                        style: "currency",
                        currency: "HUF",
                      }).format(item.price)}
                    </span>
                    <span className={styles.mult}>×</span>
                    <div
                      className={styles.qty}
                      role="group"
                      aria-label="Mennyiség"
                    >
                      <button
                        className={styles.qtyBtn}
                        onClick={() => dec(item.id)}
                        aria-label="Mennyiség csökkentése"
                        disabled={item.quantity <= 1}
                        type="button"
                      >
                        –
                      </button>
                      <input
                        className={styles.qtyInput}
                        value={item.quantity}
                        readOnly
                        aria-live="polite"
                      />
                      <button
                        className={styles.qtyBtn}
                        onClick={() => inc(item.id)}
                        aria-label="Mennyiség növelése"
                        type="button"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                <div className={styles.cardAside}>
                  <strong className={styles.lineTotal}>
                    {new Intl.NumberFormat("hu-HU", {
                      style: "currency",
                      currency: "HUF",
                    }).format(item.price * item.quantity)}
                  </strong>
                  <button
                    className={styles.remove}
                    onClick={() => dispatch(removeItem(item.id))}
                    aria-label="Tétel eltávolítása"
                    type="button"
                  >
                    Eltávolítás
                  </button>
                </div>
              </article>
            ))}

            <button
              type="button"
              className={styles.clearBtn}
              onClick={() => {
                if (confirm("Biztosan üríted a kosarat?"))
                  dispatch(clearCart());
              }}
            >
              Kosár ürítése
            </button>
          </section>

          <aside className={styles.summary}>
            <div className={styles.sumCard}>
              <h2 className={styles.sumTitle}>Összegzés</h2>
              <div className={styles.row}>
                <span>Részösszeg</span>
                <span>{priceLabel}</span>
              </div>
              <div className={styles.rowNote}>
                A szállítási díj a fizetésnél kerül kiszámításra.
              </div>
              <div className={styles.totalRow}>
                <span>Összesen</span>
                <strong className={styles.total}>{priceLabel}</strong>
              </div>
              <button
                type="button"
                className={styles.checkoutBtn}
                onClick={goToCheckout}
                disabled={cartItems.length === 0}
              >
                Tovább a fizetéshez
              </button>
            </div>
          </aside>
        </div>
      )}

      {cartItems.length > 0 && (
        <div className={styles.stickyBar}>
          <span className={styles.stickyPrice}>{priceLabel}</span>
          <button
            type="button"
            className={styles.stickyBtn}
            onClick={goToCheckout}
            aria-label="Tovább a fizetéshez"
          >
            Fizetés
          </button>
        </div>
      )}
    </div>
  );
}
