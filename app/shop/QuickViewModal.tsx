"use client";

import { useEffect, useCallback } from "react";
import ProductDetailView from "./ProductDetailView";
import styles from "./shop.module.css";
import type { ShopProductDetail } from "@/app/lib/shopProduct";

type QuickViewModalProps = {
  product: ShopProductDetail | null;
  onClose: () => void;
};

export default function QuickViewModal({
  product,
  onClose,
}: QuickViewModalProps) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (!product) return;

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [product, handleKeyDown]);

  if (!product) return null;

  return (
    <div
      className={styles.quickViewOverlay}
      role="dialog"
      aria-modal="true"
      aria-label={`Villámnézet: ${product.title}`}
      onClick={onClose}
    >
      <button
        type="button"
        className={styles.quickViewClose}
        onClick={onClose}
        aria-label="Bezárás"
      >
        ×
      </button>
      <div
        className={styles.quickViewDialog}
        onClick={(event) => event.stopPropagation()}
      >
        <ProductDetailView product={product} variant="modal" />
      </div>
    </div>
  );
}
