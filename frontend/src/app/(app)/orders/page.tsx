"use client";

import React, { useMemo, useState } from "react";

import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useCustomerOrders, useProducts } from "@/lib/queries";
import type { CustomerOrder } from "@/lib/types";

export default function OrdersPage() {
  const { currentLocationId } = useAuth();
  const { data: products } = useProducts();
  const { data: orders, refetch } = useCustomerOrders();

  const [productId, setProductId] = useState<number | "">("");
  const [qty, setQty] = useState("1");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const productNameById = useMemo(() => {
    const map: Record<number, string> = {};
    for (const p of products ?? []) map[p.id] = p.name;
    return map;
  }, [products]);

  const visibleOrders = useMemo(() => {
    return (orders ?? []).filter((o) => (!currentLocationId ? true : o.location === currentLocationId));
  }, [orders, currentLocationId]);

  const createOrder = async () => {
    setError(null);
    if (!currentLocationId) {
      setError("Select a location first.");
      return;
    }
    if (!productId) {
      setError("Select a product.");
      return;
    }

    setCreating(true);
    try {
      await apiFetch<CustomerOrder>("/customer-orders/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: currentLocationId,
          status: "confirmed",
          lines: [{ product: productId, quantity: qty }],
        }),
      });
      await refetch();
      setProductId("");
      setQty("1");
    } catch {
      setError("Failed to create order.");
    } finally {
      setCreating(false);
    }
  };

  const fulfill = async (orderId: number) => {
    setError(null);
    try {
      await apiFetch(`/customer-orders/${orderId}/fulfill/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      await refetch();
    } catch {
      setError("Failed to fulfill order (insufficient finished goods or permission issue).");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Orders</h1>
        <p className="text-sm text-zinc-600">Create and fulfill customer orders (sale deducts finished goods).</p>
      </div>

      <div className="rounded-lg border bg-white p-4">
        <h2 className="mb-3 font-semibold">Create order</h2>
        <div className="grid gap-3 sm:grid-cols-3">
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
              onClick={createOrder}
              disabled={creating}
            >
              {creating ? "Creating..." : "Create"}
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-white">
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="font-semibold">Orders</h2>
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
              {visibleOrders.map((o) => (
                <tr key={o.id} className="border-t">
                  <td className="p-3">{o.id}</td>
                  <td className="p-3">{o.status}</td>
                  <td className="p-3">
                    {o.lines
                      .map((l) => `${productNameById[l.product] ?? l.product} x ${l.quantity}`)
                      .join(", ")}
                  </td>
                  <td className="p-3">
                    {o.status === "confirmed" ? (
                      <button
                        className="rounded bg-black px-3 py-1 text-sm text-white"
                        onClick={() => fulfill(o.id)}
                      >
                        Fulfill
                      </button>
                    ) : (
                      <span className="text-zinc-500">-</span>
                    )}
                  </td>
                </tr>
              ))}
              {!visibleOrders.length ? (
                <tr>
                  <td className="p-3 text-zinc-600" colSpan={4}>
                    No orders.
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
