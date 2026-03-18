export type StoreCartItem = {
  product_id: number;
  quantity: number;
};

const STORE_LOCATION_KEY = "bakery.store.locationId";
const STORE_CART_KEY = "bakery.store.cart";
const STORE_CART_EVENT = "bakery.store.cart.changed";
const STORE_LOCATION_EVENT = "bakery.store.location.changed";

export function loadStoreLocationId(): number | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORE_LOCATION_KEY);
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

export function saveStoreLocationId(id: number | null): void {
  if (typeof window === "undefined") return;
  if (id === null) {
    window.localStorage.removeItem(STORE_LOCATION_KEY);
  } else {
    window.localStorage.setItem(STORE_LOCATION_KEY, String(id));
  }
  window.dispatchEvent(new Event(STORE_LOCATION_EVENT));
}

export function loadStoreCart(): StoreCartItem[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(STORE_CART_KEY);
  if (!raw) return [];
  try {
    const items = JSON.parse(raw) as StoreCartItem[];
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
}

export function saveStoreCart(items: StoreCartItem[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORE_CART_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(STORE_CART_EVENT));
}

export function onStoreCartChanged(cb: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  const handler = () => cb();
  window.addEventListener(STORE_CART_EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(STORE_CART_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

export function onStoreLocationChanged(cb: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  const handler = () => cb();
  window.addEventListener(STORE_LOCATION_EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(STORE_LOCATION_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}
