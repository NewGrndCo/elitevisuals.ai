import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/* ────────────────────────── dirty-form tracking ──────────────────────────
 * Every editor in the admin uses this. One save model: you edit, the Save
 * bar appears, nothing is written until you press Save. Replaces the old
 * split where some tabs saved silently on blur and others needed a button.
 * Mount editors with `key={row.id}` so switching rows remounts cleanly.
 */
export function useDirtyForm<T extends object>(initial: T) {
  const [form, setForm] = useState<T>(initial);
  const [baseline, setBaseline] = useState<T>(initial);

  const isDirty = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(baseline),
    [form, baseline],
  );

  const patch = useCallback((p: Partial<T>) => setForm((f) => ({ ...f, ...p })), []);
  /** Call after a successful save so the form is no longer "dirty". */
  const commit = useCallback((next?: T) => {
    setForm((f) => {
      const v = next ?? f;
      setBaseline(v);
      return v;
    });
  }, []);
  const reset = useCallback(() => setForm(baseline), [baseline]);

  return { form, setForm, patch, isDirty, commit, reset };
}

/** Warns on browser close/reload while edits are pending. */
export function useUnsavedGuard(isDirty: boolean) {
  useEffect(() => {
    if (!isDirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty]);
}

/* ────────────────────────────── slugs ────────────────────────────── */

export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function validateSlug(slug: string): string | null {
  if (!slug.trim()) return "Slug is required.";
  if (!SLUG_RE.test(slug)) {
    return "Use lowercase letters, numbers and single hyphens (e.g. kinetic-v1).";
  }
  return null;
}

/**
 * Turns raw Postgres errors into something a human can act on. The old admin
 * piped `error.message` straight into a toast, so a duplicate slug surfaced as
 * 'duplicate key value violates unique constraint "packs_slug_key"'.
 */
export function friendlyError(error: unknown): string {
  const err = error as { code?: string; message?: string } | null;
  if (!err) return "Something went wrong.";
  if (err.code === "23505") {
    if (err.message?.includes("slug")) return "That slug is already taken. Pick another.";
    if (err.message?.includes("email")) return "That email is already on the list.";
    return "That value must be unique — something already uses it.";
  }
  if (err.code === "23503") return "Can't do that: another record still references this one.";
  if (err.code === "42501" || err.code === "PGRST301") {
    return "Your admin session expired. Lock and re-enter your PIN.";
  }
  return err.message ?? "Something went wrong.";
}

/* ─────────────────────────── ordering ───────────────────────────
 * Old admin used `list.length + 1` for new rows, so deleting one and adding
 * another produced duplicate sort_order values and nondeterministic ordering.
 */
export function nextSortOrder(rows: { sort_order: number }[] | undefined): number {
  if (!rows || rows.length === 0) return 1;
  return Math.max(...rows.map((r) => r.sort_order ?? 0)) + 1;
}

export type ReorderTable = "packs" | "prompts" | "categories" | "ai_logos";

const REORDER_RPC: Record<ReorderTable, string> = {
  packs: "reorder_packs",
  prompts: "reorder_prompts",
  categories: "reorder_categories",
  ai_logos: "reorder_ai_logos",
};

/**
 * Atomic reorder. The old implementation fired two independent UPDATEs to swap
 * a pair — a partial failure left the list corrupted. This sends the whole
 * ordering as one statement server-side.
 */
export async function persistOrder(table: ReorderTable, ids: string[]): Promise<void> {
  // src/integrations/supabase/types.ts is generated and doesn't yet know about
  // the reorder_* functions added in 20260728224500_admin_reorder_functions.sql.
  // Regenerate the types to remove this cast.
  const rpc = supabase.rpc as unknown as (
    fn: string,
    args: Record<string, unknown>,
  ) => Promise<{ error: unknown }>;
  const { error } = await rpc(REORDER_RPC[table], { _ids: ids });
  if (error) throw error;
}

/** Moves an item within a list and returns the new id order. */
export function moveInList<T extends { id: string }>(
  rows: T[],
  id: string,
  dir: -1 | 1,
): string[] | null {
  const idx = rows.findIndex((r) => r.id === id);
  const target = idx + dir;
  if (idx < 0 || target < 0 || target >= rows.length) return null;
  const next = [...rows];
  [next[idx], next[target]] = [next[target], next[idx]];
  return next.map((r) => r.id);
}

/* ─────────────────────────── storage ─────────────────────────── */

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

/**
 * Uploads and returns a public URL. The old code passed `upsert: true` with a
 * `Date.now()` path, so it never actually upserted — it just accumulated
 * orphans. Paths are deterministic per field now, so re-uploading replaces.
 */
export async function uploadMedia(
  file: File,
  pathPrefix: string,
): Promise<{ url: string } | { error: string }> {
  if (file.size > MAX_UPLOAD_BYTES) {
    return { error: `That file is ${(file.size / 1024 / 1024).toFixed(1)}MB — the limit is 25MB.` };
  }
  const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
  const path = `${pathPrefix}.${ext}`;

  const { error } = await supabase.storage
    .from("elite-media")
    .upload(path, file, { upsert: true, cacheControl: "3600" });
  if (error) return { error: friendlyError(error) };

  const { data } = supabase.storage.from("elite-media").getPublicUrl(path);
  // Cache-bust so a replaced image shows immediately instead of the stale one.
  return { url: `${data.publicUrl}?v=${Date.now()}` };
}
