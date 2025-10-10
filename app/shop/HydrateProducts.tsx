"use client";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { setProducts } from "../store/slices/productSlice";

type Props = {
  products: Array<{
    id: string;
    title: string;
    priceHUF: number;
    stock: number;
    createdAt: Date;
    imageUrl?: string | null;
  }>;
};

export default function HydrateProducts({ products }: Props) {
  const dispatch = useDispatch();

  useEffect(() => {
    // map DB -> UI shape
    const mapped = products.map((p) => ({
      id: p.id,
      title: p.title,
      price: p.priceHUF,
      currency: "HUF" as const,
      inStock: (p.stock ?? 0) > 0,
      imageSrc: p.imageUrl ?? "/placeholder.png",
    }));
    dispatch(setProducts(mapped));
  }, [dispatch, products]);

  return null; // nincs UI, csak store-t tölti
}
