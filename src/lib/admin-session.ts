import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";

export const WECHU_ADMIN_COOKIE = "wechu_admin_sess";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function adminPassword(): string {
  const v = process.env.WECHU_ADMIN_PASSWORD?.trim();
  return v && v.length ? v : "1212";
}

function adminSecret(): string {
  const v = process.env.WECHU_ADMIN_SECRET?.trim();
  return v && v.length ? v : "wechu-admin-session-dev";
}

function timingSafeUtf8Eq(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  try {
    return timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

export function validateAdminPassword(input: string): boolean {
  return timingSafeUtf8Eq(input, adminPassword());
}

export function mintAdminCookieValue(): string {
  const expMs = Date.now() + WEEK_MS;
  const payload = String(expMs);
  const sig = createHmac("sha256", adminSecret())
    .update(payload)
    .digest("base64url");
  return `${payload}.${sig}`;
}

function verifyAdminCookieRaw(raw: string | undefined): boolean {
  if (!raw) return false;
  const i = raw.indexOf(".");
  if (i <= 0) return false;
  const payload = raw.slice(0, i);
  const sig = raw.slice(i + 1);
  const expMs = Number(payload);
  if (!Number.isFinite(expMs) || Date.now() > expMs) return false;
  const expected = createHmac("sha256", adminSecret())
    .update(payload)
    .digest("base64url");
  return timingSafeUtf8Eq(sig, expected);
}

export async function readAdminSession(): Promise<boolean> {
  return verifyAdminCookieRaw(
    (await cookies()).get(WECHU_ADMIN_COOKIE)?.value ?? undefined,
  );
}
