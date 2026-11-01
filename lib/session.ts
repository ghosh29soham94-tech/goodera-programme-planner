import "server-only";
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { Role } from "@/lib/types";

export const SESSION_COOKIE = "gpp_session";
export const SESSION_MAX_AGE = 60 * 60 * 12; // 12 hours

function secret(): string | null {
  const s = process.env.SESSION_SECRET;
  return s && s.length >= 16 ? s : null;
}

function hmac(payload: string, key: string): string {
  return crypto.createHmac("sha256", key).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  // Hash first so lengths always match for timingSafeEqual.
  const ha = crypto.createHash("sha256").update(a).digest();
  const hb = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}

export function isConfigured(): boolean {
  return secret() !== null && Boolean(process.env.OWNER_CODE || process.env.EVALUATOR_CODE);
}

/** Returns the role for a submitted access code, or null. */
export function roleForCode(code: string): Role | null {
  const c = code.trim();
  if (!c) return null;
  const owner = process.env.OWNER_CODE?.trim();
  const evaluator = process.env.EVALUATOR_CODE?.trim();
  // Evaluate both comparisons so timing doesn't reveal which code matched.
  const isOwner = owner ? safeEqual(c, owner) : false;
  const isEvaluator = evaluator ? safeEqual(c, evaluator) : false;
  if (isOwner) return "owner";
  if (isEvaluator) return "evaluator";
  return null;
}

export function signSession(role: Role): string {
  const key = secret();
  if (!key) throw new Error("SESSION_SECRET is missing or shorter than 16 characters");
  const payload = `${role}.${Date.now()}`;
  return `${payload}.${hmac(payload, key)}`;
}

export function verifySession(token: string | undefined): Role | null {
  const key = secret();
  if (!key || !token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [role, issued, sig] = parts;
  if (role !== "owner" && role !== "evaluator") return null;
  if (!safeEqual(sig, hmac(`${role}.${issued}`, key))) return null;
  const age = Date.now() - Number(issued);
  if (!Number.isFinite(age) || age < 0 || age > SESSION_MAX_AGE * 1000) return null;
  return role;
}

/** Role from the request cookie (server components and route handlers). */
export async function getRole(): Promise<Role | null> {
  const store = await cookies();
  return verifySession(store.get(SESSION_COOKIE)?.value);
}

/** For API routes: returns the role, or a 401 response to return directly. */
export async function requireRole(): Promise<Role | NextResponse> {
  const role = await getRole();
  if (!role) {
    return NextResponse.json({ error: "Your session has ended. Please enter your access code again." }, { status: 401 });
  }
  return role;
}

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "local";
}
