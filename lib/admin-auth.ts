import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 12;

function getPassword(): string | null {
  return process.env.ADMIN_PASSWORD || null;
}

function sign(payload: string, password: string): string {
  return createHmac("sha256", password).update(payload).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export function checkPassword(candidate: string): boolean {
  const password = getPassword();
  return password !== null && safeEqual(candidate, password);
}

// Stateless session: "<expiry>.<hmac(expiry)>", keyed by the admin password.
export function createSessionToken(): string {
  const password = getPassword();
  if (!password) throw new Error("ADMIN_PASSWORD is not set");
  const expires = String(Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS);
  return `${expires}.${sign(expires, password)}`;
}

function verifySessionToken(token: string | undefined): boolean {
  const password = getPassword();
  if (!password || !token) return false;
  const [expires, signature] = token.split(".");
  if (!expires || !signature) return false;
  if (!safeEqual(signature, sign(expires, password))) return false;
  return Number(expires) > Date.now() / 1000;
}

export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  return verifySessionToken(store.get(ADMIN_COOKIE)?.value);
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_TTL_SECONDS,
};
