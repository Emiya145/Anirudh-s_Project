"use client";

import React, { useMemo, useState } from "react";

import { useAuth } from "@/lib/auth";
import { useNotifications } from "@/lib/queries";

const tabs = [
  { key: "all", label: "All" },
  { key: "low_stock", label: "Low stock" },
  { key: "expiring_soon", label: "Expiring soon" },
  { key: "expired", label: "Expired" },
  { key: "target_shortfall", label: "Target shortfall" },
] as const;

export default function AlertsPage() {
  const { currentLocationId } = useAuth();
  const { data, isLoading, error } = useNotifications();
  const [tab, setTab] = useState<(typeof tabs)[number]["key"]>("all");

  const rows = useMemo(() => {
    const all = (data ?? []).filter((n) => n.is_active);
    return all
      .filter((n) => (!currentLocationId ? true : n.location === currentLocationId))
      .filter((n) => (tab === "all" ? true : n.kind === tab));
  }, [data, tab, currentLocationId]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Alerts</h1>
        <p className="text-sm text-zinc-600">Active notifications (auto-resolve when no longer true)</p>
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

      <div className="rounded-lg border bg-white">
        <div className="border-b p-4">
          <h2 className="font-semibold">Active alerts</h2>
        </div>

        {isLoading ? (
          <div className="p-4 text-sm text-zinc-600">Loading...</div>
        ) : error ? (
          <div className="p-4 text-sm text-red-600">Failed to load alerts</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-zinc-600">
                  <th className="p-3">Kind</th>
                  <th className="p-3">Last seen</th>
                  <th className="p-3">Location</th>
                  <th className="p-3">Details</th>
                </tr>
              </thead>
              <tbody>
                {rows.length ? (
                  rows.map((n) => (
                    <tr key={n.id} className="border-t">
                      <td className="p-3 font-medium">{n.kind}</td>
                      <td className="p-3">{new Date(n.last_seen_at).toLocaleString()}</td>
                      <td className="p-3">{n.location}</td>
                      <td className="p-3">
                        <pre className="max-w-[520px] overflow-auto rounded bg-zinc-50 p-2 text-xs">
                          {JSON.stringify(n.payload, null, 2)}
                        </pre>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="p-3 text-zinc-600" colSpan={4}>
                      No active alerts.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
