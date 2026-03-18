"use client";

import Link from "next/link";
import React, { useMemo } from "react";

import { useStoreProducts } from "@/lib/storeQueries";
import { useStoreCart } from "@/lib/useStoreCart";
import type { StoreProduct } from "@/lib/types";

function toNumber(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export default function StoreCartPage() {
  const cart = useStoreCart();
  const { data: products } = useStoreProducts();

  const productById = useMemo(() => {
    const map = new Map<number, StoreProduct>();
    for (const p of products ?? []) map.set(p.id, p);
    return map;
  }, [products]);

  type Row = {
    product: StoreProduct;
    quantity: number;
    unit: number;
    lineTotal: number;
  };

  const rows = useMemo(() => {
    return cart.items
      .map((i) => {
        const p = productById.get(i.product_id);
        if (!p) return null;
        const unit = toNumber(p.base_price);
        return {
          product: p,
          quantity: i.quantity,
          unit,
          lineTotal: unit * i.quantity,
        };
      })
      .filter((r): r is Row => r !== null);
  }, [cart.items, productById]);

  const subtotal = rows.reduce((acc, r) => acc + r.lineTotal, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Cart</h1>
          <p className="text-sm text-zinc-600">Review your items before checkout.</p>
        </div>
        <Link href="/store" className="rounded border px-3 py-1 text-sm">
          Continue shopping
        </Link>
      </div>

      <div className="rounded-lg border bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-zinc-600">
                <th className="p-3">Item</th>
                <th className="p-3">Price</th>
                <th className="p-3">Qty</th>
                <th className="p-3">Total</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.product.id} className="border-t">
                  <td className="p-3 font-medium">
                    <Link href={`/store/product/${r.product.id}`} className="underline">
                      {r.product.name}
                    </Link>
                  </td>
                  <td className="p-3">${r.unit.toFixed(2)}</td>
                  <td className="p-3">
                    <input
                      className="w-20 rounded border px-2 py-1"
                      type="number"
                      min={1}
                      step={1}
                      value={r.quantity}
                      onChange={(e) => cart.setQuantity(r.product.id, Number(e.target.value))}
                    />
                  </td>
                  <td className="p-3 font-medium">${r.lineTotal.toFixed(2)}</td>
                  <td className="p-3">
                    <button className="text-sm underline" onClick={() => cart.remove(r.product.id)}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}

              {!rows.length ? (
                <tr>
                  <td className="p-3 text-zinc-600" colSpan={5}>
                    Your cart is empty.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-lg font-semibold">Subtotal: ${subtotal.toFixed(2)}</div>
        <div className="flex items-center gap-2">
          <button className="rounded border px-3 py-2 text-sm" onClick={() => cart.clear()}>
            Clear cart
          </button>
          <Link
            href="/store/checkout"
            className={`rounded bg-black px-4 py-2 text-sm font-medium text-white ${
              rows.length ? "" : "pointer-events-none opacity-60"
            }`}
          >
            Checkout
          </Link>
        </div>
      </div>
    </div>
  );
}
