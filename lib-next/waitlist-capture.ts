import { ContentConflict, mutateBetaTable, type ContentRow } from "./beta-content";

type WaitlistEvent = { email: string; name: string; interests: string; source: string };

export async function captureWaitlist(event: WaitlistEvent) {
  const email = event.email.trim().toLowerCase();
  if (email.length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw new Error("Enter a valid email address.");
  for (let attempt = 0; attempt < 3; attempt++) {
    let existing = false;
    try {
      await mutateBetaTable("waitlist_signups", (rows: ContentRow[]) => {
        existing = rows.some((row) => String(row.email).trim().toLowerCase() === email);
        if (existing) return rows;
        const now = new Date().toISOString();
        return [
          { ...event, email, id: crypto.randomUUID(), created_at: now, updated_at: now },
          ...rows,
        ];
      });
      return { existing };
    } catch (error) {
      if (!(error instanceof ContentConflict) || attempt === 2) throw error;
    }
  }
  throw new Error("Unable to join right now.");
}
