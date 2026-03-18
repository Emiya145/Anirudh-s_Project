"use client";

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

import { apiFetch } from "@/lib/api";
import {
  AuthTokens,
  loadCurrentLocationId,
  loadTokens,
  saveCurrentLocationId,
  saveTokens,
} from "@/lib/storage";

type AuthState = {
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  currentLocationId: number | null;
  setCurrentLocationId: (id: number | null) => void;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [tokens, setTokens] = useState<AuthTokens | null>(() => loadTokens());
  const [currentLocationId, _setCurrentLocationId] = useState<number | null>(() =>
    loadCurrentLocationId(),
  );

  const setCurrentLocationId = useCallback((id: number | null) => {
    _setCurrentLocationId(id);
    saveCurrentLocationId(id);
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const data = await apiFetch<{ access: string; refresh: string }>("/auth/token/", {
      method: "POST",
      auth: false,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const next = { access: data.access, refresh: data.refresh };
    saveTokens(next);
    setTokens(next);
  }, []);

  const logout = useCallback(() => {
    saveTokens(null);
    setTokens(null);
    setCurrentLocationId(null);
  }, [setCurrentLocationId]);

  const value = useMemo<AuthState>(
    () => ({
      tokens,
      isAuthenticated: Boolean(tokens?.access),
      currentLocationId,
      setCurrentLocationId,
      login,
      logout,
    }),
    [tokens, currentLocationId, setCurrentLocationId, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
