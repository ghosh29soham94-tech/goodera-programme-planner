"use client";

import { useMemo } from "react";
import { fromMinutes, priceProgramme, toMinutes, type PricedBlock } from "@/lib/programme";
import { FORMAT_LABEL, hoursLabel } from "@/lib/labels";
import { seedFrom, teamsForGroup } from "@/lib/teams";
import type { PlanBlock, Understood } from "@/lib/types";

const TEAMS_SHOWN = 6;

interface Props {
  understood: Understood;
  blocks: PlanBlock[];
  brief: string;
  onProposal: () => void;
}

export default function DetailsScreen({ understood: u, blocks, brief, onProposal }: Props) {
  const prog = priceProgramme(blocks, u.groupSize, u.budgetPerHead);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Details</h1>
        <p className="mt-1 text-sm text-muted">What happens in each block, for {u.groupSize.toLocaleString()} people.</p>
        <nav className="mt-3 flex flex-wrap gap-2 text-sm">
          {prog.blocks.map((b) => (
            // Buttons, not #anchors: a hash change would add a history entry and confuse Back.
            <button
              key={b.catalogueId}
              onClick={() => document.getElementById(`block-${b.catalogueId}`)?.scrollIntoView({ behavior: "smooth" })}
              className="rounded-full border border-line bg-card px-3 py-1 hover:border-ink"
            >
              {b.start} · {b.item.name}
            </button>
          ))}
        </nav>
      </header>

      {prog.blocks.map((b) => (
        <section
          key={b.catalogueId}
          id={`block-${b.catalogueId}`}
          className="scroll-mt-4 rounded-xl border border-line bg-card p-5 shadow-sm"
        >
          <p className="text-sm font-medium text-accent-dark">
            {b.start}–{b.end} · {FORMAT_LABEL[b.item.format]}
          </p>
          <h2 className="text-xl font-semibold">{b.item.name}</h2>
          <p className="mt-1 text-sm text-muted">
            {b.item.hostLabel}: {b.item.hostNames}
          </p>
          <div className="mt-4">
            {b.item.format === "leadership-day" ? (
              <LeadershipDetails block={b} understood={u} brief={brief} />
            ) : b.item.build ? (
              <BuildDetails block={b} groupSize={u.groupSize} />
            ) : (
              <SimpleDetails block={b} groupSize={u.groupSize} />
            )}
          </div>
        </section>
      ))}

      <div className="flex justify-end">
        <button onClick={onProposal} className="rounded-lg bg-accent px-5 py-2.5 font-medium text-white hover:bg-accent-dark">
          Create proposal
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- leadership

function facilitatorGuide(b: PricedBlock) {
  const np = b.nonprofit?.name ?? "the nonprofit";
  // Fractions of the block: 12.5% / 25% / 37.5% / 25% (30/60/90/60 min for 4 hours).
  const parts = [
    { share: 0.125, title: "Frame the case", text: `${np}'s lead shares the problem in their own words. Teams read the case pack and agree what success looks like.` },
    { share: 0.25, title: "Diagnose", text: "Each team maps root causes. Ask each person to bring the lens of their own practice before the team converges." },
    { share: 0.375, title: "Design and test", text: "Teams build one solution and test it against the facts and the budget. The facilitator plays sceptic and pushes for specifics." },
    { share: 0.25, title: "Pitch and commit", text: `Five-minute pitches to ${np}. They pick one idea to pilot, and each team names one follow-up it will own.` },
  ];
  let cursor = toMinutes(b.start) ?? 0;
  const total = b.item.durationHours * 60;
  return parts.map((p) => {
    const mins = Math.round(p.share * total);
    const step = { ...p, from: fromMinutes(cursor), to: fromMinutes(cursor + mins), mins };
    cursor += mins;
    return step;
  });
}

function LeadershipDetails({ block: b, understood: u, brief }: { block: PricedBlock; understood: Understood; brief: string }) {
  const { teams, practices, generic } = useMemo(
    () => teamsForGroup(u.groupSize, u.practices, seedFrom(brief + b.catalogueId), 8),
    [u.groupSize, u.practices, brief, b.catalogueId],
  );
  const np = b.nonprofit;
  const guide = facilitatorGuide(b);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {np && (
        <div>
          <h3 className="font-semibold">Case brief: {np.name}</h3>
          <p className="text-xs text-muted">{np.location}</p>
          <p className="mt-2 text-sm leading-relaxed">{np.problem}</p>
          <p className="mt-3 rounded-lg bg-accent-soft px-3 py-2 text-sm">
            <span className="font-medium">The ask: </span>
            {np.ask}
          </p>
          <h4 className="mt-3 text-sm font-medium">Case pack facts</h4>
          <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm">
            {np.facts.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <h3 className="font-semibold">Facilitator guide</h3>
        <ol className="mt-2 space-y-3">
          {guide.map((s, i) => (
            <li key={s.title} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-white">
                {i + 1}
              </span>
              <div>
                <p className="text-sm font-medium">
                  {s.title} <span className="font-normal text-muted">· {s.from}–{s.to} ({s.mins} min)</span>
                </p>
                <p className="text-sm text-muted">{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="lg:col-span-2">
        <h3 className="font-semibold">
          {teams.length} mixed team{teams.length === 1 ? "" : "s"} of about {Math.round(u.groupSize / teams.length)}
        </h3>
        <p className="text-xs text-muted">
          Mixed across {practices.join(", ")}
          {generic ? " (no practices in the brief, so we used common functions)" : ""}. Names are fictional.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {teams.slice(0, TEAMS_SHOWN).map((t) => (
            <div key={t.name} className="rounded-lg border border-line bg-paper p-3">
              <p className="text-sm font-medium">
                {t.name} <span className="font-normal text-muted">· {t.members.length} people</span>
              </p>
              <ul className="mt-1 space-y-0.5 text-sm">
                {t.members.map((m) => (
                  <li key={m.name} className="flex justify-between gap-2">
                    <span>{m.name}</span>
                    <span className="text-xs text-muted">{m.practice}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        {teams.length > TEAMS_SHOWN && (
          <p className="mt-2 text-sm text-muted">…and {teams.length - TEAMS_SHOWN} more teams, mixed the same way.</p>
        )}
      </div>
    </div>
  );
}

// --------------------------------------------------------------------- build

function BuildDetails({ block: b, groupSize }: { block: PricedBlock; groupSize: number }) {
  const build = b.item.build!;
  const teamCount = Math.max(1, Math.ceil(groupSize / build.teamSize));
  const perStation = build.teamSize / build.stations.length;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <dl className="space-y-3 text-sm">
        <div>
          <dt className="font-semibold">What is built</dt>
          <dd>{build.built}</dd>
        </div>
        <div>
          <dt className="font-semibold">Output</dt>
          <dd>
            {b.impactUnits.toLocaleString()} {b.item.impact.unit} ({b.item.impact.perPerson} per person × {groupSize.toLocaleString()})
          </dd>
        </div>
        <div>
          <dt className="font-semibold">Recipient</dt>
          <dd>
            {build.recipient}
            {b.nonprofit && <span className="text-muted">, via {b.nonprofit.name}</span>}
          </dd>
        </div>
        <div>
          <dt className="font-semibold">Materials (Goodera brings these)</dt>
          <dd>
            <ul className="mt-1 list-disc space-y-0.5 pl-5">
              {build.materials.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </dd>
        </div>
      </dl>

      <div>
        <h3 className="text-sm font-semibold">Team split</h3>
        <p className="mt-1 text-sm">
          {teamCount.toLocaleString()} team{teamCount === 1 ? "" : "s"} of {build.teamSize}, with{" "}
          {perStation === 1 ? "one person" : `${perStation % 1 === 0 ? perStation : `${Math.floor(perStation)}–${Math.ceil(perStation)}`} people`}{" "}
          on each station. Teams swap stations halfway so everyone tries two.
        </p>
        <ol className="mt-3 grid grid-cols-2 gap-2">
          {build.stations.map((s, i) => (
            <li key={s} className="rounded-lg border border-line bg-paper px-3 py-2 text-sm">
              <span className="text-xs text-muted">Station {i + 1}</span>
              <br />
              {s}
            </li>
          ))}
        </ol>
        <p className="mt-3 text-xs text-muted">
          {b.item.hostLabel} ({hoursLabel(b.item.durationHours)}). Mix people from different teams in each build team.
        </p>
      </div>
    </div>
  );
}

// ------------------------------------------------------------ wellbeing/close

function SimpleDetails({ block: b, groupSize }: { block: PricedBlock; groupSize: number }) {
  return (
    <div className="text-sm">
      <p>{b.item.summary}</p>
      <p className="mt-2 text-muted">
        Outcome: {b.item.outcome} Impact: {b.impactUnits.toLocaleString()} {b.item.impact.label} for {groupSize.toLocaleString()} people.
      </p>
    </div>
  );
}
