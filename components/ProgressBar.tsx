"use client";

import type { Screen } from "@/components/usePlannerState";

const STEPS = ["Brief", "Programme", "Details", "Proposal", "Impact"];

export default function ProgressBar({ screen, onBack }: { screen: Screen; onBack: () => void }) {
  return (
    <div className="no-print mx-auto max-w-6xl px-4 pt-5">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          disabled={screen === 1}
          className="shrink-0 rounded-lg border border-line bg-card px-3 py-1.5 text-sm hover:border-ink disabled:invisible"
        >
          ← Back
        </button>
        <ol className="flex flex-1 gap-1.5" aria-label="Progress">
          {STEPS.map((label, i) => {
            const n = i + 1;
            const state = n < screen ? "done" : n === screen ? "current" : "todo";
            return (
              <li key={label} className="flex-1" aria-current={state === "current" ? "step" : undefined}>
                <div className={`h-1.5 rounded-full ${state === "todo" ? "bg-line" : "bg-accent"}`} />
                <span
                  className={`mt-1.5 hidden text-xs sm:block ${state === "current" ? "font-medium text-ink" : "text-muted"}`}
                >
                  {n}. {label}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
      <p className="mt-2 text-xs text-muted sm:hidden">
        Step {screen} of 5 · {STEPS[screen - 1]}
      </p>
    </div>
  );
}
