export type AuthTokens = {
  access: string;
  refresh: string;
};

const TOKENS_KEY = "bakery.tokens";
const LOCATION_KEY = "bakery.currentLocationId";

export function loadTokens(): AuthTokens | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(TOKENS_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthTokens;
  } catch {
    return null;
  }
}

export function saveTokens(tokens: AuthTokens | null): void {
  if (typeof window === "undefined") return;
  if (!tokens) {
    window.localStorage.removeItem(TOKENS_KEY);
    return;
  }
  window.localStorage.setItem(TOKENS_KEY, JSON.stringify(tokens));
}

export function loadCurrentLocationId(): number | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(LOCATION_KEY);
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

export function saveCurrentLocationId(id: number | null): void {
  if (typeof window === "undefined") return;
  if (id === null) {
    window.localStorage.removeItem(LOCATION_KEY);
    return;
  }
  window.localStorage.setItem(LOCATION_KEY, String(id));
}
