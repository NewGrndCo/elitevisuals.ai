import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createPublicClient } from "./supabase";
import { safeDestination } from "./content-policy";

export const MEMBER_COOKIE = "ev_member";

// Never trust a cookie/session claim without verifying it with Supabase Auth.
export const getVerifiedMember = cache(async () => {
  const token = (await cookies()).get(MEMBER_COOKIE)?.value;
  if (!token) return null;
  try {
    const { data, error } = await createPublicClient().auth.getUser(token);
    return error || data.user?.is_anonymous ? null : data.user;
  } catch {
    return null;
  }
});

export async function requireMember(destination: string) {
  const user = await getVerifiedMember();
  if (!user) redirect(`/login?next=${encodeURIComponent(safeDestination(destination))}`);
  return user;
}
