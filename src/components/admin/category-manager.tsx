import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { FolderKanban, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCategories, usePrompts, type Category } from "@/lib/queries";
import {
  friendlyError,
  moveInList,
  nextSortOrder,
  persistOrder,
  slugify,
  useUnsavedGuard,
  validateSlug,
} from "./use-admin";
import {
  EmptyState,
  Field,
  PrimaryButton,
  ReorderControls,
  SaveBar,
  SectionHeader,
  TextInput,
  useConfirm,
} from "./primitives";

type Draft = { name: string; accent_color: string };

export function CategoryManager() {
  const { data: cats } = useCategories();
  const { data: prompts } = usePrompts();
  const qc = useQueryClient();
  const confirm = useConfirm();

  const ordered = useMemo(
    () => [...(cats ?? [])].sort((a, b) => a.sort_order - b.sort_order),
    [cats],
  );

  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false);
  const [newCat, setNewCat] = useState({ slug: "", name: "", accent_color: "#a78bfa" });

  // Seed drafts from server data. Only reseeds when the underlying rows change.
  useEffect(() => {
    const next: Record<string, Draft> = {};
    ordered.forEach((c) => {
      next[c.id] = { name: c.name, accent_color: c.accent_color ?? "" };
    });
    setDrafts(next);
  }, [ordered]);

  const changed = useMemo(
    () =>
      ordered.filter((c) => {
        const d = drafts[c.id];
        if (!d) return false;
        return d.name !== c.name || d.accent_color !== (c.accent_color ?? "");
      }),
    [ordered, drafts],
  );
  const isDirty = changed.length > 0;
  useUnsavedGuard(isDirty);

  const refresh = () => qc.invalidateQueries({ queryKey: ["categories"] });
  const countFor = (id: string) => (prompts ?? []).filter((p) => p.category_id === id).length;

  const setDraft = (id: string, patch: Partial<Draft>) =>
    setDrafts((d) => ({ ...d, [id]: { ...d[id], ...patch } }));

  const saveAll = async () => {
    const blank = changed.find((c) => !drafts[c.id].name.trim());
    if (blank) {
      toast.error("Category names can't be empty.");
      return;
    }
    setSaving(true);
    const results = await Promise.all(
      changed.map((c) =>
        supabase
          .from("categories")
          .update({
            name: drafts[c.id].name.trim(),
            accent_color: drafts[c.id].accent_color || null,
          })
          .eq("id", c.id),
      ),
    );
    setSaving(false);
    const failed = results.find((r) => r.error);
    if (failed?.error) {
      toast.error(friendlyError(failed.error));
      return;
    }
    toast.success(`Saved ${changed.length} categor${changed.length === 1 ? "y" : "ies"}`);
    refresh();
  };

  const discard = () => {
    const next: Record<string, Draft> = {};
    ordered.forEach((c) => {
      next[c.id] = { name: c.name, accent_color: c.accent_color ?? "" };
    });
    setDrafts(next);
  };

  const add = async () => {
    const slug = slugify(newCat.slug || newCat.name);
    const slugError = validateSlug(slug);
    if (slugError) {
      toast.error(slugError);
      return;
    }
    if (!newCat.name.trim()) {
      toast.error("Display name is required.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("categories").insert({
      slug,
      name: newCat.name.trim(),
      accent_color: newCat.accent_color,
      sort_order: nextSortOrder(ordered),
    });
    setBusy(false);
    if (error) {
      toast.error(friendlyError(error));
      return;
    }
    setNewCat({ slug: "", name: "", accent_color: "#a78bfa" });
    refresh();
    toast.success("Category added");
  };

  const reorder = async (id: string, dir: -1 | 1) => {
    const ids = moveInList(ordered, id, dir);
    if (!ids) return;
    setBusy(true);
    try {
      await persistOrder("categories", ids);
      refresh();
    } catch (e) {
      toast.error(friendlyError(e));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (c: Category) => {
    const n = countFor(c.id);
    const ok = await confirm({
      title: `Delete "${c.name}"?`,
      body: n
        ? `${n} prompt${n === 1 ? "" : "s"} will become uncategorized. This cannot be undone.`
        : "This cannot be undone.",
      confirmLabel: "Delete category",
      destructive: true,
    });
    if (!ok) return;
    const { error } = await supabase.from("categories").delete().eq("id", c.id);
    if (error) {
      toast.error(friendlyError(error));
      return;
    }
    toast.success("Category deleted");
    refresh();
    qc.invalidateQueries({ queryKey: ["prompts"] });
  };

  return (
    <section className="glass-card rounded-3xl p-6">
      <SectionHeader
        title="Categories"
        desc="Style buckets used to group prompts. Order controls how they appear on pack pages."
      />

      <div className="glass mt-6 rounded-2xl p-4">
        <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          New category
        </div>
        <div className="grid gap-3 sm:grid-cols-[1fr_160px_auto]">
          <Field label="Display name">
            <TextInput
              value={newCat.name}
              onChange={(e) => setNewCat({ ...newCat, name: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && add()}
              placeholder="Temporal"
            />
          </Field>
          <Field label="Accent">
            <div className="glass flex items-center gap-2 rounded-xl px-3 py-1.5">
              <input
                type="color"
                value={newCat.accent_color}
                onChange={(e) => setNewCat({ ...newCat, accent_color: e.target.value })}
                className="h-7 w-7 flex-shrink-0 cursor-pointer rounded border-0 bg-transparent"
              />
              <input
                value={newCat.accent_color}
                onChange={(e) => setNewCat({ ...newCat, accent_color: e.target.value })}
                className="w-full bg-transparent py-1 font-mono text-xs outline-none"
              />
            </div>
          </Field>
          <div className="flex items-end">
            <PrimaryButton onClick={add} loading={busy} className="w-full sm:w-auto">
              <Plus className="h-4 w-4" /> Add
            </PrimaryButton>
          </div>
        </div>
        <p className="mt-2 text-xs text-muted-foreground/70">
          Slug is generated from the name: <span className="font-mono">{slugify(newCat.name) || "…"}</span>
        </p>
      </div>

      <div className="mt-4 space-y-2">
        {ordered.length === 0 && (
          <EmptyState
            icon={FolderKanban}
            title="No categories yet"
            desc="Add one above to start grouping prompts."
          />
        )}

        {ordered.map((c, i) => {
          const d = drafts[c.id] ?? { name: c.name, accent_color: c.accent_color ?? "" };
          return (
            <div
              key={c.id}
              className="glass grid items-center gap-3 rounded-2xl p-3 sm:grid-cols-[auto_1fr_170px_auto_auto]"
            >
              <ReorderControls
                onUp={() => reorder(c.id, -1)}
                onDown={() => reorder(c.id, 1)}
                disableUp={i === 0}
                disableDown={i === ordered.length - 1}
                busy={busy}
              />
              <div className="min-w-0">
                <TextInput value={d.name} onChange={(e) => setDraft(c.id, { name: e.target.value })} />
                <div className="mt-1 truncate font-mono text-xs text-muted-foreground">
                  /{c.slug} · {countFor(c.id)} prompts
                </div>
              </div>
              <div className="glass flex items-center gap-2 rounded-xl px-2.5 py-1.5">
                <span
                  className="h-5 w-5 flex-shrink-0 rounded-full ring-1 ring-white/20"
                  style={{ background: d.accent_color || "transparent" }}
                />
                <input
                  value={d.accent_color}
                  onChange={(e) => setDraft(c.id, { accent_color: e.target.value })}
                  className="w-full bg-transparent font-mono text-xs outline-none"
                />
              </div>
              <input
                type="color"
                value={/^#[0-9a-f]{6}$/i.test(d.accent_color) ? d.accent_color : "#a78bfa"}
                onChange={(e) => setDraft(c.id, { accent_color: e.target.value })}
                aria-label={`Accent colour for ${c.name}`}
                className="h-8 w-8 cursor-pointer rounded border-0 bg-transparent"
              />
              <button
                onClick={() => remove(c)}
                aria-label={`Delete ${c.name}`}
                className="justify-self-end text-muted-foreground transition-colors hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>

      <SaveBar
        isDirty={isDirty}
        saving={saving}
        onSave={saveAll}
        onDiscard={discard}
        label={`${changed.length} categor${changed.length === 1 ? "y" : "ies"} changed`}
      />
    </section>
  );
}
