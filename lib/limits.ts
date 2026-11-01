import "server-only";
import type { Role } from "@/lib/types";
import { readJson, writeJson } from "@/lib/store";

const FILE = "counters.json";

interface Counters {
  day: string; // UTC yyyy-mm-dd
  globalToday: number;
  evaluatorTotal: number; // not reset daily
}

function envInt(name: string, fallback: number): number {
  const n = Number.parseInt(process.env[name] ?? "", 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

const evaluatorLimit = () => envInt("EVALUATOR_PLAN_LIMIT", 5);
const dailyLimit = () => envInt("DAILY_PLAN_LIMIT", 50);
const today = () => new Date().toISOString().slice(0, 10);

let counters: Counters | null = null;

function load(): Counters {
  if (!counters) counters = readJson<Counters>(FILE, { day: today(), globalToday: 0, evaluatorTotal: 0 });
  if (counters.day !== today()) {
    counters = { ...counters, day: today(), globalToday: 0 };
    writeJson(FILE, counters);
  }
  return counters;
}

/** Plans left for this role (evaluator is also capped by the global daily limit). null = owner. */
export function remainingFor(role: Role): number | null {
  const c = load();
  const global = Math.max(0, dailyLimit() - c.globalToday);
  if (role === "owner") return null;
  return Math.min(global, Math.max(0, evaluatorLimit() - c.evaluatorTotal));
}

/** null if allowed, otherwise a human reason. */
export function blockedReason(role: Role): string | null {
  const c = load();
  if (c.globalToday >= dailyLimit()) return "The daily plan limit for this demo has been reached.";
  if (role === "evaluator" && c.evaluatorTotal >= evaluatorLimit()) return "You have used all your plans for this demo.";
  return null;
}

/** Call only after a real API call was made. */
export function recordSpend(role: Role): void {
  const c = load();
  c.globalToday += 1;
  if (role === "evaluator") c.evaluatorTotal += 1;
  writeJson(FILE, c);
}
