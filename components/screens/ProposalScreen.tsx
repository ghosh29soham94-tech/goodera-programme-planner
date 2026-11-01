"use client";

import { Fragment } from "react";

import { COMPANY, PEOPLE } from "@/data/demo";
import { priceProgramme, usd } from "@/lib/programme";
import { CAUSE_LABEL, FORMAT_LABEL, SENIORITY_LABEL, formatDate, hoursLabel } from "@/lib/labels";
import type { Pickers, PlanBlock, PlanSource, Understood } from "@/lib/types";

interface Props {
  title: string;
  understood: Understood;
  blocks: PlanBlock[];
  pickers: Pickers;
  source: PlanSource;
  approved: boolean;
  approvedAt: string | null;
  onApprove: () => void;
  onSkip: () => void;
}

// Pure template: everything below is filled from the plan and catalogue. No AI.
export default function ProposalScreen({ title, understood: u, blocks, pickers, source, approved, approvedAt, onApprove, onSkip }: Props) {
  const prog = priceProgramme(blocks, u.groupSize, u.budgetPerHead);
  const csrPct = prog.total ? Math.round((prog.csrTotal / prog.total) * 100) : 0;
  const nonprofits = [...new Set(prog.blocks.map((b) => b.nonprofit?.name).filter(Boolean))] as string[];
  const when = pickers.date ? formatDate(pickers.date) : "Date to be confirmed";
  const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="mx-auto max-w-3xl">
      {source === "fallback" && (
        <p className="no-print mb-4 rounded-lg bg-accent-soft px-3 py-2 text-sm text-accent-dark">
          Based on a sample plan. Check the details before sharing.
        </p>
      )}

      <article className="rounded-xl border border-line bg-card p-6 shadow-sm sm:p-8">
        <header className="border-b border-line pb-4">
          <p className="text-sm font-medium text-accent">Proposal · {COMPANY.name}</p>
          <h1 className="mt-1 text-2xl font-semibold">{title}</h1>
          <dl className="mt-3 grid gap-1 text-sm sm:grid-cols-2">
            <div>
              <dt className="inline text-muted">For: </dt>
              <dd className="inline">
                {PEOPLE.businessHead.name}, {PEOPLE.businessHead.title}
              </dd>
            </div>
            <div>
              <dt className="inline text-muted">From: </dt>
              <dd className="inline">
                {PEOPLE.hrPartner.name}, {PEOPLE.hrPartner.title}
              </dd>
            </div>
            <div>
              <dt className="inline text-muted">CSR review: </dt>
              <dd className="inline">
                {PEOPLE.csrLead.name}, {PEOPLE.csrLead.title}
              </dd>
            </div>
            <div>
              <dt className="inline text-muted">Prepared: </dt>
              <dd className="inline">{today}</dd>
            </div>
          </dl>
        </header>

        <section className="mt-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Goal</h2>
          <p className="mt-1">
            {u.goal.trim().replace(/[.\s]+$/, "")}, for {u.groupSize.toLocaleString()} {SENIORITY_LABEL[u.seniority]?.toLowerCase() ?? ""} colleagues
            {u.practices.length ? ` from ${u.practices.join(", ")}` : ""} in {u.location || "a location to be confirmed"}.{" "}
            {when}, {hoursLabel(prog.hours)}.
            {u.cause ? ` Cause: ${CAUSE_LABEL[u.cause]}.` : ""}
          </p>
        </section>

        <section className="mt-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Agenda</h2>
          <table className="mt-2 w-full text-sm">
            <tbody>
              {prog.blocks.map((b, i) => (
                <Fragment key={b.catalogueId}>
                  <tr className="border-b border-line last:border-0">
                    <td className="whitespace-nowrap py-2 pr-4 align-top font-medium">
                      {b.start}–{b.end}
                    </td>
                    <td className="py-2 align-top">
                      {b.item.name} <span className="text-muted">· {FORMAT_LABEL[b.item.format]}</span>
                      <br />
                      <span className="text-muted">
                        {b.item.hostLabel}
                        {b.nonprofit ? ` · with ${b.nonprofit.name}` : ""}
                      </span>
                    </td>
                  </tr>
                  {prog.lunch?.afterIndex === i && (
                    <tr className="border-b border-line text-muted">
                      <td className="whitespace-nowrap py-2 pr-4 align-top">
                        {prog.lunch.start}–{prog.lunch.end}
                      </td>
                      <td className="py-2 align-top">Lunch break (no cost)</td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </section>

        <section className="mt-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Outcomes</h2>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
            {prog.blocks.map((b) => (
              <li key={b.catalogueId}>
                {b.item.outcome}{" "}
                <span className="text-muted">
                  ({b.impactUnits.toLocaleString()} {b.item.impact.label})
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Total cost</h2>
          <p className="mt-1 text-2xl font-semibold">{usd(prog.total)}</p>
          <p className="text-sm text-muted">
            {usd(prog.perHead)} per head × {u.groupSize.toLocaleString()} people. One partner, one invoice.
            {u.budgetPerHead
              ? prog.overBudget
                ? ` ${usd(prog.perHead - u.budgetPerHead)} a head above the ${usd(u.budgetPerHead)} budget.`
                : ` Within the ${usd(u.budgetPerHead)} a head budget.`
              : ""}
          </p>
        </section>

        <section className="mt-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Budget split</h2>
          <div className="mt-2 flex h-3 overflow-hidden rounded-full bg-line" role="img" aria-label={`${100 - csrPct}% business unit, ${csrPct}% CSR`}>
            <div className="bg-ink" style={{ width: `${100 - csrPct}%` }} />
            <div className="bg-accent" style={{ width: `${csrPct}%` }} />
          </div>
          <div className="mt-2 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <p className="flex items-center gap-2 font-medium">
                <span className="h-2.5 w-2.5 rounded-full bg-ink" aria-hidden /> Business unit: {usd(prog.businessTotal)}
              </p>
              <p className="text-muted">Pre-sales budget: facilitation, hosts, venue logistics.</p>
            </div>
            <div>
              <p className="flex items-center gap-2 font-medium">
                <span className="h-2.5 w-2.5 rounded-full bg-accent" aria-hidden /> CSR-countable: {usd(prog.csrTotal)}
              </p>
              <p className="text-muted">
                Paid to or spent on {nonprofits.length ? nonprofits.join(" and ") : "nonprofits"}: grants, donated materials.
              </p>
            </div>
          </div>
          <table className="mt-3 w-full text-xs text-muted">
            <tbody>
              {prog.blocks.map((b) => (
                <tr key={b.catalogueId}>
                  <td className="py-0.5 pr-2">{b.item.name}</td>
                  <td className="py-0.5 pr-2 text-right">{usd(b.lineTotal)}</td>
                  <td className="py-0.5 text-right">{Math.round(b.item.csrShare * 100)}% CSR</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-1 text-xs text-muted">Sample split rules. Confirm CSR eligibility with {PEOPLE.csrLead.name}.</p>
        </section>

        <footer className="mt-6 border-t border-line pt-5">
          {approved ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="rounded-lg border-2 border-emerald-600 px-4 py-2 text-emerald-700" role="status">
                <p className="font-semibold">✓ Approved by Priya</p>
                <p className="text-xs">
                  {PEOPLE.businessHead.name}
                  {approvedAt ? ` · ${new Date(approvedAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}` : ""}
                </p>
              </div>
              <button onClick={onSkip} className="no-print rounded-lg bg-accent px-5 py-2.5 font-medium text-white hover:bg-accent-dark">
                Skip to after the event →
              </button>
            </div>
          ) : (
            <div className="no-print flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted">Demo: approve as {PEOPLE.businessHead.name}.</p>
              <button onClick={onApprove} className="rounded-lg bg-accent px-5 py-2.5 font-medium text-white hover:bg-accent-dark">
                Approve
              </button>
            </div>
          )}
        </footer>
      </article>
    </div>
  );
}
