// app/_components/CartPersistence.tsx
"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { replaceCart } from "@/app/store/slices/cartSlice";
import { loadCart, saveCart } from "@/app/store/cartStorage";

export default function CartPersistence() {
  const dispatch = useDispatch();
  const cart = useSelector((s: any) => s.cart);

  // 1) betöltés első render után (SSR-safe)
  useEffect(() => {
    const cached = loadCart();
    if (cached) dispatch(replaceCart(cached));
  }, [dispatch]);

  // 2) mentés: kis „debounce”, hogy ne írjunk túl sűrűn
  useEffect(() => {
    const id = setTimeout(() => {
      if (cart) saveCart(cart);
    }, 150);
    return () => clearTimeout(id);
  }, [cart]);

  return null;
}
