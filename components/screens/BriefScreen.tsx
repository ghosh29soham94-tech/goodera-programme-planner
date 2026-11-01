"use client";

import { useEffect } from "react";
import { EXAMPLES, type Example } from "@/data/samples";
import { BRIEF_MAX, BRIEF_MIN, GROUP_MAX, GROUP_MIN } from "@/lib/schema";
import { CAUSES, SENIORITIES, type Pickers } from "@/lib/types";
import { CAUSE_LABEL, SENIORITY_LABEL } from "@/lib/labels";
import type { FocusField } from "@/components/usePlannerState";

interface Props {
  brief: string;
  pickers: Pickers;
  loading: boolean;
  error: string | null;
  outOfScope: boolean;
  focusField: FocusField | null;
  onBrief: (brief: string) => void;
  onPickers: (pickers: Pickers) => void;
  onBuild: () => void;
  onExample: (example: Example) => void;
  onFocused: () => void;
}

const numOrNull = (v: string) => (v.trim() === "" || !Number.isFinite(Number(v)) ? null : Number(v));

export default function BriefScreen(p: Props) {
  const len = p.brief.trim().length;
  const briefOk = len >= BRIEF_MIN && len <= BRIEF_MAX;
  const g = p.pickers.groupSize;
  const groupOk = g == null || (Number.isInteger(g) && g >= GROUP_MIN && g <= GROUP_MAX);
  const canBuild = briefOk && groupOk && !p.loading;

  // Arriving from a "What we understood" tag: focus that picker.
  useEffect(() => {
    if (!p.focusField) return;
    const el = document.getElementById(p.focusField === "brief" ? "brief" : `picker-${p.focusField}`);
    el?.scrollIntoView({ block: "center" });
    el?.focus();
    p.onFocused();
  }, [p.focusField]);

  const set = (patch: Pickers) => p.onPickers({ ...p.pickers, ...patch });
  const field = "mt-1 w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-accent";

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <section>
        <h1 className="text-2xl font-semibold">What are you planning?</h1>
        <p className="mt-1 text-sm text-muted">
          Describe it the way you would to a colleague. We'll turn it into a costed programme.
        </p>

        {p.outOfScope && (
          <div role="alert" className="mt-4 rounded-xl border border-accent/30 bg-accent-soft p-4">
            <p className="text-sm font-medium text-accent-dark">
              This planner builds group experiences for teams. Try one of these:
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {EXAMPLES.map((e) => (
                <button
                  key={e.id}
                  onClick={() => p.onExample(e)}
                  className="rounded-full border border-accent/40 bg-card px-3 py-1.5 text-sm hover:border-accent"
                >
                  {e.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <label htmlFor="brief" className="sr-only">
          Brief
        </label>
        <textarea
          id="brief"
          value={p.brief}
          maxLength={BRIEF_MAX}
          onChange={(e) => p.onBrief(e.target.value)}
          rows={6}
          className="mt-4 w-full resize-y rounded-xl border border-line bg-card p-4 leading-relaxed shadow-sm outline-none focus:border-accent"
        />
        <div className="mt-1 flex justify-between text-xs">
          <span className={len > 0 && len < BRIEF_MIN ? "text-accent-dark" : "text-muted"}>
            {len > 0 && len < BRIEF_MIN ? `Add a little more detail (at least ${BRIEF_MIN} characters).` : " "}
          </span>
          <span className="text-muted">
            {len}/{BRIEF_MAX}
          </span>
        </div>

        <div className="mt-4">
          <p className="text-sm font-medium">Or try an example</p>
          <p className="text-xs text-muted">Pre-built, instant, and doesn't use a plan.</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {EXAMPLES.map((e) => (
              <button
                key={e.id}
                onClick={() => p.onExample(e)}
                disabled={p.loading}
                className="rounded-full border border-line bg-card px-3 py-1.5 text-sm hover:border-ink disabled:opacity-50"
              >
                {e.label}
              </button>
            ))}
          </div>
        </div>

        {p.error && (
          <p role="alert" className="mt-4 rounded-lg bg-accent-soft px-3 py-2 text-sm text-accent-dark">
            {p.error}
          </p>
        )}

        <button
          onClick={p.onBuild}
          disabled={!canBuild}
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 font-medium text-white shadow-sm transition hover:bg-accent-dark disabled:opacity-50"
        >
          {p.loading && (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden />
          )}
          {p.loading ? "Building your programme…" : "Build my programme"}
        </button>
        {p.loading && <p className="mt-2 text-xs text-muted">This usually takes a few seconds.</p>}
      </section>

      <aside className="h-fit rounded-xl border border-line bg-card p-4 shadow-sm">
        <h2 className="text-sm font-semibold">Details (optional)</h2>
        <p className="text-xs text-muted">Anything you set here overrides the brief.</p>
        <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-1">
          <div>
            <label htmlFor="picker-groupSize" className="text-xs font-medium">
              Group size
            </label>
            <input
              id="picker-groupSize"
              type="number"
              inputMode="numeric"
              min={GROUP_MIN}
              max={GROUP_MAX}
              placeholder="e.g. 40"
              value={g ?? ""}
              onChange={(e) => set({ groupSize: numOrNull(e.target.value) })}
              className={field}
            />
            {!groupOk && (
              <p className="mt-1 text-xs text-accent-dark">
                Between {GROUP_MIN} and {GROUP_MAX.toLocaleString()} people.
              </p>
            )}
          </div>
          <div>
            <label htmlFor="picker-seniority" className="text-xs font-medium">
              Seniority
            </label>
            <select
              id="picker-seniority"
              value={p.pickers.seniority ?? ""}
              onChange={(e) => set({ seniority: (e.target.value || null) as Pickers["seniority"] })}
              className={field}
            >
              <option value="">From the brief</option>
              {SENIORITIES.map((s) => (
                <option key={s} value={s}>
                  {SENIORITY_LABEL[s]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="picker-location" className="text-xs font-medium">
              Location
            </label>
            <input
              id="picker-location"
              type="text"
              maxLength={60}
              placeholder="e.g. Bangalore"
              value={p.pickers.location ?? ""}
              onChange={(e) => set({ location: e.target.value || null })}
              className={field}
            />
          </div>
          <div>
            <label htmlFor="picker-date" className="text-xs font-medium">
              Date
            </label>
            <input
              id="picker-date"
              type="date"
              value={p.pickers.date ?? ""}
              onChange={(e) => set({ date: e.target.value || null })}
              className={field}
            />
          </div>
          <div>
            <label htmlFor="picker-budgetPerHead" className="text-xs font-medium">
              Budget per head (USD)
            </label>
            <input
              id="picker-budgetPerHead"
              type="number"
              inputMode="numeric"
              min={1}
              placeholder="e.g. 120"
              value={p.pickers.budgetPerHead ?? ""}
              onChange={(e) => set({ budgetPerHead: numOrNull(e.target.value) })}
              className={field}
            />
          </div>
          <div>
            <label htmlFor="picker-cause" className="text-xs font-medium">
              Cause
            </label>
            <select
              id="picker-cause"
              value={p.pickers.cause ?? ""}
              onChange={(e) => set({ cause: (e.target.value || null) as Pickers["cause"] })}
              className={field}
            >
              <option value="">Any cause</option>
              {CAUSES.map((c) => (
                <option key={c} value={c}>
                  {CAUSE_LABEL[c]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </aside>
    </div>
  );
}

