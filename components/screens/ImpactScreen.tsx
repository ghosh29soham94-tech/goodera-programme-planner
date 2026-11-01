"use client";

import { useState } from "react";
import { COMPANY } from "@/data/demo";
import { priceProgramme } from "@/lib/programme";
import { computeImpact, type Metric } from "@/lib/impact";
import { formatDate } from "@/lib/labels";
import type { Pickers, PlanBlock, Understood } from "@/lib/types";

type Tab = "business" | "hr" | "csr";
const TABS: { id: Tab; label: string; audience: string }[] = [
  { id: "business", label: "Business", audience: "For Priya" },
  { id: "hr", label: "HR", audience: "For Rahul" },
  { id: "csr", label: "CSR", audience: "For Meera" },
];

interface Props {
  title: string;
  understood: Understood;
  blocks: PlanBlock[];
  pickers: Pickers;
  onNewPlan: () => void;
}

export default function ImpactScreen({ title, understood: u, blocks, pickers, onNewPlan }: Props) {
  const [tab, setTab] = useState<Tab>("business");
  const prog = priceProgramme(blocks, u.groupSize, u.budgetPerHead);
  const report = computeImpact(prog);
  const metrics = report[tab];

  return (
    <div className="space-y-6">
      <header className="no-print flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-accent">Impact report</p>
          <h1 className="mt-1 text-2xl font-semibold">{title}</h1>
          <p className="mt-1 text-sm text-muted">{u.goal}</p>
        </div>
        <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold uppercase tracking-wide text-accent-dark">
          Sample results
        </span>
      </header>
      <p className="no-print -mt-3 text-xs text-muted">
        Illustrative only: computed from your plan using fixed sample rates (e.g. 92% attendance), not real event data.
      </p>

      <section className="no-print">
        <div role="tablist" aria-label="Report views" className="flex gap-1 border-b border-line">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              id={`tab-${t.id}`}
              aria-selected={tab === t.id}
              aria-controls={`panel-${t.id}`}
              onClick={() => setTab(t.id)}
              className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${
                tab === t.id ? "border-accent text-ink" : "border-transparent text-muted hover:text-ink"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="pt-4">
          <p className="text-xs text-muted">{TABS.find((t) => t.id === tab)?.audience}</p>
          <MetricGrid metrics={metrics} />
          {tab === "csr" && (
            <div className="mt-4 rounded-xl border border-line bg-card p-4">
              <h3 className="text-sm font-semibold">What was delivered</h3>
              <ul className="mt-2 space-y-1 text-sm">
                {report.outputs.map((o) => (
                  <li key={o.name} className="flex flex-wrap justify-between gap-2">
                    <span>
                      <span className="font-medium">{o.units.toLocaleString()}</span> {o.label}
                    </span>
                    <span className="text-muted">{o.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      <section>
        <div className="no-print mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold">{report.hasLeadership ? "Leadership impact card" : "Impact card"}</h2>
          <button onClick={() => window.print()} className="rounded-lg border border-line px-3 py-1.5 text-sm hover:border-ink">
            Print card
          </button>
        </div>
        <ImpactCard title={title} understood={u} pickers={pickers} report={report} />
      </section>

      <div className="no-print flex justify-center pt-2">
        <button onClick={onNewPlan} className="rounded-lg bg-accent px-5 py-2.5 font-medium text-white hover:bg-accent-dark">
          Start a new plan
        </button>
      </div>
    </div>
  );
}

function MetricGrid({ metrics }: { metrics: Metric[] }) {
  return (
    <dl className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {metrics.map((m) => (
        <div key={m.label} className="rounded-xl border border-line bg-card p-4 shadow-sm">
          <dt className="text-sm text-muted">{m.label}</dt>
          <dd className="mt-1 text-2xl font-semibold">{m.value}</dd>
          {m.note && <dd className="mt-0.5 text-xs text-muted">{m.note}</dd>}
        </div>
      ))}
    </dl>
  );
}

function ImpactCard({
  title,
  understood: u,
  pickers,
  report,
}: {
  title: string;
  understood: Understood;
  pickers: Pickers;
  report: ReturnType<typeof computeImpact>;
}) {
  const headline = report.business[0];
  return (
    <article className="print-card mx-auto max-w-2xl rounded-2xl border border-line bg-card p-6 shadow-sm">
      <div className="flex items-start justify-between gap-3 border-b border-line pb-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-accent">
            {COMPANY.name} · {report.hasLeadership ? "Leadership impact" : "Programme impact"}
          </p>
          <h3 className="mt-1 text-lg font-semibold">{title}</h3>
          <p className="text-sm text-muted">
            {report.attendees.toLocaleString()} attended · {u.location || "Location TBC"}
            {pickers.date ? ` · ${formatDate(pickers.date)}` : ""}
          </p>
        </div>
        <span className="shrink-0 rounded border border-accent px-2 py-0.5 text-[10px] font-semibold uppercase text-accent-dark">
          Sample results
        </span>
      </div>
      <div className="grid grid-cols-3 gap-3 py-4 text-center">
        <div>
          <p className="text-2xl font-semibold">{headline.value}</p>
          <p className="text-xs text-muted">{headline.label.toLowerCase()}</p>
        </div>
        <div>
          <p className="text-2xl font-semibold">{report.volunteerHours.toLocaleString()}</p>
          <p className="text-xs text-muted">volunteer hours</p>
        </div>
        <div>
          <p className="text-2xl font-semibold">{report.hr[1].value}</p>
          <p className="text-xs text-muted">satisfaction</p>
        </div>
      </div>
      <ul className="space-y-1 border-t border-line pt-3 text-sm">
        {report.outputs.map((o) => (
          <li key={o.name}>
            <span className="font-semibold">{o.units.toLocaleString()}</span> {o.label}
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-muted">
        Delivered with Goodera{report.nonprofits.length ? ` and ${report.nonprofits.join(", ")}` : ""}. Illustrative figures from fixed sample rates.
      </p>
    </article>
  );
}
