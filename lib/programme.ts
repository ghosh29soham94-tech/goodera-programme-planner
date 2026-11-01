// Pure plan logic: scheduling, pricing, swaps. Safe on client and server.
// Prices and totals always come from the catalogue, never from the model.
import { CATALOGUE, getItem, getNonprofit } from "@/data/demo";
import { GROUP_MAX, GROUP_MIN, type AiPlan } from "@/lib/schema";
import type { CatalogueItem, Nonprofit, Pickers, PlanBlock, PlanResult, Seniority } from "@/lib/types";

// ------------------------------------------------------------------- time

export function toMinutes(hhmm: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  return h < 24 && min < 60 ? h * 60 + min : null;
}

export function fromMinutes(total: number): string {
  const t = ((Math.round(total) % 1440) + 1440) % 1440;
  return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
}

export const LUNCH_MINUTES = 45;
const LUNCH_AFTER_MINUTES = 4 * 60; // lunch only when the programme runs past 4 hours
const MIDDAY = 12 * 60 + 30;

const durationMin = (b: PlanBlock) => (getItem(b.catalogueId)?.durationHours ?? 1) * 60;

/**
 * Index of the block that lunch follows, or null when there is no lunch.
 * Lunch goes at the block boundary closest to 12:30. It is free and not programme time.
 */
export function lunchAfter(blocks: PlanBlock[], startMin: number): number | null {
  const total = blocks.reduce((s, b) => s + durationMin(b), 0);
  if (total <= LUNCH_AFTER_MINUTES || blocks.length < 2) return null;
  let cursor = startMin;
  let best = 0;
  let bestDiff = Infinity;
  for (let i = 0; i < blocks.length - 1; i++) {
    cursor += durationMin(blocks[i]);
    const diff = Math.abs(cursor - MIDDAY);
    if (diff < bestDiff) {
      best = i;
      bestDiff = diff;
    }
  }
  return best;
}

/**
 * Orders blocks by the model's start times, then packs them back to back from the first start,
 * with a 45-minute lunch when the programme runs past 4 hours. Running it twice gives the same result.
 */
export function schedule(blocks: PlanBlock[]): PlanBlock[] {
  const withMin = blocks.map((b, i) => ({ b, i, m: toMinutes(b.start) }));
  withMin.sort((a, z) => (a.m ?? Infinity) - (z.m ?? Infinity) || a.i - z.i);
  const ordered = withMin.map((x) => x.b);
  const first = withMin[0]?.m ?? 9 * 60;
  const lunch = lunchAfter(ordered, first);
  let cursor = first;
  return ordered.map((b, i) => {
    const start = cursor;
    cursor += durationMin(b) + (i === lunch ? LUNCH_MINUTES : 0);
    return { ...b, start: fromMinutes(start) };
  });
}

// Which block to drop first when a plan is longer than the brief allows.
const KEEP_PRIORITY: Record<CatalogueItem["format"], number> = { "leadership-day": 3, "build-donate": 2, wellbeing: 1, close: 0 };

/** Removes the lowest-priority blocks until the total fits inside `hours`. Keeps at least one block. */
export function fitToTime(blocks: PlanBlock[], hours: number): { blocks: PlanBlock[]; removed: string[] } {
  const list = [...blocks];
  const removed: string[] = [];
  const total = () => list.reduce((s, b) => s + durationMin(b), 0);
  while (list.length > 1 && total() > hours * 60 + 0.5) {
    let idx = 0;
    list.forEach((b, i) => {
      const p = KEEP_PRIORITY[getItem(b.catalogueId)?.format ?? "close"];
      if (p <= KEEP_PRIORITY[getItem(list[idx].catalogueId)?.format ?? "close"]) idx = i;
    });
    removed.push(getItem(list[idx].catalogueId)?.name ?? list[idx].catalogueId);
    list.splice(idx, 1);
  }
  return { blocks: list, removed };
}

// --------------------------------------------- stated in the brief → not assumed

