import { cache } from "react";
import { connection } from "next/server";
import { readBetaTable } from "./beta-content";
import { createPublicClient } from "./supabase";

export function emailAccessRequired(value: unknown) {
  return (
    !value || typeof value !== "object" || (value as { required?: unknown }).required !== false
  );
}

export const isEmailAccessRequired = cache(async () => {
  await connection();
  try {
    const rows = await readBetaTable("site_content");
    if (rows !== null)
      return emailAccessRequired(rows.find((row) => row.key === "email_access")?.value);
    const { data, error } = await createPublicClient()
      .from("site_content")
      .select("value")
      .eq("key", "email_access")
      .maybeSingle();
    return error ? true : emailAccessRequired(data?.value);
  } catch {
    return true;
  }
});
