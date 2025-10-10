"use client";

import { useState, useCallback, useMemo } from "react";
import Image from "next/image";
import styles from "../shop.module.css";
import { useDispatch } from "react-redux";
import book from "../../../public/assets/extra.png";

import { addItem } from "@/app/store/slices/cartSlice";
import { useToast } from "@/app/components/toast/ToastProvider";

type ClientProduct = {
  id: string;
  title: string;
  price: number;
  currency?: string;
  imageSrc: string;
  description?: string;
  meta?: Record<string, any>;
  inStock?: boolean;
  deliveryNote?: string;
};

export default function ProductClient({ product }: { product: ClientProduct }) {
  const dispatch = useDispatch();
  const [qty, setQty] = useState(1);
  const { show } = useToast();

  const priceLabel = useMemo(() => {
    try {
      return new Intl.NumberFormat("hu-HU", {
        style: "currency",
        currency: product.currency || "HUF",
      }).format(product.price);
    } catch {
      return `${product.price} ${product.currency || ""}`.trim();
    }
  }, [product.price, product.currency]);

  const dec = useCallback(() => setQty((q) => Math.max(1, q - 1)), []);
  const inc = useCallback(() => setQty((q) => q + 1), []);

  const addToCartHandler = useCallback(() => {
    dispatch(
      addItem({
        id: product.id, // ⟵ DB-s UUID megy a kosárba
        name: product.title,
        price: product.price, // csak kijelzésre, backend DB-árat használ
        quantity: qty,
      })
    );
    show({ title: "Kosárba téve", description: `${qty} × ${product.title}` });
  }, [dispatch, product.id, product.title, product.price, qty, show]);

  return (
    <div className={styles.page}>
      <div className={styles.grid}>
        {/* KÉP */}
        <aside className={styles.media}>
          <div className={styles.imageWrap}>
            <Image
              src={book}
              alt={`${product.title} – könyvborító`}
              fill
              priority
              className={styles.image}
            />
          </div>
        </aside>

        {/* TARTALOM */}
        <section className={styles.content}>
          <header className={styles.header}>
            <h1 className={styles.title}>{product.title}</h1>
            <div className={styles.priceRow}>
              <span className={styles.price}>{priceLabel}</span>

              {product.inStock ? (
                <span className={styles.stockOk} aria-live="polite">
                  Raktáron
                </span>
              ) : (
                <span className={styles.stockNo} aria-live="polite">
                  Jelenleg nem elérhető
                </span>
              )}
            </div>
            {product.description && (
              <p className={styles.lead} title={product.description}>
                {product.description}
              </p>
            )}
          </header>

          {/* Specifikációk – dl rácsban */}
          <dl className={styles.specs}>
            {product.meta?.type && (
              <>
                <dt>Típus</dt>
                <dd>{product.meta.type}</dd>
              </>
            )}
            {product.meta?.language && (
              <>
                <dt>Nyelv</dt>
                <dd>{product.meta.language}</dd>
              </>
            )}
            {typeof product.meta?.pages === "number" && (
              <>
                <dt>Oldalszám</dt>
                <dd>{product.meta.pages}</dd>
              </>
            )}
            {product.meta?.isbn && (
              <>
                <dt>ISBN</dt>
                <dd>{product.meta.isbn}</dd>
              </>
            )}
            {product.meta?.size && (
              <>
                <dt>Méret</dt>
                <dd>{product.meta.size}</dd>
              </>
            )}
          </dl>
          {/*    <div className={styles.descTitle}>Leírás</div> */}
          <div className={styles.descOneLine}>Harcos. Őrangyal.</div>
          <div className={styles.description}>
            Ez a két szó volt Kyra mindene évszázadokon át. Egészen addig, amíg
            védence, Matt megmentéséért meg nem szegte a Menny legfőbb
            törvényét. Büntetésül emberként kell szembenéznie a démonokkal, akik
            mindenáron meg akarják ölni a férfit. Miközben versenyt futnak
            az idővel, hogy feltárják Matt kilétének titkát, egyre közelebb
            kerülnek egymáshoz, és a lány újra felfedezi az érzéseket, amelyeket
            már rég száműzött magából. De vajon utat engedhet az érzelmeinek
            Kyra? És ha rájönnek az igazságra, visszakaphatja a szárnyait?
            Sophie Garone szerzőpáros regénye egy érzelmekkel teli, akciódús,
            romantikus fantasy, amely a halandóság törékenységét, az
            önfeláldozás erejét és a sors határait feszegeti, miközben az emberi
            lét legfontosabb kérdéseit is górcső alá veszi.
          </div>

          {/* CTA blokk */}
          <div className={styles.purchase}>
            <div
              className={styles.qtyWrap}
              role="group"
              aria-label="Mennyiség kiválasztása"
            >
              <button
                type="button"
                onClick={dec}
                className={styles.qtyBtn}
                aria-label="Mennyiség csökkentése"
                disabled={qty <= 1}
              >
                –
              </button>
              <input
                className={styles.qtyInput}
                type="text"
                inputMode="numeric"
                readOnly
                aria-live="polite"
                value={qty}
              />
              <button
                type="button"
                onClick={inc}
                className={styles.qtyBtn}
                aria-label="Mennyiség növelése"
              >
                +
              </button>
            </div>

            <button
              type="button"
              className={styles.addBtn}
              onClick={addToCartHandler}
              disabled={!product.inStock}
            >
              Kosárba
            </button>
          </div>

          {/* Szállítási infó */}
          {product.deliveryNote && (
            <p className={styles.deliveryNote}>
              Szállítás: {product.deliveryNote}
            </p>
          )}
        </section>
      </div>

      {/* Mobil ragadós CTA */}
      <div className={styles.stickyBar} aria-hidden={false}>
        <span className={styles.stickyPrice}>{priceLabel}</span>
        <button
          type="button"
          className={styles.stickyBtn}
          onClick={addToCartHandler}
          disabled={!product.inStock}
        >
          Kosárba
        </button>
      </div>
    </div>
  );
}
