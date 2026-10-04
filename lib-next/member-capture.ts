import { ContentConflict, mutateBetaTable, type ContentRow } from "./beta-content";

type MemberEvent = { email: string; userId?: string; signedInAt?: string };

// Only the verified Auth user supplies identity to sign-in capture. Request-only
// records are retained separately as pending, never labeled authenticated.
export function mergeMember(
  rows: ContentRow[],
  event: MemberEvent,
  now = new Date().toISOString(),
) {
  const email = event.email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 320)
    throw new Error("An email address is required for member access.");
  const matches = (row: ContentRow) =>
    String(row.email || "")
      .trim()
      .toLowerCase() === email || Boolean(event.userId && row.auth_user_id === event.userId);
  const existing = rows.filter(matches);
  const base =
    existing.find((row) => event.userId && row.auth_user_id === event.userId) ?? existing[0] ?? {};
  const userId = event.userId || existing.find((row) => row.auth_user_id)?.auth_user_id;
  const signedInAt = [event.signedInAt, ...existing.map((row) => row.last_signed_in_at)]
    .filter((date): date is string => typeof date === "string" && Number.isFinite(Date.parse(date)))
    .sort((a, b) => Date.parse(b) - Date.parse(a))[0];
  const member = {
    ...base,
    id: base.id || crypto.randomUUID(),
    email,
    created_at: base.created_at || now,
    updated_at: now,
    source: base.source || (event.userId ? "verified-sign-in" : "member-access"),
    status: signedInAt ? "Signed in" : "Link requested",
    ...(userId ? { auth_user_id: userId } : {}),
    ...(signedInAt ? { last_signed_in_at: signedInAt } : {}),
  };
  return [member, ...rows.filter((row) => !matches(row))];
}

export async function captureMember(event: MemberEvent) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await mutateBetaTable("member_signups", (rows) => mergeMember(rows, event));
    } catch (error) {
      if (!(error instanceof ContentConflict) || attempt === 2) throw error;
    }
  }
}
