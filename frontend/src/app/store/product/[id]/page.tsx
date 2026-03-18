"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import React, { useMemo, useState } from "react";

import { loadStoreLocationId } from "@/lib/storeStorage";
import { useStoreAvailability, useStoreProduct } from "@/lib/storeQueries";
import { useStoreCart } from "@/lib/useStoreCart";

function toNumber(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export default function StoreProductPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);

  const cart = useStoreCart();
  const locationId = loadStoreLocationId();

  const { data: product } = useStoreProduct(id);
  const { data: availability } = useStoreAvailability(locationId);

  const [qty, setQty] = useState(1);

  const onHand = useMemo(() => {
    if (!locationId) return 0;
    const row = (availability ?? []).find((a) => a.product_id === id);
    return row ? toNumber(row.on_hand) : 0;
  }, [availability, id, locationId]);

  if (!product) {
    return <div className="rounded border bg-white p-4 text-sm">Loading...</div>;
  }

  const price = toNumber(product.base_price);

  return (
    <div className="space-y-6">
      <div className="text-sm text-zinc-600">
        <Link href="/store" className="underline">
          Back to catalog
        </Link>
      </div>

      <div className="rounded-lg border bg-white p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">{product.name}</h1>
            <div className="mt-1 text-sm text-zinc-600">{product.category || "Uncategorized"}</div>
          </div>
          <div className="text-xl font-semibold">${price.toFixed(2)}</div>
        </div>

        {product.image_url ? (
          <div className="mt-4 overflow-hidden rounded border bg-zinc-50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={product.image_url} alt={product.name} className="h-64 w-full object-cover" />
          </div>
        ) : null}

        {product.description ? <p className="mt-4 text-zinc-700">{product.description}</p> : null}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="text-sm text-zinc-600">{locationId ? `On hand: ${onHand}` : "Select a location to see availability"}</div>

          <div className="flex items-center gap-2">
            <label className="text-sm">Qty</label>
            <input
              className="w-20 rounded border px-2 py-1 text-sm"
              type="number"
              min={1}
              step={1}
              value={qty}
              onChange={(e) => setQty(Math.max(1, Math.floor(Number(e.target.value) || 1)))}
            />
            <button
              className="rounded bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              disabled={!locationId || onHand <= 0}
              onClick={() => cart.add(product.id, qty)}
            >
              Add to cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
