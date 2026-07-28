import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";

/**
 * Admin PIN gate.
 *
 * A correct PIN mints a real Supabase session for the admin user, so this
 * endpoint is the entire security boundary for the CMS. It was previously
 * unauthenticated, unthrottled, and compared against a PIN hardcoded in the
 * repo — roughly 10,000 guesses to full admin.
 *
 * Now:
 *   - the PIN comes from the ADMIN_PIN env var (fails closed if unset)
 *   - comparison is constant-time
 *   - attempts are throttled per-IP and globally, tracked in Postgres
 *
 * Required env: ADMIN_PIN — 4 to 10 digits.
 */

const MIN_PIN_LENGTH = 4;
const MAX_PIN_LENGTH = 10;
const PIN_RE = new RegExp(`^\\d{${MIN_PIN_LENGTH},${MAX_PIN_LENGTH}}$`);

/**
 * Per-IP allowance. The global ceiling is deliberately much higher so a
 * distributed attack still trips it, while a single attacker can't lock the
 * real admin out by burning the global budget.
 */
const MAX_ATTEMPTS_PER_IP = 5;
const MAX_ATTEMPTS_GLOBAL = 50;

/**
 * Length-independent equality. Avoids leaking the PIN length or a correct
 * prefix through response timing.
 */
function timingSafeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const ab = enc.encode(a);
  const bb = enc.encode(b);
  let diff = ab.length ^ bb.length;
  const len = Math.max(ab.length, bb.length);
  for (let i = 0; i < len; i++) {
    diff |= (ab[i] ?? 0) ^ (bb[i] ?? 0);
  }
  return diff === 0;
}

function clientKey(): string {
  // Cloudflare sets cf-connecting-ip; fall back to the first x-forwarded-for
  // hop. Both are spoofable in principle, which is why the global counter
  // exists as a backstop.
  const ip =
    getRequestHeader("cf-connecting-ip") ??
    getRequestHeader("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";
  return `ip:${ip.slice(0, 64)}`;
}

function formatRetry(seconds: number): string {
  if (seconds < 60) return `${seconds} seconds`;
  const mins = Math.ceil(seconds / 60);
  return `${mins} minute${mins === 1 ? "" : "s"}`;
}

export const adminPinLogin = createServerFn({ method: "POST" })
  .inputValidator((d: { pin: string }) => {
    if (typeof d?.pin !== "string" || !PIN_RE.test(d.pin)) {
      throw new Error(`PIN must be ${MIN_PIN_LENGTH}-${MAX_PIN_LENGTH} digits`);
    }
    return d;
  })
  .handler(async ({ data }) => {
    const expectedPin = process.env.ADMIN_PIN;
    if (!expectedPin || !PIN_RE.test(expectedPin)) {
      // Fail closed — never fall back to a baked-in default.
      console.error(
        JSON.stringify({
          event: "admin_pin_misconfigured",
          reason: expectedPin ? "ADMIN_PIN must be 4-10 digits" : "ADMIN_PIN not set",
        }),
      );
      throw new Error("Admin access is not configured.");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const rpc = supabaseAdmin.rpc as unknown as (
      fn: string,
      args: Record<string, unknown>,
    ) => Promise<{ data: unknown; error: unknown }>;

    const key = clientKey();

    const precheck = async (k: string): Promise<number> => {
      const { data: secs, error } = await rpc("admin_login_precheck", { _key: k });
      if (error) throw error;
      return typeof secs === "number" ? secs : 0;
    };
    const record = async (k: string, success: boolean, max: number): Promise<void> => {
      const { error } = await rpc("admin_login_record", {
        _key: k,
        _success: success,
        _max_attempts: max,
      });
      if (error) throw error;
    };

    const [ipLock, globalLock] = await Promise.all([precheck(key), precheck("global")]);
    const lock = Math.max(ipLock, globalLock);
    if (lock > 0) {
      throw new Error(`Too many attempts. Try again in ${formatRetry(lock)}.`);
    }

    if (!timingSafeEqual(data.pin, expectedPin)) {
      await Promise.all([
        record(key, false, MAX_ATTEMPTS_PER_IP),
        record("global", false, MAX_ATTEMPTS_GLOBAL),
      ]);
      console.warn(JSON.stringify({ event: "admin_pin_failed", key }));
      throw new Error("Incorrect PIN");
    }

    // Correct PIN — clear the counters before minting a session.
    await Promise.all([
      record(key, true, MAX_ATTEMPTS_PER_IP),
      record("global", true, MAX_ATTEMPTS_GLOBAL),
    ]);

    const { data: roleRow, error: roleErr } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin")
      .limit(1)
      .maybeSingle();
    if (roleErr) throw roleErr;
    if (!roleRow?.user_id) throw new Error("No admin user is configured yet");

    const { data: userRes, error: userErr } = await supabaseAdmin.auth.admin.getUserById(
      roleRow.user_id,
    );
    if (userErr) throw userErr;
    const email = userRes.user?.email;
    if (!email) throw new Error("Admin user has no email");

    const { data: link, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email,
    });
    if (linkErr) throw linkErr;

    const token_hash = (link as { properties?: { hashed_token?: string } }).properties?.hashed_token;
    if (!token_hash) throw new Error("Failed to mint session token");

    console.info(JSON.stringify({ event: "admin_pin_success", key }));
    return { token_hash, email };
  });
