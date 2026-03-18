"use client";

import React, { useMemo, useState } from "react";

import { useAuth } from "@/lib/auth";
import {
  useDailyTargets,
  useFinishedGoodLots,
  useIngredientLots,
  useIngredients,
  useProducts,
} from "@/lib/queries";

type TabKey = "ingredients" | "ingredient_lots" | "finished_goods" | "daily_targets";

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: "ingredients", label: "Ingredients" },
  { key: "ingredient_lots", label: "Ingredient Lots" },
  { key: "finished_goods", label: "Finished Goods" },
  { key: "daily_targets", label: "Daily Targets" },
];

export default function InventoryPage() {
  const { currentLocationId } = useAuth();
  const [tab, setTab] = useState<TabKey>("ingredients");

  const { data: ingredients } = useIngredients();
  const { data: ingredientLots } = useIngredientLots();
  const { data: products } = useProducts();
  const { data: fgLots } = useFinishedGoodLots();
  const { data: targets } = useDailyTargets();

  const ingredientNameById = useMemo(() => {
    const map: Record<number, string> = {};
    for (const i of ingredients ?? []) map[i.id] = i.name;
    return map;
  }, [ingredients]);

  const productNameById = useMemo(() => {
    const map: Record<number, string> = {};
    for (const p of products ?? []) map[p.id] = p.name;
    return map;
  }, [products]);

  const filteredIngredientLots = useMemo(() => {
    return (ingredientLots ?? []).filter((l) => (!currentLocationId ? true : l.location === currentLocationId));
  }, [ingredientLots, currentLocationId]);

  const filteredFgLots = useMemo(() => {
    return (fgLots ?? []).filter((l) => (!currentLocationId ? true : l.location === currentLocationId));
  }, [fgLots, currentLocationId]);

  const filteredTargets = useMemo(() => {
    return (targets ?? []).filter((t) => (!currentLocationId ? true : t.location === currentLocationId));
  }, [targets, currentLocationId]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Inventory</h1>
        <p className="text-sm text-zinc-600">Ingredients, lots, finished goods, and targets.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={
              "rounded-full border px-3 py-1 text-sm " +
              (tab === t.key ? "bg-black text-white" : "bg-white hover:bg-zinc-50")
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "ingredients" ? (
        <div className="rounded-lg border bg-white">
          <div className="border-b p-4">
            <h2 className="font-semibold">Ingredients</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-zinc-600">
                  <th className="p-3">Name</th>
                  <th className="p-3">Unit</th>
                  <th className="p-3">Perishable</th>
                  <th className="p-3">Default low threshold</th>
                </tr>
              </thead>
              <tbody>
                {(ingredients ?? []).map((i) => (
                  <tr key={i.id} className="border-t">
                    <td className="p-3 font-medium">{i.name}</td>
                    <td className="p-3">{i.base_unit}</td>
                    <td className="p-3">{i.is_perishable ? "Yes" : "No"}</td>
                    <td className="p-3">{i.default_low_stock_threshold}</td>
                  </tr>
                ))}
                {!ingredients?.length ? (
                  <tr>
                    <td className="p-3 text-zinc-600" colSpan={4}>
                      No ingredients.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {tab === "ingredient_lots" ? (
        <div className="rounded-lg border bg-white">
          <div className="border-b p-4">
            <h2 className="font-semibold">Ingredient Lots</h2>
            <p className="text-sm text-zinc-600">Scoped to selected location (if set).</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-zinc-600">
                  <th className="p-3">Ingredient</th>
                  <th className="p-3">Received</th>
                  <th className="p-3">Expiry</th>
                  <th className="p-3">Remaining</th>
                </tr>
              </thead>
              <tbody>
                {filteredIngredientLots.map((l) => (
                  <tr key={l.id} className="border-t">
                    <td className="p-3">{ingredientNameById[l.ingredient] ?? l.ingredient}</td>
                    <td className="p-3">{l.received_date}</td>
                    <td className="p-3">{l.expiry_date ?? "-"}</td>
                    <td className="p-3 font-medium">{l.quantity_remaining}</td>
                  </tr>
                ))}
                {!filteredIngredientLots.length ? (
                  <tr>
                    <td className="p-3 text-zinc-600" colSpan={4}>
                      No lots.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {tab === "finished_goods" ? (
        <div className="rounded-lg border bg-white">
          <div className="border-b p-4">
            <h2 className="font-semibold">Finished Good Lots</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-zinc-600">
                  <th className="p-3">Product</th>
                  <th className="p-3">Produced at</th>
                  <th className="p-3">Expiry</th>
                  <th className="p-3">Remaining</th>
                </tr>
              </thead>
              <tbody>
                {filteredFgLots.map((l) => (
                  <tr key={l.id} className="border-t">
                    <td className="p-3">{productNameById[l.product] ?? l.product}</td>
                    <td className="p-3">{new Date(l.produced_at).toLocaleString()}</td>
                    <td className="p-3">{l.expiry_date ?? "-"}</td>
                    <td className="p-3 font-medium">{l.quantity_remaining}</td>
                  </tr>
                ))}
                {!filteredFgLots.length ? (
                  <tr>
                    <td className="p-3 text-zinc-600" colSpan={4}>
                      No finished goods.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {tab === "daily_targets" ? (
        <div className="rounded-lg border bg-white">
          <div className="border-b p-4">
            <h2 className="font-semibold">Daily Targets</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-zinc-600">
                  <th className="p-3">Date</th>
                  <th className="p-3">Product</th>
                  <th className="p-3">Target</th>
                </tr>
              </thead>
              <tbody>
                {filteredTargets.map((t) => (
                  <tr key={t.id} className="border-t">
                    <td className="p-3">{t.business_date}</td>
                    <td className="p-3">{productNameById[t.product] ?? t.product}</td>
                    <td className="p-3 font-medium">{t.target_quantity}</td>
                  </tr>
                ))}
                {!filteredTargets.length ? (
                  <tr>
                    <td className="p-3 text-zinc-600" colSpan={3}>
                      No targets.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
