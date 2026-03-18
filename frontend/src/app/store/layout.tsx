"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";

import { useStoreLocations } from "@/lib/storeQueries";
import { loadStoreLocationId, saveStoreLocationId } from "@/lib/storeStorage";
import { useStoreCart } from "@/lib/useStoreCart";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  const { data: locations } = useStoreLocations();
  const cart = useStoreCart();

  const [locationId, setLocationId] = useState<number | "">(() => loadStoreLocationId() ?? "");

  useEffect(() => {
    saveStoreLocationId(locationId === "" ? null : locationId);
  }, [locationId]);

  const currentLocation = useMemo(
    () => (locations ?? []).find((l) => l.id === locationId) ?? null,
    [locations, locationId],
  );

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="sticky top-0 z-10 border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-4">
            <Link href="/store" className="text-lg font-semibold">
              Bakery Store
            </Link>
            <div className="hidden text-sm text-zinc-600 sm:block">
              {currentLocation ? currentLocation.name : "Select a location"}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <select
              className="rounded border px-2 py-1 text-sm"
              value={locationId}
              onChange={(e) => setLocationId(e.target.value ? Number(e.target.value) : "")}
            >
              <option value="">Location...</option>
              {(locations ?? []).map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>

            <Link
              href="/store/cart"
              className="rounded border px-3 py-1 text-sm font-medium"
            >
              Cart ({cart.totalItems})
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>

      <footer className="border-t bg-white">
        <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-zinc-600">
          Storefront (pickup + delivery)
        </div>
      </footer>
    </div>
  );
}
