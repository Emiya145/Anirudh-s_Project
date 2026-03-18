"use client";

import Link from "next/link";
import React, { useMemo, useState } from "react";

import { loadStoreLocationId } from "@/lib/storeStorage";
import { createCheckoutSession, useStoreLocations, useStoreProducts } from "@/lib/storeQueries";
import { useStoreCart } from "@/lib/useStoreCart";

function toNumber(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export default function StoreCheckoutPage() {
  const cart = useStoreCart();
  const locationId = loadStoreLocationId();

  const { data: locations } = useStoreLocations();
  const { data: products } = useStoreProducts();

  const location = useMemo(
    () => (locations ?? []).find((l) => l.id === locationId) ?? null,
    [locations, locationId],
  );

  const productById = useMemo(() => {
    const map = new Map<number, (typeof products)[number]>();
    for (const p of products ?? []) map.set(p.id, p);
    return map;
  }, [products]);

  const lineItems = useMemo(() => {
    return cart.items
      .map((i) => {
        const p = productById.get(i.product_id);
        if (!p) return null;
        const unit = toNumber(p.base_price);
        return { product: p, quantity: i.quantity, unit, total: unit * i.quantity };
      })
      .filter(Boolean);
  }, [cart.items, productById]);

  const subtotal = lineItems.reduce((acc, r) => acc + r.total, 0);
  const deliveryFee = location ? toNumber(location.delivery_fee) : 0;
  const deliveryMin = location ? toNumber(location.delivery_min_order) : 0;

  const [fulfillment, setFulfillment] = useState<"pickup" | "delivery">("pickup");
  const [pickupAt, setPickupAt] = useState<string>("");
  const [deliveryStart, setDeliveryStart] = useState<string>("");
  const [deliveryEnd, setDeliveryEnd] = useState<string>("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [addr1, setAddr1] = useState("");
  const [addr2, setAddr2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postal, setPostal] = useState("");
  const [country, setCountry] = useState("US");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const total = subtotal + (fulfillment === "delivery" ? deliveryFee : 0);

  const submit = async () => {
    setError(null);

    if (!locationId) return setError("Select a location first.");
    if (!location) return setError("Invalid location.");
    if (!lineItems.length) return setError("Cart is empty.");
    if (!name || !email) return setError("Name and email are required.");

    if (fulfillment === "pickup") {
      if (!location.pickup_enabled) return setError("Pickup not available for this location.");
    }

    if (fulfillment === "delivery") {
      if (!location.delivery_enabled) return setError("Delivery not available for this location.");
      if (deliveryMin && subtotal < deliveryMin) {
        return setError(`Delivery minimum is $${deliveryMin.toFixed(2)}.`);
      }
      if (!addr1 || !city || !state || !postal || !country) {
        return setError("Delivery address is incomplete.");
      }
    }

    setLoading(true);
    try {
      const payload = {
        location_id: locationId,
        fulfillment_method: fulfillment,
        pickup_at: pickupAt ? new Date(pickupAt).toISOString() : null,
        delivery_window_start: deliveryStart ? new Date(deliveryStart).toISOString() : null,
        delivery_window_end: deliveryEnd ? new Date(deliveryEnd).toISOString() : null,
        delivery_address_line1: addr1,
        delivery_address_line2: addr2,
        delivery_city: city,
        delivery_state: state,
        delivery_postal_code: postal,
        delivery_country: country,
        customer: { name, email, phone },
        lines: cart.items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
      };

      const res = await createCheckoutSession(payload);
      window.location.href = res.url;
    } catch {
      setError("Checkout failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Checkout</h1>
          <p className="text-sm text-zinc-600">Pay securely with Stripe.</p>
        </div>
        <Link href="/store/cart" className="rounded border px-3 py-1 text-sm">
          Back to cart
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-lg border bg-white p-4">
            <h2 className="mb-3 font-semibold">Fulfillment</h2>
            <div className="flex gap-2">
              <button
                className={`rounded border px-3 py-2 text-sm ${
                  fulfillment === "pickup" ? "bg-black text-white" : "bg-white"
                }`}
                onClick={() => setFulfillment("pickup")}
              >
                Pickup
              </button>
              <button
                className={`rounded border px-3 py-2 text-sm ${
                  fulfillment === "delivery" ? "bg-black text-white" : "bg-white"
                }`}
                onClick={() => setFulfillment("delivery")}
              >
                Delivery
              </button>
            </div>

            {fulfillment === "pickup" ? (
              <div className="mt-3">
                <label className="mb-1 block text-sm">Requested pickup time (optional)</label>
                <input
                  className="rounded border px-3 py-2 text-sm"
                  type="datetime-local"
                  value={pickupAt}
                  onChange={(e) => setPickupAt(e.target.value)}
                />
              </div>
            ) : (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm">Delivery window start (optional)</label>
                  <input
                    className="w-full rounded border px-3 py-2 text-sm"
                    type="datetime-local"
                    value={deliveryStart}
                    onChange={(e) => setDeliveryStart(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm">Delivery window end (optional)</label>
                  <input
                    className="w-full rounded border px-3 py-2 text-sm"
                    type="datetime-local"
                    value={deliveryEnd}
                    onChange={(e) => setDeliveryEnd(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="rounded-lg border bg-white p-4">
            <h2 className="mb-3 font-semibold">Contact</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm">Name</label>
                <input className="w-full rounded border px-3 py-2 text-sm" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-sm">Email</label>
                <input className="w-full rounded border px-3 py-2 text-sm" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm">Phone (optional)</label>
                <input className="w-full rounded border px-3 py-2 text-sm" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
            </div>
          </div>

          {fulfillment === "delivery" ? (
            <div className="rounded-lg border bg-white p-4">
              <h2 className="mb-3 font-semibold">Delivery address</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm">Address line 1</label>
                  <input className="w-full rounded border px-3 py-2 text-sm" value={addr1} onChange={(e) => setAddr1(e.target.value)} />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm">Address line 2</label>
                  <input className="w-full rounded border px-3 py-2 text-sm" value={addr2} onChange={(e) => setAddr2(e.target.value)} />
                </div>
                <div>
                  <label className="mb-1 block text-sm">City</label>
                  <input className="w-full rounded border px-3 py-2 text-sm" value={city} onChange={(e) => setCity(e.target.value)} />
                </div>
                <div>
                  <label className="mb-1 block text-sm">State</label>
                  <input className="w-full rounded border px-3 py-2 text-sm" value={state} onChange={(e) => setState(e.target.value)} />
                </div>
                <div>
                  <label className="mb-1 block text-sm">Postal code</label>
                  <input className="w-full rounded border px-3 py-2 text-sm" value={postal} onChange={(e) => setPostal(e.target.value)} />
                </div>
                <div>
                  <label className="mb-1 block text-sm">Country</label>
                  <input className="w-full rounded border px-3 py-2 text-sm" value={country} onChange={(e) => setCountry(e.target.value)} />
                </div>
              </div>
            </div>
          ) : null}

          {error ? <div className="rounded border bg-white p-3 text-sm text-red-600">{error}</div> : null}

          <button
            className="w-full rounded bg-black px-4 py-3 text-sm font-medium text-white disabled:opacity-60"
            onClick={submit}
            disabled={loading}
          >
            {loading ? "Redirecting to Stripe..." : "Pay with Stripe"}
          </button>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border bg-white p-4">
            <h2 className="mb-3 font-semibold">Order summary</h2>
            <div className="space-y-2 text-sm">
              {lineItems.map((r) => (
                <div key={r.product.id} className="flex justify-between">
                  <div className="text-zinc-700">
                    {r.product.name} x {r.quantity}
                  </div>
                  <div className="font-medium">${r.total.toFixed(2)}</div>
                </div>
              ))}
              <div className="border-t pt-2">
                <div className="flex justify-between">
                  <div className="text-zinc-600">Subtotal</div>
                  <div className="font-medium">${subtotal.toFixed(2)}</div>
                </div>
                {fulfillment === "delivery" ? (
                  <div className="flex justify-between">
                    <div className="text-zinc-600">Delivery</div>
                    <div className="font-medium">${deliveryFee.toFixed(2)}</div>
                  </div>
                ) : null}
                <div className="mt-2 flex justify-between text-base">
                  <div className="font-semibold">Total</div>
                  <div className="font-semibold">${total.toFixed(2)}</div>
                </div>
              </div>

              {fulfillment === "delivery" && deliveryMin ? (
                <div className="mt-2 text-xs text-zinc-600">
                  Delivery minimum: ${deliveryMin.toFixed(2)}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
