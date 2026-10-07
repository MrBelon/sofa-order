import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  checkPassword,
  createSessionToken,
  sessionCookieOptions,
} from "@/lib/admin-auth";
import { jsonError, parseBody } from "@/lib/api";
import { loginSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

// Basic in-memory brute-force protection (single instance is enough here).
const MAX_FAILURES = 5;
const WINDOW_MS = 60_000;
const failures = new Map<string, { count: number; resetAt: number }>();

function clientKey(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

export async function POST(request: Request) {
  const key = clientKey(request);
  const now = Date.now();
  const entry = failures.get(key);
  if (entry && entry.resetAt > now && entry.count >= MAX_FAILURES) {
    return jsonError("Trop de tentatives, réessaie dans une minute.", 429);
  }

  const { data, error } = await parseBody(request, loginSchema);
  if (error) return error;

  if (!process.env.ADMIN_PASSWORD) {
    return jsonError("ADMIN_PASSWORD n'est pas configuré", 500);
  }

  if (!checkPassword(data.password)) {
    failures.set(key, {
      count: entry && entry.resetAt > now ? entry.count + 1 : 1,
      resetAt: entry && entry.resetAt > now ? entry.resetAt : now + WINDOW_MS,
    });
    return jsonError("Mot de passe incorrect", 401);
  }

  failures.delete(key);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, createSessionToken(), sessionCookieOptions);
  return response;
}