const TIME_RE = /\b\d+(\.\d+)?\s*(-\s*)?(hours?|hrs?|h|minutes|mins)\b|\b(half|full|whole)[\s-]+(a\s+)?day\b|\ban?\s+hour\b/i;
const MONEY_RE = /[$₹€£]\s?\d|\b\d[\d,.]*\s?k?\s?(usd|dollars?|inr|rupees|lakhs?|eur|euros?|gbp|pounds)\b|\b(usd|inr|rs\.?)\s?\d/i;
const GROUP_RE =
  /\b\d[\d,]*[\s-]+(people|persons?|leaders|employees|staff|colleagues|attendees|participants|directors|managers|new joiners|joiners|members|engineers|heads|hires)\b/i;

/**
 * True when the brief states the value, or it follows directly from the brief
 * (e.g. budget per head worked out from a total budget and the group size).
 */
export function statedInBrief(field: string, brief: string, location: string): boolean {
  switch (field) {
    case "durationHours":
      return TIME_RE.test(brief);
    case "budgetPerHead":
      return MONEY_RE.test(brief);
    case "groupSize":
      return GROUP_RE.test(brief);
    case "location":
      return location.trim().length > 1 && brief.toLowerCase().includes(location.trim().toLowerCase());
    default:
      return false;
  }
}

const assumptionField = (a: string) => /^\s*(\w+)\s*:/.exec(a)?.[1] ?? "";

// ------------------------------------------------------- AI → PlanResult

const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

export const TITLE_MAX = 60;

/** Fits a title to 60 characters by cutting at a word boundary. No ellipsis. */
export function fitTitle(s: string): string {
  const t = s.trim().replace(/\s+/g, " ");
  if (t.length <= TITLE_MAX) return t;
  const cut = t.slice(0, TITLE_MAX + 1);
  const space = cut.lastIndexOf(" ");
  return (space > 20 ? cut.slice(0, space) : t.slice(0, TITLE_MAX)).replace(/[\s,;:–-]+$/, "");
}

/** Heading for a plan. Falls back to the goal for plans cached before titles existed. */
export function planTitle(plan: PlanResult): string {
  return plan.title?.trim() || fitTitle(plan.understood.goal);
}

/**
 * Turns validated model output into a PlanResult we trust:
 * picker values win over the model, numbers are clamped, text is clipped,
 * duplicate blocks are dropped, and times are re-scheduled.
 */
export function finalisePlan(ai: AiPlan, pickers: Pickers, brief: string): PlanResult {
  const u = ai.understood;
  const seen = new Set<string>();
  const durationHours = Math.min(24, Math.max(0.5, u.durationHours));
  const unique = ai.blocks
    .filter((b) => (seen.has(b.catalogueId) ? false : (seen.add(b.catalogueId), true)))
    .slice(0, 4)
    .map((b) => ({ catalogueId: b.catalogueId, start: b.start, reason: clip(b.reason, 240) }));
  // Respect the time the brief gives: drop the least important blocks until it fits.
  const { blocks, removed } = fitToTime(schedule(unique), durationHours);
  const location = clip(pickers.location?.trim() || u.location, 60);
  // Keep only real assumptions: not set by a picker, and not stated or worked out from the brief.
  const assumptions = ai.assumptions.filter((a) => {
    const f = assumptionField(a);
    const picked = f in pickers && pickers[f as keyof Pickers] != null && pickers[f as keyof Pickers] !== "";
    return !picked && !statedInBrief(f, brief, location);
  });
  const timeNotes = removed.map((name) => `We left out ${name} so the programme fits in ${durationHours} hours.`);

  return {
    status: ai.status,
    title: fitTitle(ai.title || u.goal),
    understood: {
      goal: u.goal.trim(), // full sentence, never truncated
      groupSize: Math.round(Math.min(GROUP_MAX, Math.max(GROUP_MIN, pickers.groupSize ?? u.groupSize))),
      seniority: pickers.seniority ?? u.seniority,
      location,
      durationHours,
      budgetPerHead: pickers.budgetPerHead ?? (u.budgetPerHead && u.budgetPerHead > 0 ? u.budgetPerHead : null),
      cause: pickers.cause ?? u.cause,
      practices: u.practices.map((p) => clip(p.trim(), 40)).filter(Boolean).slice(0, 8),
    },
    assumptions: assumptions.map((a) => clip(a, 200)).slice(0, 6),
    blocks: schedule(blocks),
    notes: [...timeNotes, ...ai.notes.map((n) => clip(n, 240))].slice(0, 4),
  };
}

