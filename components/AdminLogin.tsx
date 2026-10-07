"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { APP_NAME } from "@/lib/constants";

export function AdminLogin() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (response.ok) {
        router.refresh();
        return;
      }
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      setError(data.error ?? "Connexion impossible");
    } catch {
      setError("Connexion impossible");
    }
    setLoading(false);
  };

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-5 p-6">
      <div className="text-center">
        <div className="text-5xl">🔐</div>
        <h1 className="mt-2 text-2xl font-extrabold">Administration</h1>
        <p className="text-violet-200/70">{APP_NAME}</p>
      </div>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <label htmlFor="password" className="text-sm text-violet-200">
          Mot de passe
        </label>
        <input
          id="password"
          type="password"
          autoFocus
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 outline-none focus:border-amber-300"
        />
        {error && (
          <p className="rounded-xl bg-red-500/20 px-3 py-2 text-sm text-red-200">{error}</p>
        )}
        <button
          disabled={loading || !password}
          className="rounded-2xl bg-amber-400 px-4 py-3 font-bold text-violet-950 active:scale-95 disabled:opacity-50"
        >
          Connexion
        </button>
      </form>
    </main>
  );
}
