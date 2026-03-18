"use client";

import React, { useMemo, useState } from "react";

import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useIngredients, usePurchaseOrders, useSuppliers } from "@/lib/queries";
import type { PurchaseOrder, PurchaseOrderReceiveResult } from "@/lib/types";

export default function PurchaseOrdersPage() {
  const { currentLocationId } = useAuth();
  const { data: suppliers } = useSuppliers();
  const { data: ingredients } = useIngredients();
  const { data: pos, refetch } = usePurchaseOrders();

  const [supplierId, setSupplierId] = useState<number | "">("");
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState<string>("");
  const [ingredientId, setIngredientId] = useState<number | "">("");
  const [qty, setQty] = useState("1.000");
  const [unitPrice, setUnitPrice] = useState<string>("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [receivingPo, setReceivingPo] = useState<PurchaseOrder | null>(null);
  const [receivedDate, setReceivedDate] = useState<string>("");
  const [receiveLines, setReceiveLines] = useState<
    Array<{ line_id: number; quantity_received: string; expiry_date: string; supplier_lot_code: string }>
  >([]);
  const [receiveResult, setReceiveResult] = useState<PurchaseOrderReceiveResult | null>(null);
  const [receiving, setReceiving] = useState(false);

  const ingredientById = useMemo(() => {
    const map: Record<number, { name: string; is_perishable: boolean }> = {};
    for (const i of ingredients ?? []) map[i.id] = { name: i.name, is_perishable: i.is_perishable };
    return map;
  }, [ingredients]);

  const visiblePOs = useMemo(() => {
    return (pos ?? []).filter((p) => (!currentLocationId ? true : p.location === currentLocationId));
  }, [pos, currentLocationId]);

  const createPO = async () => {
    setError(null);
    if (!currentLocationId) return setError("Select a location first.");
    if (!supplierId) return setError("Select a supplier.");
    if (!ingredientId) return setError("Select an ingredient.");

    setCreating(true);
    try {
      await apiFetch<PurchaseOrder>("/purchase-orders/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplier: supplierId,
          location: currentLocationId,
          status: "draft",
          expected_delivery_date: expectedDeliveryDate || null,
          lines: [
            {
              ingredient: ingredientId,
              quantity_ordered: qty,
              unit_price_snapshot: unitPrice ? unitPrice : null,
            },
          ],
        }),
      });
      await refetch();
      setSupplierId("");
      setExpectedDeliveryDate("");
      setIngredientId("");
      setQty("1.000");
      setUnitPrice("");
    } catch {
      setError("Failed to create purchase order (requires manager/admin). ");
    } finally {
      setCreating(false);
    }
  };

  const startReceive = (po: PurchaseOrder) => {
    setReceiveResult(null);
    setReceivingPo(po);
    setReceivedDate(new Date().toISOString().slice(0, 10));
    setReceiveLines(
      po.lines.map((l) => ({
        line_id: l.id,
        quantity_received: l.quantity_ordered,
        expiry_date: "",
        supplier_lot_code: "",
      })),
    );
  };

  const submitReceive = async () => {
    setError(null);
    if (!receivingPo) return;

    // client-side validation for perishable expiry_date
    for (const rl of receiveLines) {
      const pol = receivingPo.lines.find((x) => x.id === rl.line_id);
      if (!pol) continue;
      const ing = ingredientById[pol.ingredient];
      if (ing?.is_perishable && !rl.expiry_date) {
        setError(`Expiry date required for perishable ingredient: ${ing.name}`);
        return;
      }
    }

    setReceiving(true);
    try {
      const payload = {
        received_date: receivedDate || undefined,
        lines: receiveLines.map((l) => ({
          line_id: l.line_id,
          quantity_received: l.quantity_received,
          expiry_date: l.expiry_date || null,
          supplier_lot_code: l.supplier_lot_code,
        })),
      };
      const res = await apiFetch<PurchaseOrderReceiveResult>(
        `/purchase-orders/${receivingPo.id}/receive/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      setReceiveResult(res);
      await refetch();
    } catch {
      setError("Failed to receive purchase order.");
    } finally {
      setReceiving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Purchase Orders</h1>
        <p className="text-sm text-zinc-600">Create POs and receive deliveries into lots (with expiry).</p>
      </div>

      <div className="rounded-lg border bg-white p-4">
        <h2 className="mb-3 font-semibold">Create purchase order</h2>
        <div className="grid gap-3 sm:grid-cols-5">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm">Supplier</label>
            <select
              className="w-full rounded border px-3 py-2 text-sm"
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value ? Number(e.target.value) : "")}
            >
              <option value="">Select...</option>
              {(suppliers ?? []).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm">Expected delivery</label>
            <input
              className="w-full rounded border px-3 py-2 text-sm"
              type="date"
              value={expectedDeliveryDate}
              onChange={(e) => setExpectedDeliveryDate(e.target.value)}
            />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm">Ingredient</label>
            <select
              className="w-full rounded border px-3 py-2 text-sm"
              value={ingredientId}
              onChange={(e) => setIngredientId(e.target.value ? Number(e.target.value) : "")}
            >
              <option value="">Select...</option>
              {(ingredients ?? []).map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm">Qty ordered</label>
            <input
              className="w-full rounded border px-3 py-2 text-sm"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm">Unit price (optional)</label>
            <input
              className="w-full rounded border px-3 py-2 text-sm"
              value={unitPrice}
              onChange={(e) => setUnitPrice(e.target.value)}
            />
          </div>

          <div className="sm:col-span-5">
            {error ? <div className="mb-2 text-sm text-red-600">{error}</div> : null}
            <button
              className="rounded bg-black px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
              onClick={createPO}
              disabled={creating}
            >
              {creating ? "Creating..." : "Create PO"}
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-white">
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="font-semibold">Purchase orders</h2>
          <button className="rounded border px-3 py-1 text-sm" onClick={() => refetch()}>
            Refresh
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-zinc-600">
                <th className="p-3">ID</th>
                <th className="p-3">Status</th>
                <th className="p-3">Lines</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visiblePOs.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="p-3">{p.id}</td>
                  <td className="p-3">{p.status}</td>
                  <td className="p-3">
                    {p.lines
                      .map((l) => {
                        const ing = ingredientById[l.ingredient];
                        return `${ing?.name ?? l.ingredient} x ${l.quantity_ordered}`;
                      })
                      .join(", ")}
                  </td>
                  <td className="p-3">
                    {p.status !== "received" && p.status !== "canceled" ? (
                      <button
                        className="rounded bg-black px-3 py-1 text-sm text-white"
                        onClick={() => startReceive(p)}
                      >
                        Receive
                      </button>
                    ) : (
                      <span className="text-zinc-500">-</span>
                    )}
                  </td>
                </tr>
              ))}
              {!visiblePOs.length ? (
                <tr>
                  <td className="p-3 text-zinc-600" colSpan={4}>
                    No purchase orders.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {receivingPo ? (
        <div className="rounded-lg border bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Receive PO #{receivingPo.id}</h2>
            <button
              className="rounded border px-3 py-1 text-sm"
              onClick={() => setReceivingPo(null)}
            >
              Close
            </button>
          </div>

          <div className="mb-3">
            <label className="mb-1 block text-sm">Received date</label>
            <input
              className="rounded border px-3 py-2 text-sm"
              type="date"
              value={receivedDate}
              onChange={(e) => setReceivedDate(e.target.value)}
            />
          </div>

          <div className="space-y-3">
            {receiveLines.map((l, idx) => {
              const pol = receivingPo.lines.find((x) => x.id === l.line_id);
              const ing = pol ? ingredientById[pol.ingredient] : undefined;
              const perishable = Boolean(ing?.is_perishable);
              return (
                <div key={l.line_id} className="rounded border p-3">
                  <div className="text-sm font-medium">
                    {ing?.name ?? pol?.ingredient ?? l.line_id}
                  </div>
                  <div className="mt-2 grid gap-2 sm:grid-cols-4">
                    <div>
                      <label className="mb-1 block text-xs text-zinc-600">Qty received</label>
                      <input
                        className="w-full rounded border px-2 py-1 text-sm"
                        value={l.quantity_received}
                        onChange={(e) => {
                          const v = e.target.value;
                          setReceiveLines((prev) => {
                            const next = [...prev];
                            next[idx] = { ...next[idx], quantity_received: v };
                            return next;
                          });
                        }}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-zinc-600">Expiry date{perishable ? " *" : ""}</label>
                      <input
                        className="w-full rounded border px-2 py-1 text-sm"
                        type="date"
                        value={l.expiry_date}
                        onChange={(e) => {
                          const v = e.target.value;
                          setReceiveLines((prev) => {
                            const next = [...prev];
                            next[idx] = { ...next[idx], expiry_date: v };
                            return next;
                          });
                        }}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-xs text-zinc-600">Supplier lot code</label>
                      <input
                        className="w-full rounded border px-2 py-1 text-sm"
                        value={l.supplier_lot_code}
                        onChange={(e) => {
                          const v = e.target.value;
                          setReceiveLines((prev) => {
                            const next = [...prev];
                            next[idx] = { ...next[idx], supplier_lot_code: v };
                            return next;
                          });
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {error ? <div className="mt-3 text-sm text-red-600">{error}</div> : null}

          <div className="mt-3">
            <button
              className="rounded bg-black px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
              onClick={submitReceive}
              disabled={receiving}
            >
              {receiving ? "Receiving..." : "Receive"}
            </button>
          </div>

          {receiveResult ? (
            <pre className="mt-3 overflow-auto rounded bg-zinc-50 p-3 text-xs">
              {JSON.stringify(receiveResult, null, 2)}
            </pre>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
