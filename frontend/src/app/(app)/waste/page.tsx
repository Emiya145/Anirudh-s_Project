"use client";

import React, { useMemo, useState } from "react";

import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useIngredientLots, useIngredients, useWasteRecords } from "@/lib/queries";

export default function WastePage() {
  const { currentLocationId } = useAuth();
  const { data: ingredients } = useIngredients();
  const { data: lots } = useIngredientLots();
  const { data: waste, refetch } = useWasteRecords();

  const [ingredientId, setIngredientId] = useState<number | "">("");
  const [lotId, setLotId] = useState<number | "">("");
  const [qty, setQty] = useState("1.000");
  const [reason, setReason] = useState<"expired" | "discarded">("expired");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const ingredientNameById = useMemo(() => {
    const map: Record<number, string> = {};
    for (const i of ingredients ?? []) map[i.id] = i.name;
    return map;
  }, [ingredients]);

  const filteredLots = useMemo(() => {
    return (lots ?? [])
      .filter((l) => (!currentLocationId ? true : l.location === currentLocationId))
      .filter((l) => (!ingredientId ? true : l.ingredient === ingredientId));
  }, [lots, currentLocationId, ingredientId]);

  const rows = useMemo(() => {
    return (waste ?? []).filter((w) => (!currentLocationId ? true : w.location === currentLocationId));
  }, [waste, currentLocationId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!currentLocationId) {
      setError("Select a location first.");
      return;
    }
    if (!ingredientId) {
      setError("Select an ingredient.");
      return;
    }

    setLoading(true);
    try {
      await apiFetch("/waste-records/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: currentLocationId,
          ingredient: ingredientId,
          ingredient_lot: lotId ? lotId : null,
          quantity: qty,
          reason,
        }),
      });

      setLotId("");
      setQty("1.000");
      await refetch();
    } catch {
      setError("Failed to record waste.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Waste</h1>
        <p className="text-sm text-zinc-600">Record expired/discarded ingredients (deducts stock atomically).</p>
      </div>

      <div className="rounded-lg border bg-white p-4">
        <h2 className="mb-3 font-semibold">Record waste</h2>
        <form onSubmit={submit} className="grid gap-3 sm:grid-cols-4">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm">Ingredient</label>
            <select
              className="w-full rounded border px-3 py-2 text-sm"
              value={ingredientId}
              onChange={(e) => {
                const v = e.target.value;
                setIngredientId(v ? Number(v) : "");
                setLotId("");
              }}
            >
              <option value="">Select...</option>
              {(ingredients ?? []).map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm">Lot (optional)</label>
            <select
              className="w-full rounded border px-3 py-2 text-sm"
              value={lotId}
              onChange={(e) => setLotId(e.target.value ? Number(e.target.value) : "")}
              disabled={!ingredientId}
            >
              <option value="">FEFO (auto)</option>
              {filteredLots.map((l) => (
                <option key={l.id} value={l.id}>
                  Lot {l.id} — remaining {l.quantity_remaining} — exp {l.expiry_date ?? "-"}
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

          <div>
            <label className="mb-1 block text-sm">Reason</label>
            <select
              className="w-full rounded border px-3 py-2 text-sm"
              value={reason}
              onChange={(e) => setReason(e.target.value as "expired" | "discarded")}
            >
              <option value="expired">Expired</option>
              <option value="discarded">Discarded</option>
            </select>
          </div>

          <div className="sm:col-span-4">
            {error ? <div className="mb-2 text-sm text-red-600">{error}</div> : null}
            <button
              className="rounded bg-black px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
              disabled={loading}
            >
              {loading ? "Saving..." : "Record waste"}
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-lg border bg-white">
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="font-semibold">Waste records</h2>
          <button className="rounded border px-3 py-1 text-sm" onClick={() => refetch()}>
            Refresh
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-zinc-600">
                <th className="p-3">Time</th>
                <th className="p-3">Ingredient</th>
                <th className="p-3">Lot</th>
                <th className="p-3">Qty</th>
                <th className="p-3">Reason</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="p-3">{new Date(r.recorded_at).toLocaleString()}</td>
                  <td className="p-3">{ingredientNameById[r.ingredient] ?? r.ingredient}</td>
                  <td className="p-3">{r.ingredient_lot ?? "-"}</td>
                  <td className="p-3 font-medium">{r.quantity}</td>
                  <td className="p-3">{r.reason}</td>
                </tr>
              ))}
              {!rows.length ? (
                <tr>
                  <td className="p-3 text-zinc-600" colSpan={5}>
                    No waste records.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
