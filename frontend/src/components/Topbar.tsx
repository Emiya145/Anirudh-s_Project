"use client";

import React from "react";

import { useAuth } from "@/lib/auth";
import { useLocations } from "@/lib/queries";

export function Topbar() {
  const { logout, currentLocationId, setCurrentLocationId } = useAuth();
  const { data: locations } = useLocations();

  return (
    <header className="flex items-center justify-between gap-3 border-b bg-white px-4 py-2">
      <div className="flex items-center gap-2">
        <span className="text-sm text-zinc-600">Location</span>
        <select
          className="rounded border px-2 py-1 text-sm"
          value={currentLocationId ?? ""}
          onChange={(e) => {
            const v = e.target.value;
            setCurrentLocationId(v ? Number(v) : null);
          }}
        >
          <option value="">Select...</option>
          {(locations ?? []).map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
      </div>
      <button
        className="rounded border px-3 py-1 text-sm hover:bg-zinc-50"
        onClick={logout}
      >
        Logout
      </button>
    </header>
  );
}
