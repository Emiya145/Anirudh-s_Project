"use client";

import Link from "next/link";
import React from "react";

export default function StoreCancelPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Checkout canceled</h1>
      <p className="text-sm text-zinc-700">No payment was processed. You can return to your cart and try again.</p>
      <div className="flex gap-2">
        <Link href="/store/cart" className="rounded border px-4 py-2 text-sm font-medium">
          Back to cart
        </Link>
        <Link href="/store" className="rounded bg-black px-4 py-2 text-sm font-medium text-white">
          Back to catalog
        </Link>
      </div>
    </div>
  );
}
