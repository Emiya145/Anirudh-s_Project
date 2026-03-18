"use client";

import React, { useMemo } from "react";

import { useAuth } from "@/lib/auth";
import { useNotifications, useProducts, useDailyTargets, useFinishedGoodLots } from "@/lib/queries";

export default function DashboardPage() {
  const { currentLocationId } = useAuth();
  const { data: notifications } = useNotifications();
  const { data: products } = useProducts();
  const { data: targets } = useDailyTargets();
  const { data: fgLots } = useFinishedGoodLots();

  const active = useMemo(() => (notifications ?? []).filter((n) => n.is_active), [notifications]);

  const counts = useMemo(() => {
    const byKind: Record<string, number> = {
      low_stock: 0,
      expiring_soon: 0,
      expired: 0,
      target_shortfall: 0,
    };
    for (const n of active) {
      if (currentLocationId && n.location !== currentLocationId) continue;
      byKind[n.kind] = (byKind[n.kind] ?? 0) + 1;
    }
    return byKind;
  }, [active, currentLocationId]);

  const today = new Date().toISOString().slice(0, 10);

  const targetRows = useMemo(() => {
    const locTargets = (targets ?? []).filter(
      (t) => t.business_date === today && (!currentLocationId || t.location === currentLocationId),
    );

    const onHandByProduct: Record<number, number> = {};
    for (const lot of fgLots ?? []) {
      if (currentLocationId && lot.location !== currentLocationId) continue;
      const p = lot.product;
      const qty = Number(lot.quantity_remaining);
      onHandByProduct[p] = (onHandByProduct[p] ?? 0) + (Number.isFinite(qty) ? qty : 0);
    }

    return locTargets
      .map((t) => {
        const product = (products ?? []).find((p) => p.id === t.product);
        const target = Number(t.target_quantity);
        const onHand = onHandByProduct[t.product] ?? 0;
        return {
          id: t.id,
          productName: product?.name ?? `Product ${t.product}`,
          target,
          onHand,
          shortfall: Math.max(0, target - onHand),
        };
      })
      .sort((a, b) => b.shortfall - a.shortfall);
  }, [targets, fgLots, products, currentLocationId, today]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-zinc-600">Today at a glance</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-white p-4">
          <div className="text-sm text-zinc-600">Low stock</div>
          <div className="mt-1 text-2xl font-semibold">{counts.low_stock}</div>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <div className="text-sm text-zinc-600">Expiring soon</div>
          <div className="mt-1 text-2xl font-semibold">{counts.expiring_soon}</div>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <div className="text-sm text-zinc-600">Expired</div>
          <div className="mt-1 text-2xl font-semibold">{counts.expired}</div>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <div className="text-sm text-zinc-600">Target shortfalls</div>
          <div className="mt-1 text-2xl font-semibold">{counts.target_shortfall}</div>
        </div>
      </div>

      <div className="rounded-lg border bg-white">
        <div className="border-b p-4">
          <h2 className="font-semibold">Targets vs On-hand (Today)</h2>
          <p className="text-sm text-zinc-600">Shortfalls help decide what to bake next.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-zinc-600">
                <th className="p-3">Product</th>
                <th className="p-3">Target</th>
                <th className="p-3">On-hand</th>
                <th className="p-3">Shortfall</th>
              </tr>
            </thead>
            <tbody>
              {targetRows.length ? (
                targetRows.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="p-3">{r.productName}</td>
                    <td className="p-3">{r.target}</td>
                    <td className="p-3">{r.onHand}</td>
                    <td className="p-3 font-medium">{r.shortfall}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="p-3 text-zinc-600" colSpan={4}>
                    No targets found for today.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
