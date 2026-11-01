"use client";

import { COMPANY } from "@/data/demo";
import type { Role } from "@/lib/types";

export default function Header({ role, remaining }: { role: Role; remaining: number | null }) {
  async function signOut() {
    await fetch("/api/access", { method: "DELETE" });
    try {
      sessionStorage.clear();
    } catch {
      /* ignore */
    }
    window.location.reload();
  }

  return (
    <header className="no-print border-b border-line bg-card">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-3">
        <div className="flex items-baseline gap-2">
          <span className="font-semibold">
            <span className="text-accent">Goodera</span> Programme Planner
          </span>
          <span className="hidden text-sm text-muted sm:inline">for {COMPANY.name}</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          {role === "evaluator" && remaining !== null && (
            <span
              className={`rounded-full px-3 py-1 ${remaining === 0 ? "bg-accent-soft text-accent-dark" : "bg-paper text-muted"}`}
              title="AI plans you can still generate. Examples and cached plans are free."
            >
              {remaining} plan{remaining === 1 ? "" : "s"} left
            </span>
          )}
          {role === "owner" && <span className="rounded-full bg-paper px-3 py-1 text-muted">Owner</span>}
          <button onClick={signOut} className="text-muted underline-offset-2 hover:text-ink hover:underline">
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
