import { NextResponse } from "next/server";
import { requireRole } from "@/lib/session";
import { remainingFor } from "@/lib/limits";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/session: role and remaining plans for the header.
export async function GET() {
  const role = await requireRole();
  if (role instanceof NextResponse) return role;
  return NextResponse.json({ role, remaining: remainingFor(role) });
}
