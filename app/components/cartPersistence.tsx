"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { replaceCart } from "@/app/store/slices/cartSlice";
import { clearCartStorage, loadCart, saveCart } from "@/app/store/cartStorage";
import { RootState } from "../store/store";

export default function CartPersistence() {
  const dispatch = useDispatch();
  const cart = useSelector((s: RootState) => s.cart);

  useEffect(() => {
    const cached = loadCart();
    if (cached) dispatch(replaceCart(cached));
  }, [dispatch]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (cart.items.length === 0) {
      clearCartStorage();
      return;
    }
    saveCart({ ...cart, updatedAt: Date.now() });
  }, [cart]);

  return null;
}
