"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

import {
  LayoutDashboard,
  Bell,
  Package,
  Factory,
  ShoppingCart,
  Trash2,
  Truck,
} from "lucide-react";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/inventory", label: "Inventory", icon: Package },
  { href: "/production", label: "Production", icon: Factory },
  { href: "/orders", label: "Orders", icon: ShoppingCart },
  { href: "/purchase-orders", label: "Purchase Orders", icon: Truck },
  { href: "/waste", label: "Waste", icon: Trash2 },
  { href: "/alerts", label: "Alerts", icon: Bell },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r bg-white">
      <div className="px-4 py-4 text-lg font-semibold">Bakery Inventory</div>
      <nav className="flex flex-col gap-1 px-2">
        {nav.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={
                "flex items-center gap-2 rounded px-3 py-2 text-sm " +
                (active ? "bg-zinc-100 font-medium" : "hover:bg-zinc-50")
              }
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
