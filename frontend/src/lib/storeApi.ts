import { apiFetch } from "@/lib/api";

export async function storeApiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  return apiFetch<T>(path, { ...init, auth: false });
}
