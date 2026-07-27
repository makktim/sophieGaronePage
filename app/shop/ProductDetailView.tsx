"use client";

import { useState, useCallback, useMemo } from "react";
import Image from "next/image";
import styles from "./shop.module.css";
import { useDispatch } from "react-redux";
import { addItem } from "@/app/store/slices/cartSlice";
import { useToast } from "@/app/components/toast/ToastProvider";
import {
  formatPrice,
  formatProductCardTitle,
  getProductBadgeLabel,
  resolveProductImageSrc,
  type ShopProductDetail,
} from "@/app/lib/shopProduct";

type ProductDetailViewProps = {
  product: ShopProductDetail;
  variant?: "page" | "modal";
};

export default function ProductDetailView({
  product,
  variant = "page",
}: ProductDetailViewProps) {
  const dispatch = useDispatch();
  const [qty, setQty] = useState(1);
  const { show } = useToast();

  const priceLabel = useMemo(
    () => formatPrice(product.price, product.currency),
    [product.price, product.currency]
  );

  const originalPriceLabel = useMemo(
    () =>
      product.originalPrice
        ? formatPrice(product.originalPrice, product.currency)
        : null,
    [product.originalPrice, product.currency]
  );

  const dec = useCallback(() => setQty((q) => Math.max(1, q - 1)), []);
  const inc = useCallback(() => setQty((q) => q + 1), []);

  const addToCartHandler = useCallback(() => {
    dispatch(
      addItem({
        id: product.id,
        name: product.title,
        price: product.price,
        quantity: qty,
        imageSrc: resolveProductImageSrc(product.imageSrc),
      })
    );
    show({ title: "Kosárba téve", description: `${qty} × ${product.title}` });
  }, [dispatch, product.id, product.title, product.price, product.imageSrc, qty, show]);

  const displayTitle =
    variant === "modal" ? formatProductCardTitle(product) : product.title;
  const badgeLabel = getProductBadgeLabel(product);
  const imageSrc = resolveProductImageSrc(product.imageSrc);

  const content = (
    <>
      <header className={styles.header}>
        <h1 className={variant === "modal" ? styles.modalTitle : styles.title}>
          {displayTitle}
        </h1>
        <div className={styles.priceRow}>
          {originalPriceLabel && (
            <span className={styles.priceOld}>{originalPriceLabel}</span>
          )}
          <span
            className={
              variant === "modal" && product.onSale
                ? styles.modalPrice
                : styles.price
            }
          >
            {priceLabel}
          </span>

          {variant === "page" &&
            (product.inStock ? (
              <span className={styles.stockOk} aria-live="polite">
                Raktáron
              </span>
            ) : (
              <span className={styles.stockNo} aria-live="polite">
                Jelenleg nem elérhető
              </span>
            ))}
        </div>
        {product.description && (
          <p
            className={variant === "modal" ? styles.modalLead : styles.lead}
            title={product.description}
          >
            {product.description}
          </p>
        )}
      </header>

      {variant === "page" && (
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
      )}

      <div className={styles.descOneLine}>{product.tagline}</div>
      <div
        className={
          variant === "modal" ? styles.modalDescription : styles.description
        }
      >
        {product.longDescription}
      </div>

      <div
        className={
          variant === "modal" ? styles.modalPurchase : styles.purchase
        }
      >
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
          className={variant === "modal" ? styles.modalAddBtn : styles.addBtn}
          onClick={addToCartHandler}
          disabled={!product.inStock}
        >
          {product.inStock ? "Kosárba teszem" : "Nincs raktáron"}
        </button>
      </div>

      {variant === "page" && product.deliveryNote && (
        <p className={styles.deliveryNote}>
          Szállítás: {product.deliveryNote}
        </p>
      )}
    </>
  );

  if (variant === "modal") {
    return (
      <div className={styles.modalGrid}>
        <aside className={styles.modalMedia}>
          <div className={styles.modalImageWrap}>
            {badgeLabel && (
              <span className={styles.saleBadge} aria-label={badgeLabel}>
                {badgeLabel}
              </span>
            )}
            <Image
              src={imageSrc}
              alt={`${product.title} – könyvborító`}
              fill
              priority
              className={styles.image}
            />
          </div>
        </aside>
        <section className={styles.modalContent}>{content}</section>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.grid}>
        <aside className={styles.media}>
          <div className={styles.imageWrap}>
            {badgeLabel && (
              <span className={styles.saleBadge} aria-label={badgeLabel}>
                {badgeLabel}
              </span>
            )}
            <Image
              src={imageSrc}
              alt={`${product.title} – könyvborító`}
              fill
              priority
              className={styles.image}
            />
          </div>
        </aside>
        <section className={styles.content}>{content}</section>
      </div>

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
