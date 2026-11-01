import { NextResponse } from "next/server";
import { requireRole } from "@/lib/session";
import { blockedReason, recordSpend, remainingFor } from "@/lib/limits";
import { cacheKey, getCached, setCached } from "@/lib/cache";
import { askClaude, hasApiKey } from "@/lib/claude";
import { AiPlanSchema, PlanRequestSchema } from "@/lib/schema";
import { finalisePlan } from "@/lib/programme";
import { SAMPLE_PLANS, closestSampleId, findExample } from "@/data/samples";
import type { PlanResponse, PlanResult, PlanSource, Role } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function reply(role: Role, plan: PlanResult, source: PlanSource, fallbackReason: string | null = null) {
  const body: PlanResponse = { plan, source, fallbackReason, remaining: remainingFor(role) };
  return NextResponse.json(body);
}

const hasPickers = (p: Record<string, unknown>) => Object.values(p).some((v) => v !== null && v !== undefined && v !== "");

// POST /api/plan: the only route that can call Claude.
export async function POST(req: Request) {
  const role = await requireRole();
  if (role instanceof NextResponse) return role;

  const parsed = PlanRequestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please write a brief of 20 to 600 characters, and keep group size between 5 and 5,000." },
      { status: 400 },
    );
  }
  const { brief, pickers, regenerate } = parsed.data;
  const fallback = (reason: string) => reply(role, SAMPLE_PLANS[closestSampleId(brief)], "fallback", reason);

  // 1. Example briefs are pre-built. Never call the API.
  const example = findExample(brief);
  if (example && !hasPickers(pickers) && !regenerate) return reply(role, SAMPLE_PLANS[example.id], "example");

  // 2. Cache (skipped on Regenerate, which is an explicit request for a new plan).
  const key = cacheKey(brief, pickers);
  if (!regenerate) {
    const hit = getCached(key);
    if (hit) return reply(role, hit, "cache");
  }

  // 3. Limits and configuration.
  const blocked = blockedReason(role);
  if (blocked) return fallback(blocked);
  if (!hasApiKey()) return fallback("The AI planner isn't configured on this server.");

  // 4. One call. Count it before sending so parallel requests can't overspend.
  recordSpend(role);
  let raw: unknown;
  try {
    raw = await askClaude(brief, pickers);
  } catch (err) {
    const timedOut = err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError" || /timed? ?out/i.test(err.message));
    console.error("[plan] AI call failed:", err instanceof Error ? `${err.name}: ${err.message}` : err);
    return fallback(timedOut ? "The planner took too long to answer." : "The planner couldn't build a plan just now.");
  }

  // 5. Validate. Unknown catalogue ids, missing fields or wrong types → reject.
  const result = AiPlanSchema.safeParse(raw);
  if (!result.success) {
    console.error("[plan] invalid AI output:", result.error.issues.slice(0, 3));
    return fallback("The planner's answer didn't pass our checks.");
  }
  const plan = finalisePlan(result.data, pickers, brief);
  if (plan.status === "ok" && plan.blocks.length === 0) return fallback("The planner didn't pick any activities.");

  setCached(key, plan);
  return reply(role, plan, "ai");
}
