import { API_BASE_URL } from "@/lib/config";
import { AuthTokens, loadTokens, saveTokens } from "@/lib/storage";

export type ApiError = {
  status: number;
  body: unknown;
};

async function refreshAccessToken(tokens: AuthTokens): Promise<AuthTokens> {
  const res = await fetch(`${API_BASE_URL}/auth/token/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh: tokens.refresh }),
  });

  if (!res.ok) {
    const body = await safeJson(res);
    throw { status: res.status, body } satisfies ApiError;
  }

  const data = (await res.json()) as { access: string };
  const next = { ...tokens, access: data.access };
  saveTokens(next);
  return next;
}

async function safeJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit & { auth?: boolean },
): Promise<T> {
  const auth = init?.auth ?? true;
  const tokens = auth ? loadTokens() : null;

  const doFetch = async (access?: string) => {
    const headers = new Headers(init?.headers ?? {});
    if (!headers.has("Content-Type") && init?.body) {
      headers.set("Content-Type", "application/json");
    }
    if (auth && access) {
      headers.set("Authorization", `Bearer ${access}`);
    }

    return fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers,
    });
  };

  let res = await doFetch(tokens?.access);

  if (auth && res.status === 401 && tokens?.refresh) {
    try {
      const nextTokens = await refreshAccessToken(tokens);
      res = await doFetch(nextTokens.access);
    } catch {
      saveTokens(null);
    }
  }

  if (!res.ok) {
    const body = await safeJson(res);
    throw { status: res.status, body } satisfies ApiError;
  }

  return (await res.json()) as T;
}
