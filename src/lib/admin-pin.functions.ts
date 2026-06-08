import { createServerFn } from "@tanstack/react-start";

const ADMIN_PIN = "0671";

/**
 * Verifies a 4-digit PIN. On success, generates a magic-link token for the
 * first admin user and returns the hashed token so the client can establish
 * a real Supabase session (verifyOtp). All RLS-protected admin mutations
 * then work as the admin user.
 */
export const adminPinLogin = createServerFn({ method: "POST" })
  .inputValidator((d: { pin: string }) => {
    if (typeof d?.pin !== "string" || !/^\d{4}$/.test(d.pin)) {
      throw new Error("PIN must be 4 digits");
    }
    return d;
  })
  .handler(async ({ data }) => {
    if (data.pin !== ADMIN_PIN) {
      throw new Error("Incorrect PIN");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Pick the first admin user via the user_roles table.
    const { data: roleRow, error: roleErr } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin")
      .limit(1)
      .maybeSingle();
    if (roleErr) throw roleErr;
    if (!roleRow?.user_id) throw new Error("No admin user is configured yet");

    const { data: userRes, error: userErr } =
      await supabaseAdmin.auth.admin.getUserById(roleRow.user_id);
    if (userErr) throw userErr;
    const email = userRes.user?.email;
    if (!email) throw new Error("Admin user has no email");

    const { data: link, error: linkErr } =
      await supabaseAdmin.auth.admin.generateLink({ type: "magiclink", email });
    if (linkErr) throw linkErr;

    const token_hash = (link as { properties?: { hashed_token?: string } }).properties
      ?.hashed_token;
    if (!token_hash) throw new Error("Failed to mint session token");

    return { token_hash, email };
  });
