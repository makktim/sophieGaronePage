"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { addItem } from "@/app/store/slices/cartSlice";
import { useToast } from "@/app/components/toast/ToastProvider";
import {
  FALLBACK_SHOP_PRODUCTS,
  filterListedShopProducts,
  formatPrice,
  formatProductCardTitle,
  getProductBadgeLabel,
  mapApiProductToDetail,
  resolveProductImageSrc,
  sortShopProducts,
  type ShopProductDetail,
} from "@/app/lib/shopProduct";
import QuickViewModal from "./QuickViewModal";
import styles from "./shop.module.css";

type ProductGridProps = {
  showHero?: boolean;
  sectionTitle?: string;
  className?: string;
};

export default function ProductGrid({
  showHero = false,
  sectionTitle,
  className,
}: ProductGridProps) {
  const dispatch = useDispatch();
  const { show } = useToast();
  const [products, setProducts] = useState<ShopProductDetail[]>(
    FALLBACK_SHOP_PRODUCTS
  );
  const [quickViewProduct, setQuickViewProduct] =
    useState<ShopProductDetail | null>(null);

  useEffect(() => {
    let mounted = true;
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
        if (!mounted) return;
        const apiProducts: ShopProductDetail[] = Array.isArray(data?.products)
          ? sortShopProducts(
              filterListedShopProducts(
                (data.products as Parameters<typeof mapApiProductToDetail>[0][]).map(
                  (product) => mapApiProductToDetail(product)
                )
              )
            )
          : [];
        if (apiProducts.length) setProducts(apiProducts);
      })
      .catch(() => {
        // Keep fallback products already on screen.
      });

    return () => {
      mounted = false;
    };
  }, []);

  const handleAddToCart = (product: ShopProductDetail) => {
    dispatch(
      addItem({
        id: product.id,
        name: product.title,
        price: product.price,
        quantity: 1,
        imageSrc: resolveProductImageSrc(product.imageSrc),
      })
    );
    show({ title: "Kosárba téve", description: product.title });
  };

  const openQuickView = (product: ShopProductDetail) => {
    setQuickViewProduct(product);
  };

  return (
    <section
      className={[styles.shopPage, className].filter(Boolean).join(" ")}
      aria-label={showHero ? undefined : "Termékek"}
    >
      {showHero && (
        <section className={styles.shopHero}>
          <h1 className={styles.shopTitle}>Webshop</h1>
          <p className={styles.shopIntro}>
            Válaszd ki a könyvet, add a kosárhoz, majd folytasd a fizetést.
          </p>
        </section>
      )}

      {sectionTitle && (
        <h2 className={styles.sectionTitle}>{sectionTitle}</h2>
      )}

      <section className={styles.productGrid} aria-label="Termékek">
          {products.map((product) => {
            const badgeLabel = getProductBadgeLabel(product);
            return (
            <article key={product.id} className={styles.productCard}>
              <div className={styles.productCardImage}>
                {badgeLabel && (
                  <span className={styles.saleBadge} aria-label={badgeLabel}>
                    {badgeLabel}
                  </span>
                )}
                <Image
                  src={resolveProductImageSrc(product.imageSrc)}
                  alt={product.title}
                  fill
                  className={styles.cardImage}
                  sizes="(max-width: 768px) 50vw, 240px"
                />
                <button
                  type="button"
                  className={styles.quickViewTrigger}
                  onClick={() => openQuickView(product)}
                  aria-label={`Villámnézet: ${product.title}`}
                >
                  <span className={styles.quickViewLabel}>Villámnézet</span>
                </button>
              </div>

              <h2 className={styles.productCardTitle}>
                {formatProductCardTitle(product)}
              </h2>

              <div className={styles.productCardPriceRow}>
                {product.originalPrice && (
                  <span className={styles.productCardPriceOld}>
                    {formatPrice(product.originalPrice)}
                  </span>
                )}
                <span className={styles.productCardPrice}>
                  {formatPrice(product.price)}
                </span>
              </div>

              <div className={styles.cardActions}>
                {product.inStock ? (
                  <button
                    type="button"
                    className={styles.shopBtn}
                    onClick={() => handleAddToCart(product)}
                  >
                    Kosárba teszem
                  </button>
                ) : (
                  <Link href={`/shop/${product.id}`} className={styles.shopBtn}>
                    Tovább
                  </Link>
                )}
              </div>
            </article>
            );
          })}
        </section>

      <QuickViewModal
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />
    </section>
  );
}
