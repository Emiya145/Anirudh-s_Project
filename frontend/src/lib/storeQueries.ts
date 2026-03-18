import { useQuery } from "@tanstack/react-query";

import { storeApiFetch } from "@/lib/storeApi";
import type {
  StoreAvailabilityItem,
  StoreCheckoutSessionResponse,
  StoreLocation,
  StoreProduct,
} from "@/lib/types";

export function useStoreLocations() {
  return useQuery({
    queryKey: ["store", "locations"],
    queryFn: () => storeApiFetch<StoreLocation[]>("/store/locations/"),
  });
}

export function useStoreProducts() {
  return useQuery({
    queryKey: ["store", "products"],
    queryFn: () => storeApiFetch<StoreProduct[]>("/store/products/"),
  });
}

export function useStoreProduct(id: number) {
  return useQuery({
    queryKey: ["store", "products", id],
    queryFn: () => storeApiFetch<StoreProduct>(`/store/products/${id}/`),
    enabled: Number.isFinite(id),
  });
}

export function useStoreAvailability(locationId: number | null) {
  return useQuery({
    queryKey: ["store", "availability", locationId],
    queryFn: () => storeApiFetch<StoreAvailabilityItem[]>(`/store/availability/?location_id=${locationId}`),
    enabled: Boolean(locationId),
  });
}

export async function createCheckoutSession(payload: unknown) {
  return storeApiFetch<StoreCheckoutSessionResponse>("/store/checkout/session/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}
