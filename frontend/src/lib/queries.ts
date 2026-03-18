import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api";
import type {
  CustomerOrder,
  FinishedGoodLot,
  Ingredient,
  IngredientLot,
  Location,
  Notification,
  PurchaseOrder,
  Product,
  ProductDailyTarget,
  Supplier,
  WasteRecord,
} from "@/lib/types";

export function useLocations() {
  return useQuery({
    queryKey: ["locations"],
    queryFn: () => apiFetch<Location[]>("/locations/"),
  });
}

export function useIngredients() {
  return useQuery({
    queryKey: ["ingredients"],
    queryFn: () => apiFetch<Ingredient[]>("/ingredients/"),
  });
}

export function useIngredientLots() {
  return useQuery({
    queryKey: ["ingredient-lots"],
    queryFn: () => apiFetch<IngredientLot[]>("/ingredient-lots/"),
  });
}

export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: () => apiFetch<Product[]>("/products/"),
  });
}

export function useFinishedGoodLots() {
  return useQuery({
    queryKey: ["finished-good-lots"],
    queryFn: () => apiFetch<FinishedGoodLot[]>("/finished-good-lots/"),
  });
}

export function useDailyTargets() {
  return useQuery({
    queryKey: ["product-daily-targets"],
    queryFn: () => apiFetch<ProductDailyTarget[]>("/product-daily-targets/"),
  });
}

export function useNotifications() {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: () => apiFetch<Notification[]>("/notifications/"),
  });
}

export function useCustomerOrders() {
  return useQuery({
    queryKey: ["customer-orders"],
    queryFn: () => apiFetch<CustomerOrder[]>("/customer-orders/"),
  });
}

export function useSuppliers() {
  return useQuery({
    queryKey: ["suppliers"],
    queryFn: () => apiFetch<Supplier[]>("/suppliers/"),
  });
}

export function useWasteRecords() {
  return useQuery({
    queryKey: ["waste-records"],
    queryFn: () => apiFetch<WasteRecord[]>("/waste-records/"),
  });
}

export function usePurchaseOrders() {
  return useQuery({
    queryKey: ["purchase-orders"],
    queryFn: () => apiFetch<PurchaseOrder[]>("/purchase-orders/"),
  });
}
