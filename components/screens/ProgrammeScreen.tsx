"use client";

import { Fragment } from "react";

import { nextSwap, priceProgramme, usd, vendorCount } from "@/lib/programme";
import { CAUSE_LABEL, FORMAT_LABEL, SENIORITY_LABEL, formatDate, hoursLabel } from "@/lib/labels";
import type { FocusField } from "@/components/usePlannerState";
import type { Pickers, PlanBlock, PlanResponse, Role } from "@/lib/types";

const LARGE_GROUP = 500;

interface Props {
  response: PlanResponse;
  blocks: PlanBlock[];
  pickers: Pickers;
  role: Role;
  remaining: number | null;
  regenerating: boolean;
  error: string | null;
  onSwap: (index: number) => void;
  onEdit: (field: FocusField) => void;
  onDetails: () => void;
  onProposal: () => void;
  onRegenerate: () => void;
}

interface Tag {
  key: string;
  label: string;
  value: string;
  field: FocusField;
}

/** An understood value is "assumed" when no picker set it and the model listed an assumption for it. */
function isAssumed(key: string, pickers: Pickers, assumptions: string[]): boolean {
  if (key in pickers && pickers[key as keyof Pickers] != null && pickers[key as keyof Pickers] !== "") return false;
  return assumptions.some((a) => a.toLowerCase().startsWith(`${key.toLowerCase()}:`));
}

const stripField = (a: string) => a.replace(/^\s*\w+\s*:\s*/, "");

