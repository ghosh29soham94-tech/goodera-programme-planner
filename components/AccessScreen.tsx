"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AccessScreen() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      if (res.ok) {
        router.refresh();
        return;
      }
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong. Please try again.");
    } catch {
      setError("We couldn't reach the server. Check your connection and try again.");
    }
    setBusy(false);
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <p className="text-sm font-medium tracking-wide text-accent">Goodera</p>
        <h1 className="mt-1 text-2xl font-semibold">Programme Planner</h1>
        <p className="mt-2 text-sm text-muted">
          An interview prototype. Enter the access code you were given to continue.
        </p>

        <form onSubmit={submit} className="mt-6 rounded-xl border border-line bg-card p-5 shadow-sm">
          <label htmlFor="code" className="block text-sm font-medium">
            Access code
          </label>
          <input
            id="code"
            type="password"
            autoComplete="off"
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="mt-2 w-full rounded-lg border border-line bg-paper px-3 py-2 outline-none focus:border-accent"
            aria-describedby={error ? "code-error" : undefined}
          />
          {error && (
            <p id="code-error" role="alert" className="mt-3 rounded-lg bg-accent-soft px-3 py-2 text-sm text-accent-dark">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={busy || !code.trim()}
            className="mt-4 w-full rounded-lg bg-accent px-4 py-2 font-medium text-white transition hover:bg-accent-dark disabled:opacity-50"
          >
            {busy ? "Checking…" : "Continue"}
          </button>
        </form>
      </div>
    </main>
  );
}
