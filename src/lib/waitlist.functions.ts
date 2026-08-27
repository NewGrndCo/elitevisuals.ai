import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const joinWaitlist = createServerFn({ method: "POST" })
  .inputValidator((input: { name: string; email: string; interests: string; website?: string }) => {
    const name = input.name.trim().slice(0, 100);
    const email = input.email.trim().toLowerCase().slice(0, 320);
    const interests = input.interests.trim().slice(0, 1000);
    if (input.website) throw new Error("Unable to submit this form");
    if (!EMAIL_RE.test(email)) throw new Error("Enter a valid email address");
    return { name, email, interests };
  })
  .handler(async ({ data }) => {
    const db = supabaseAdmin as unknown as {
      from: (table: string) => {
        upsert: (
          row: Record<string, string>,
          options: { onConflict: string },
        ) => Promise<{ error: { message: string } | null }>;
      };
    };
    const { error } = await db
      .from("waitlist_signups")
      .upsert({ ...data, source: "website" }, { onConflict: "email" });
    if (error) throw new Error("We couldn't add you right now. Please try again.");
    return { ok: true };
  });
