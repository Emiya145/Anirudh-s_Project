"use client";

import React, { useState } from "react";

import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useProducts } from "@/lib/queries";
import type { ProductionBatchCreateResponse } from "@/lib/types";

export default function ProductionPage() {
  const { currentLocationId } = useAuth();
  const { data: products } = useProducts();

  const [productId, setProductId] = useState<number | "">("");
  const [qty, setQty] = useState("1");
  const [result, setResult] = useState<ProductionBatchCreateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);

    if (!currentLocationId) {
      setError("Select a location first.");
      return;
    }
    if (!productId) {
      setError("Select a product.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        location: currentLocationId,
        product: productId,
        quantity_produced: qty,
      };
      const res = await apiFetch<ProductionBatchCreateResponse>("/production-batches/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setResult(res);
    } catch {
      setError("Failed to create production batch.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Production</h1>
        <p className="text-sm text-zinc-600">Create batches and deduct ingredients automatically.</p>
      </div>

      <div className="rounded-lg border bg-white p-4">
        <h2 className="mb-3 font-semibold">Create production batch</h2>
        <form onSubmit={submit} className="grid gap-3 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm">Product</label>
            <select
              className="w-full rounded border px-3 py-2 text-sm"
              value={productId}
              onChange={(e) => setProductId(e.target.value ? Number(e.target.value) : "")}
            >
              <option value="">Select...</option>
              {(products ?? []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm">Quantity</label>
            <input
              className="w-full rounded border px-3 py-2 text-sm"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
            />
          </div>

          <div className="sm:col-span-3">
            {error ? <div className="mb-2 text-sm text-red-600">{error}</div> : null}
            <button
              className="rounded bg-black px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
              disabled={loading}
            >
              {loading ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>

      {result ? (
        <div className="rounded-lg border bg-white">
          <div className="border-b p-4">
            <h2 className="font-semibold">Result</h2>
          </div>
          <div className="p-4">
            <div className="text-sm text-zinc-600">Consumed ingredients</div>
            <pre className="mt-2 overflow-auto rounded bg-zinc-50 p-3 text-xs">
              {JSON.stringify(result.consumed, null, 2)}
            </pre>
          </div>
        </div>
      ) : null}
    </div>
  );
}
