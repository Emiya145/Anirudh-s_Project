"use client";

import Link from "next/link";
import React, { useMemo, useState } from "react";

import { loadStoreLocationId } from "@/lib/storeStorage";
import { useStoreAvailability, useStoreProducts } from "@/lib/storeQueries";
import { useStoreCart } from "@/lib/useStoreCart";

function toNumber(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export default function StoreCatalogPage() {
  const cart = useStoreCart();
  const locationId = loadStoreLocationId();
  const { data: products } = useStoreProducts();
  const { data: availability } = useStoreAvailability(locationId);

  const [query, setQuery] = useState("");

  const onHandByProduct = useMemo(() => {
    const map: Record<number, number> = {};
    for (const a of availability ?? []) map[a.product_id] = toNumber(a.on_hand);
    return map;
  }, [availability]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = products ?? [];
    if (!q) return list;
    return list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q),
    );
  }, [products, query]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Catalog</h1>
          <p className="text-sm text-zinc-600">Finished-goods-only availability, per location.</p>
        </div>
        <div className="w-full sm:w-80">
          <label className="mb-1 block text-sm">Search</label>
          <input
            className="w-full rounded border px-3 py-2 text-sm"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Croissant, SKU, category..."
          />
        </div>
      </div>

      {!locationId ? (
        <div className="rounded border bg-white p-4 text-sm">
          Select a location in the header to view live availability and checkout.
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((p) => {
          const onHand = locationId ? onHandByProduct[p.id] ?? 0 : 0;
          const price = toNumber(p.base_price);
          return (
            <div key={p.id} className="rounded-lg border bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Link href={`/store/product/${p.id}`} className="font-semibold">
                    {p.name}
                  </Link>
                  <div className="mt-1 text-xs text-zinc-600">{p.category || "Uncategorized"}</div>
                </div>
                <div className="text-sm font-medium">${price.toFixed(2)}</div>
              </div>

              {p.description ? (
                <div className="mt-2 line-clamp-3 text-sm text-zinc-700">{p.description}</div>
              ) : null}

              <div className="mt-3 flex items-center justify-between">
                <div className="text-sm text-zinc-600">
                  {locationId ? `On hand: ${onHand}` : "On hand: -"}
                </div>
                <button
                  className="rounded bg-black px-3 py-1 text-sm font-medium text-white disabled:opacity-60"
                  disabled={!locationId || onHand <= 0}
                  onClick={() => cart.add(p.id, 1)}
                >
                  Add
                </button>
              </div>
            </div>
          );
        })}

        {!filtered.length ? (
          <div className="rounded border bg-white p-4 text-sm text-zinc-600 sm:col-span-2 lg:col-span-3">
            No products.
          </div>
        ) : null}
      </div>
    </div>
  );
}
