import { NextResponse } from "next/server";
import { z } from "zod";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  clientIp,
  isConfigured,
  roleForCode,
  signSession,
} from "@/lib/session";
import { lockRemaining, recordFailure, recordSuccess } from "@/lib/loginLimiter";

export const runtime = "nodejs";

const Body = z.object({ code: z.string().max(200) });

// POST /api/access: the only API route that doesn't need a session cookie.
export async function POST(req: Request) {
  if (!isConfigured()) {
    return NextResponse.json({ error: "This demo isn't configured yet (missing access codes or SESSION_SECRET)." }, { status: 500 });
  }

  const ip = clientIp(req);
  const locked = lockRemaining(ip);
  if (locked > 0) {
    const minutes = Math.ceil(locked / 60000);
    return NextResponse.json(
      { error: `Too many tries. Please wait ${minutes} minute${minutes === 1 ? "" : "s"} and try again.`, retryAfterSec: Math.ceil(locked / 1000) },
      { status: 429 },
    );
  }

  const parsed = Body.safeParse(await req.json().catch(() => null));
  const role = parsed.success ? roleForCode(parsed.data.code) : null;

  if (!role) {
    const left = recordFailure(ip);
    if (left === 0) {
      return NextResponse.json({ error: "Too many tries. Please wait 10 minutes and try again.", retryAfterSec: 600 }, { status: 429 });
    }
    return NextResponse.json(
      { error: `That code didn't work. Check for typos and try again (${left} ${left === 1 ? "try" : "tries"} left).` },
      { status: 401 },
    );
  }

  recordSuccess(ip);
  const res = NextResponse.json({ role });
  res.cookies.set(SESSION_COOKIE, signSession(role), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return res;
}

// DELETE /api/access: sign out.
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
