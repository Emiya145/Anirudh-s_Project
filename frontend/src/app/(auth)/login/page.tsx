"use client";

import { useRouter } from "next/navigation";
import React, { useState } from "react";

import { useAuth } from "@/lib/auth";

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (isAuthenticated) router.replace("/dashboard");
  }, [isAuthenticated, router]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(username, password);
      router.replace("/dashboard");
    } catch {
      setError("Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-6">
      <form onSubmit={onSubmit} className="w-full max-w-sm rounded-lg border bg-white p-6">
        <h1 className="mb-6 text-xl font-semibold">Sign in</h1>

        <label className="mb-2 block text-sm">Username</label>
        <input
          className="mb-4 w-full rounded border px-3 py-2 text-sm"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
        />

        <label className="mb-2 block text-sm">Password</label>
        <input
          className="mb-4 w-full rounded border px-3 py-2 text-sm"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />

        {error ? <div className="mb-4 text-sm text-red-600">{error}</div> : null}

        <button
          className="w-full rounded bg-black px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
          disabled={loading}
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}
