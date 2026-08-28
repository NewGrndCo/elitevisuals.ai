import { createHmac, timingSafeEqual } from "crypto";
import { createClient } from "@supabase/supabase-js";

const COOKIE_TTL = 60 * 60 * 8;

function secret() {
  const strong = process.env.ADMIN_SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (strong) return strong;
  return process.env.ADMIN_PIN || "elitevisuals-beta-session-v1";
}

export function createAdminToken() {
  if (!secret()) throw new Error("ADMIN_SESSION_SECRET is required in production.");
  const expires = Math.floor(Date.now() / 1000) + COOKIE_TTL;
  const payload = `elite-admin:${expires}`;
  const signature = createHmac("sha256", secret()).update(payload).digest("hex");
  return { token: `${expires}.${signature}`, maxAge: COOKIE_TTL };
}

export function verifyAdminToken(token?: string) {
  if (!token || !secret()) return false;
  const [expiresRaw, signature = ""] = token.split(".");
  const expires = Number(expiresRaw);
  if (!Number.isFinite(expires) || expires < Date.now() / 1000) return false;
  const expected = createHmac("sha256", secret()).update(`elite-admin:${expires}`).digest("hex");
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function createAdminClient() {
  const url =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for admin data access.");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
