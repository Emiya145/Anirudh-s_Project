"use client";

import { useEffect, useMemo, useState } from "react";

import {
  loadStoreCart,
  onStoreCartChanged,
  saveStoreCart,
  type StoreCartItem,
} from "@/lib/storeStorage";

export function useStoreCart() {
  const [items, setItems] = useState<StoreCartItem[]>(() => loadStoreCart());

  useEffect(() => {
    return onStoreCartChanged(() => setItems(loadStoreCart()));
  }, []);

  const api = useMemo(() => {
    const setQuantity = (productId: number, quantity: number) => {
      const q = Math.max(0, Math.floor(quantity));
      const next = items.filter((i) => i.product_id !== productId);
      if (q > 0) next.push({ product_id: productId, quantity: q });
      saveStoreCart(next);
      setItems(next);
    };

    const add = (productId: number, delta: number) => {
      const existing = items.find((i) => i.product_id === productId);
      const nextQty = (existing?.quantity ?? 0) + delta;
      setQuantity(productId, nextQty);
    };

    const remove = (productId: number) => {
      const next = items.filter((i) => i.product_id !== productId);
      saveStoreCart(next);
      setItems(next);
    };

    const clear = () => {
      saveStoreCart([]);
      setItems([]);
    };

    const totalItems = items.reduce((acc, i) => acc + i.quantity, 0);

    return { items, setQuantity, add, remove, clear, totalItems };
  }, [items]);

  return api;
}
