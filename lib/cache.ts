import "server-only";
import crypto from "node:crypto";
import { normaliseBrief } from "@/data/samples";
import { readJson, writeJson } from "@/lib/store";
import type { Pickers, PlanResult } from "@/lib/types";

const FILE = "cache.json";
const MAX_ENTRIES = 500;

let cache: Map<string, PlanResult> | null = null;

function load(): Map<string, PlanResult> {
  cache ??= new Map(Object.entries(readJson<Record<string, PlanResult>>(FILE, {})));
  return cache;
}

/** Hash of the normalised brief plus picker values (empty values dropped, keys sorted). */
export function cacheKey(brief: string, pickers: Pickers): string {
  const clean = Object.fromEntries(
    Object.entries(pickers)
      .filter(([, v]) => v !== null && v !== undefined && v !== "")
      .map(([k, v]) => [k, typeof v === "string" ? v.trim().toLowerCase() : v])
      .sort(([a], [b]) => a.localeCompare(b)),
  );
  return crypto.createHash("sha256").update(JSON.stringify({ b: normaliseBrief(brief), p: clean })).digest("hex");
}

export function getCached(key: string): PlanResult | undefined {
  return load().get(key);
}

export function setCached(key: string, plan: PlanResult): void {
  const c = load();
  c.delete(key);
  c.set(key, plan);
  while (c.size > MAX_ENTRIES) c.delete(c.keys().next().value as string);
  writeJson(FILE, Object.fromEntries(c));
}
