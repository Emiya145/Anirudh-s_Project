"use client";

import Link from "next/link";
import React, { useEffect } from "react";

import { useStoreCart } from "@/lib/useStoreCart";

export default function StoreSuccessPage() {
  const cart = useStoreCart();

  useEffect(() => {
    cart.clear();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Payment successful</h1>
      <p className="text-sm text-zinc-700">Thanks for your order. You’ll receive a confirmation email from Stripe.</p>
      <Link href="/store" className="inline-block rounded bg-black px-4 py-2 text-sm font-medium text-white">
        Back to catalog
      </Link>
    </div>
  );
}