// ---------------------------------------------------------------- pricing

export interface PricedBlock extends PlanBlock {
  item: CatalogueItem;
  nonprofit: Nonprofit | undefined;
  end: string;
  lineTotal: number;
  impactUnits: number;
}

export interface Programme {
  blocks: PricedBlock[];
  groupSize: number;
  perHead: number;
  total: number;
  csrTotal: number;
  businessTotal: number;
  /** Programme hours: activity time only, lunch excluded. */
  hours: number;
  vendors: number;
  overBudget: boolean;
  /** 45-minute lunch shown on the timeline after block `afterIndex`. Free; not programme time. */
  lunch: { afterIndex: number; start: string; end: string } | null;
}

export function priceProgramme(blocks: PlanBlock[], groupSize: number, budgetPerHead: number | null): Programme {
  const priced: PricedBlock[] = [];
  // Always schedule here too, so samples and older saved plans get the same lunch logic.
  const scheduled = schedule(blocks);
  for (const b of scheduled) {
    const item = getItem(b.catalogueId);
    if (!item) continue;
    const start = toMinutes(b.start) ?? 0;
    priced.push({
      ...b,
      item,
      nonprofit: getNonprofit(item.nonprofitId),
      end: fromMinutes(start + item.durationHours * 60),
      lineTotal: item.pricePerHead * groupSize,
      impactUnits: Math.floor(item.impact.perPerson * groupSize),
    });
  }
  const perHead = priced.reduce((s, b) => s + b.item.pricePerHead, 0);
  const total = perHead * groupSize;
  const csrTotal = Math.round(priced.reduce((s, b) => s + b.lineTotal * b.item.csrShare, 0));
  const lunchIdx = priced.length ? lunchAfter(priced, toMinutes(priced[0].start) ?? 0) : null;
  const lunch =
    lunchIdx === null
      ? null
      : {
          afterIndex: lunchIdx,
          start: priced[lunchIdx].end,
          end: fromMinutes((toMinutes(priced[lunchIdx].end) ?? 0) + LUNCH_MINUTES),
        };
  return {
    blocks: priced,
    groupSize,
    perHead,
    total,
    csrTotal,
    businessTotal: total - csrTotal,
    hours: priced.reduce((s, b) => s + b.item.durationHours, 0),
    vendors: new Set(priced.map((b) => b.catalogueId)).size,
    overBudget: budgetPerHead !== null && perHead > budgetPerHead,
    lunch,
  };
}

// ------------------------------------------------------------------- swap

function fitsSeniority(item: CatalogueItem, s: Seniority): boolean {
  return item.seniority.includes(s) || (s === "mixed" && item.seniority.includes("mid"));
}

/**
 * Next suitable alternative for a block, cycling in catalogue order:
 * same format, fits the group size and seniority, not used by another block.
 * Returns null when there is no alternative.
 */
export function nextSwap(current: string, plan: PlanBlock[], groupSize: number, seniority: Seniority): string | null {
  const cur = getItem(current);
  if (!cur) return null;
  const usedElsewhere = new Set(plan.map((b) => b.catalogueId).filter((id) => id !== current));
  const cycle = CATALOGUE.filter(
    (c) =>
      c.format === cur.format &&
      !usedElsewhere.has(c.id) &&
      (c.id === current || (groupSize >= c.minGroup && groupSize <= c.maxGroup && fitsSeniority(c, seniority))),
  ).map((c) => c.id);
  if (cycle.length < 2) return null;
  return cycle[(cycle.indexOf(current) + 1) % cycle.length];
}

/** Replaces one block with its next alternative and re-schedules. */
export function swapBlock(plan: PlanBlock[], index: number, groupSize: number, seniority: Seniority): PlanBlock[] {
  const next = nextSwap(plan[index].catalogueId, plan, groupSize, seniority);
  const item = next ? getItem(next) : undefined;
  if (!item) return plan;
  const updated = plan.map((b, i) => (i === index ? { catalogueId: item.id, start: b.start, reason: `Swapped in: ${item.summary}` } : b));
  return schedule(updated);
}

/** Vendors you'd otherwise contract: one per distinct block in the plan. */
export function vendorCount(p: Programme): number {
  return p.vendors;
}

export const usd = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