export default function ProgrammeScreen(p: Props) {
  const { plan, source, fallbackReason } = p.response;
  const u = plan.understood;
  const prog = priceProgramme(p.blocks, u.groupSize, u.budgetPerHead);
  const large = u.groupSize > LARGE_GROUP;
  const showCallout = prog.overBudget || large;
  const vendors = vendorCount(prog);
  const outOfPlans = p.role === "evaluator" && p.remaining === 0;

  const tags: Tag[] = [
    { key: "goal", label: "Goal", value: u.goal, field: "brief" },
    { key: "groupSize", label: "Group", value: `${u.groupSize.toLocaleString()} people`, field: "groupSize" },
    { key: "seniority", label: "Seniority", value: SENIORITY_LABEL[u.seniority] ?? u.seniority, field: "seniority" },
    { key: "location", label: "Location", value: u.location || "Not given", field: "location" },
    { key: "date", label: "Date", value: p.pickers.date ? formatDate(p.pickers.date) : "Not set", field: "date" },
    { key: "durationHours", label: "Time", value: hoursLabel(u.durationHours), field: "brief" },
    {
      key: "budgetPerHead",
      label: "Budget",
      value: u.budgetPerHead ? `${usd(u.budgetPerHead)} a head` : "Not given",
      field: "budgetPerHead",
    },
    { key: "cause", label: "Cause", value: u.cause ? CAUSE_LABEL[u.cause] : "Any", field: "cause" },
    ...(u.practices.length
      ? [{ key: "practices", label: "Practices", value: u.practices.join(", "), field: "brief" as FocusField }]
      : []),
  ];

  return (
    <div className="space-y-6">
      {source === "fallback" && (
        <div role="status" className="rounded-xl border border-accent/40 bg-accent-soft p-4">
          <p className="font-medium text-accent-dark">Showing a sample plan</p>
          <p className="mt-1 text-sm text-accent-dark/90">
            {fallbackReason} This is a pre-built plan close to your brief, so details may not match exactly.
          </p>
        </div>
      )}
      {source === "example" && (
        <p className="rounded-lg bg-card px-3 py-2 text-sm text-muted ring-1 ring-line">
          Example plan: pre-built, so it didn't use a plan.
        </p>
      )}

      <section>
        <h1 className="text-2xl font-semibold">Your programme</h1>
        <h2 className="mt-4 text-sm font-semibold">What we understood</h2>
        <p className="text-xs text-muted">Click any tag to change it. Dashed tags are our assumptions.</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {tags.map((t) => {
            const assumed = isAssumed(t.key, p.pickers, plan.assumptions);
            return (
              <button
                key={t.key}
                onClick={() => p.onEdit(t.field)}
                title={assumed ? "Assumed. Click to set it yourself." : "Click to edit"}
                className={`rounded-full border px-3 py-1 text-left text-sm transition hover:border-accent ${
                  assumed ? "border-dashed border-accent/60 bg-accent-soft/50" : "border-line bg-card"
                }`}
              >
                <span className="text-muted">{t.label}:</span> {t.value}
                {assumed && <span className="ml-1 text-xs text-accent-dark">(assumed)</span>}
              </button>
            );
          })}
        </div>
        {plan.assumptions.length > 0 && (
          <ul className="mt-3 space-y-0.5 text-xs text-muted">
            {plan.assumptions.map((a) => (
              <li key={a}>• {stripField(a)}</li>
            ))}
          </ul>
        )}
      </section>

      {showCallout && (
        <div role="note" className="rounded-xl border-l-4 border-accent bg-card p-4 shadow-sm">
          <p className="text-sm font-semibold">
            {prog.overBudget
              ? `This plan is ${usd(prog.perHead)} a head, above your ${usd(u.budgetPerHead ?? 0)} budget.`
              : `${u.groupSize.toLocaleString()} people is a large group.`}
          </p>
          {plan.notes.length > 0 ? (
            <ul className="mt-1 space-y-1 text-sm text-muted">
              {plan.notes.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-sm text-muted">
              {prog.overBudget ? "Try swapping a block, or raise the budget." : "Consider running it in waves or across sites."}
            </p>
          )}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <section aria-label="Timeline">
          <ol className="relative space-y-4 border-l-2 border-line pl-5">
            {prog.blocks.map((b, i) => {
              const canSwap = nextSwap(b.catalogueId, p.blocks, u.groupSize, u.seniority) !== null;
              return (
                <Fragment key={`${b.catalogueId}-${i}`}>
                <li className="relative">
                  <span className="absolute -left-[27px] top-5 h-3 w-3 rounded-full border-2 border-paper bg-accent" aria-hidden />
                  <article className="rounded-xl border border-line bg-card p-4 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-accent-dark">
                          {b.start}–{b.end} · {hoursLabel(b.item.durationHours)}
                        </p>
                        <h3 className="text-lg font-semibold">{b.item.name}</h3>
                        <p className="text-xs uppercase tracking-wide text-muted">{FORMAT_LABEL[b.item.format]}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{usd(b.item.pricePerHead)}</p>
                        <p className="text-xs text-muted">per head</p>
                      </div>
                    </div>
                    <p className="mt-2 text-sm">{b.item.summary}</p>
                    <dl className="mt-3 grid gap-x-4 gap-y-1 text-sm sm:grid-cols-2">
                      <div>
                        <dt className="inline text-muted">Host: </dt>
                        <dd className="inline">
                          {b.item.hostLabel} · {b.item.hostNames}
                        </dd>
                      </div>
                      <div>
                        <dt className="inline text-muted">Nonprofit: </dt>
                        <dd className="inline">{b.nonprofit?.name ?? "None (reflection close)"}</dd>
                      </div>
                      <div className="sm:col-span-2">
                        <dt className="inline text-muted">Expected impact: </dt>
                        <dd className="inline">
                          {b.impactUnits.toLocaleString()} {b.item.impact.label}
                        </dd>
                      </div>
                    </dl>
                    <p className="mt-3 rounded-lg bg-paper px-3 py-2 text-sm">
                      <span className="font-medium">Why: </span>
                      {b.reason}
                    </p>
                    <div className="mt-3 flex justify-end">
                      <button
                        onClick={() => p.onSwap(i)}
                        disabled={!canSwap}
                        title={canSwap ? "Try another suitable option" : "No other option fits this group"}
                        className="rounded-lg border border-line px-3 py-1.5 text-sm hover:border-ink disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        ⇄ Swap
                      </button>
                    </div>
                  </article>
                </li>
                {prog.lunch?.afterIndex === i && (
                  <li className="relative">
                    <span className="absolute -left-[27px] top-3 h-3 w-3 rounded-full border-2 border-paper bg-line" aria-hidden />
                    <div className="rounded-xl border border-dashed border-line px-4 py-2.5 text-sm text-muted">
                      <span className="font-medium text-ink">
                        {prog.lunch.start}–{prog.lunch.end}
                      </span>{" "}
                      · Lunch break (45 min) · no cost, not counted as programme time
                    </div>
                  </li>
                )}
                </Fragment>
              );
            })}
          </ol>
          {!showCallout && plan.notes.length > 0 && (
            <ul className="mt-4 space-y-1 text-sm text-muted">
              {plan.notes.map((n) => (
                <li key={n}>Note: {n}</li>
              ))}
            </ul>
          )}
        </section>

        <aside className="h-fit space-y-4 rounded-xl border border-line bg-card p-5 shadow-sm lg:sticky lg:top-4">
          <div>
            <p className="text-sm text-muted">Total</p>
            <p className="text-3xl font-semibold">{usd(prog.total)}</p>
            <p className="text-sm text-muted">
              {usd(prog.perHead)} per head × {u.groupSize.toLocaleString()} people
            </p>
            {u.budgetPerHead && (
              <p className={`mt-1 text-sm ${prog.overBudget ? "text-accent-dark" : "text-emerald-700"}`}>
                {prog.overBudget
                  ? `${usd(prog.perHead - u.budgetPerHead)} a head over budget`
                  : `Within your ${usd(u.budgetPerHead)} budget`}
              </p>
            )}
          </div>
          <div className="rounded-lg bg-accent-soft px-3 py-2 text-sm">
            <p className="font-medium">1 partner instead of {vendors} vendors</p>
            <p className="text-xs text-muted">One contract and one invoice. Goodera handles hosts and nonprofits.</p>
          </div>
          <div className="text-sm">
            <p>
              <span className="text-muted">Programme time: </span>
              <span className="font-medium">{hoursLabel(prog.hours)}</span>
              {prog.hours === u.durationHours ? (
                <span className="text-emerald-700"> · matches your brief</span>
              ) : (
                <span className="text-muted"> of the {hoursLabel(u.durationHours)} in your brief</span>
              )}
            </p>
            {prog.lunch && <p className="text-xs text-muted">Plus a 45-minute lunch, not counted.</p>}
            <p className="text-xs text-muted">Prices come from the catalogue.</p>
          </div>

          <div className="space-y-2 pt-1">
            <button onClick={p.onDetails} className="w-full rounded-lg border border-line px-4 py-2 text-sm font-medium hover:border-ink">
              See details
            </button>
            <button
              onClick={p.onProposal}
              className="w-full rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-dark"
            >
              Create proposal
            </button>
            <button
              onClick={p.onRegenerate}
              disabled={p.regenerating || outOfPlans}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm text-muted hover:text-ink disabled:opacity-50"
            >
              {p.regenerating && (
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-line border-t-accent" aria-hidden />
              )}
              {p.regenerating ? "Regenerating…" : "↻ Regenerate"}
            </button>
            <p className="text-center text-xs text-muted">
              {outOfPlans
                ? "No plans left, so Regenerate is off."
                : p.role === "evaluator"
                  ? `Costs 1 plan (${p.remaining} left).`
                  : "Costs 1 AI plan."}
            </p>
            {p.error && <p className="text-center text-xs text-accent-dark">{p.error}</p>}
          </div>
        </aside>
      </div>
    </div>
  );
}
