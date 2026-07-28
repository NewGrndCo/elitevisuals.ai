import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, ExternalLink, Package, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { usePacks, usePrompts, type Pack } from "@/lib/queries";
import {
  friendlyError,
  moveInList,
  nextSortOrder,
  persistOrder,
  slugify,
  useDirtyForm,
  useUnsavedGuard,
  validateSlug,
} from "./use-admin";
import {
  EmptyState,
  Field,
  GhostButton,
  MediaField,
  PrimaryButton,
  PublishToggle,
  ReorderControls,
  SaveBar,
  SectionHeader,
  SelectInput,
  StatusPill,
  TextArea,
  TextInput,
  useConfirm,
} from "./primitives";

const PACK_SECTIONS = [
  { key: "hero", label: "Hero", desc: "Cover image, title and description" },
  { key: "prompts", label: "Prompts grid", desc: "All prompts grouped by category" },
  { key: "how_to", label: "How to use", desc: "Three-step usage guide" },
];

export function PackManager() {
  const { data: packs } = usePacks(true);
  const { data: prompts } = usePrompts();
  const qc = useQueryClient();
  const confirm = useConfirm();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const ordered = useMemo(
    () => [...(packs ?? [])].sort((a, b) => a.sort_order - b.sort_order),
    [packs],
  );
  const selected = ordered.find((p) => p.id === selectedId) ?? null;

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["packs"] });
    qc.invalidateQueries({ queryKey: ["prompts"] });
  };

  const countFor = (id: string) => (prompts ?? []).filter((p) => p.pack_id === id).length;

  const create = async () => {
    setBusy(true);
    const { data, error } = await supabase
      .from("packs")
      .insert({
        slug: `new-pack-${Date.now().toString(36)}`,
        title: "New Pack",
        description: "",
        sort_order: nextSortOrder(ordered),
        is_published: false,
      })
      .select("id")
      .maybeSingle();
    setBusy(false);
    if (error) {
      toast.error(friendlyError(error));
      return;
    }
    refresh();
    toast.success("Draft pack created");
    if (data?.id) setSelectedId(data.id);
  };

  const reorder = async (id: string, dir: -1 | 1) => {
    const ids = moveInList(ordered, id, dir);
    if (!ids) return;
    setBusy(true);
    try {
      await persistOrder("packs", ids);
      refresh();
    } catch (e) {
      toast.error(friendlyError(e));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (pack: Pack) => {
    const ok = await confirm({
      title: `Delete "${pack.title}"?`,
      body: "Prompts in this pack become unassigned. This cannot be undone.",
      confirmLabel: "Delete pack",
      destructive: true,
    });
    if (!ok) return;
    const { error } = await supabase.from("packs").delete().eq("id", pack.id);
    if (error) {
      toast.error(friendlyError(error));
      return;
    }
    toast.success("Pack deleted");
    setSelectedId(null);
    refresh();
  };

  if (selected) {
    return (
      <PackEditor
        key={selected.id}
        pack={selected}
        promptCount={countFor(selected.id)}
        onBack={() => setSelectedId(null)}
        onDelete={() => remove(selected)}
        onSaved={refresh}
      />
    );
  }

  return (
    <section className="glass-card rounded-3xl p-6">
      <SectionHeader
        title="Prompt Packs"
        desc="Each pack is a card on the library page. Order here controls order there."
        actions={
          <PrimaryButton onClick={create} loading={busy}>
            <Plus className="h-4 w-4" /> New pack
          </PrimaryButton>
        }
      />

      <div className="mt-6 space-y-2">
        {ordered.length === 0 && (
          <EmptyState
            icon={Package}
            title="No packs yet"
            desc="Create your first pack to start publishing prompts."
            action={
              <PrimaryButton onClick={create} loading={busy}>
                <Plus className="h-4 w-4" /> New pack
              </PrimaryButton>
            }
          />
        )}

        {ordered.map((p, i) => (
          <div key={p.id} className="glass flex items-center gap-3 rounded-2xl p-3">
            <ReorderControls
              onUp={() => reorder(p.id, -1)}
              onDown={() => reorder(p.id, 1)}
              disableUp={i === 0}
              disableDown={i === ordered.length - 1}
              busy={busy}
            />
            <button
              onClick={() => setSelectedId(p.id)}
              className="flex min-w-0 flex-1 items-center gap-3 text-left"
            >
              <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-white/5">
                {p.cover_image_url && (
                  <img src={p.cover_image_url} alt="" className="h-full w-full object-cover" />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-semibold">{p.title}</span>
                  <StatusPill published={p.is_published} />
                </div>
                <div className="truncate text-xs text-muted-foreground">
                  <span className="font-mono">/{p.slug}</span> · {countFor(p.id)} prompts
                </div>
              </div>
            </button>
            <a
              href={`/pack/${p.slug}`}
              target="_blank"
              rel="noreferrer"
              aria-label={`Preview ${p.title}`}
              className="flex-shrink-0 text-muted-foreground hover:text-foreground"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
            <GhostButton onClick={() => setSelectedId(p.id)} className="flex-shrink-0">
              Edit
            </GhostButton>
          </div>
        ))}
      </div>
    </section>
  );
}

type PackForm = {
  title: string;
  slug: string;
  description: string;
  cover_image_url: string;
  is_published: boolean;
  hidden_sections: string[];
};

function PackEditor({
  pack,
  promptCount,
  onBack,
  onDelete,
  onSaved,
}: {
  pack: Pack;
  promptCount: number;
  onBack: () => void;
  onDelete: () => void;
  onSaved: () => void;
}) {
  const qc = useQueryClient();
  const confirm = useConfirm();
  const [saving, setSaving] = useState(false);
  const { data: prompts } = usePrompts();

  const { form, patch, isDirty, commit, reset } = useDirtyForm<PackForm>({
    title: pack.title,
    slug: pack.slug,
    description: pack.description ?? "",
    cover_image_url: pack.cover_image_url ?? "",
    is_published: pack.is_published,
    hidden_sections: pack.hidden_sections ?? [],
  });
  useUnsavedGuard(isDirty);

  const slugError = validateSlug(form.slug);
  const inPack = (prompts ?? []).filter((p) => p.pack_id === pack.id);
  const others = (prompts ?? []).filter((p) => p.pack_id !== pack.id);

  const save = async () => {
    if (slugError) {
      toast.error(slugError);
      return;
    }
    if (!form.title.trim()) {
      toast.error("Title is required.");
      return;
    }
    setSaving(true);
    // price_cents is intentionally omitted — packs are free, and the old admin
    // kept writing a stale value here after the pricing UI was removed.
    const { error } = await supabase
      .from("packs")
      .update({
        title: form.title.trim(),
        slug: form.slug,
        description: form.description,
        cover_image_url: form.cover_image_url || null,
        is_published: form.is_published,
        hidden_sections: form.hidden_sections,
      })
      .eq("id", pack.id);
    setSaving(false);
    if (error) {
      toast.error(friendlyError(error));
      return;
    }
    commit();
    toast.success("Pack saved");
    qc.invalidateQueries({ queryKey: ["pack", form.slug] });
    onSaved();
  };

  const back = async () => {
    if (isDirty) {
      const ok = await confirm({
        title: "Discard unsaved changes?",
        body: "Your edits to this pack haven't been saved.",
        confirmLabel: "Discard",
        destructive: true,
      });
      if (!ok) return;
    }
    onBack();
  };

  const assign = async (promptId: string, packId: string | null) => {
    const { error } = await supabase.from("prompts").update({ pack_id: packId }).eq("id", promptId);
    if (error) {
      toast.error(friendlyError(error));
      return;
    }
    qc.invalidateQueries({ queryKey: ["prompts"] });
    qc.invalidateQueries({ queryKey: ["prompts_by_pack", pack.id] });
  };

  const toggleSection = (key: string) => {
    const set = new Set(form.hidden_sections);
    if (set.has(key)) set.delete(key);
    else set.add(key);
    patch({ hidden_sections: Array.from(set) });
  };

  return (
    <section className="glass-card rounded-3xl p-6">
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={back}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> All packs
        </button>
        <a
          href={`/pack/${pack.slug}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <ExternalLink className="h-3.5 w-3.5" /> Preview
        </a>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-2xl font-semibold">{form.title || "Untitled pack"}</h2>
        <PublishToggle published={form.is_published} onChange={(v) => patch({ is_published: v })} />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Field label="Title">
          <TextInput value={form.title} onChange={(e) => patch({ title: e.target.value })} />
        </Field>
        <Field
          label="Slug"
          error={slugError}
          hint={`Public URL: /pack/${form.slug || "…"}`}
        >
          <TextInput
            value={form.slug}
            invalid={!!slugError}
            onChange={(e) => patch({ slug: e.target.value })}
            onBlur={(e) => patch({ slug: slugify(e.target.value) })}
            className="font-mono"
          />
        </Field>
      </div>

      <div className="mt-4">
        <Field label="Description">
          <TextArea
            rows={3}
            value={form.description}
            onChange={(e) => patch({ description: e.target.value })}
          />
        </Field>
      </div>

      <div className="mt-4">
        <MediaField
          label="Cover image"
          url={form.cover_image_url || null}
          accept="image/*"
          pathPrefix={`packs/${pack.id}-cover`}
          onChange={(u) => patch({ cover_image_url: u })}
          preview="image"
        />
      </div>

      <div className="mt-6 rounded-2xl bg-white/[0.02] p-4">
        <div className="text-sm font-semibold">Page sections</div>
        <p className="mt-1 text-xs text-muted-foreground">
          Hide a section from the public pack page. It stays editable here.
        </p>
        <ul className="mt-3 space-y-2">
          {PACK_SECTIONS.map((s) => {
            const isHidden = form.hidden_sections.includes(s.key);
            return (
              <li
                key={s.key}
                className="glass flex items-center justify-between gap-3 rounded-xl px-3 py-2.5"
              >
                <div className="min-w-0">
                  <div className="text-sm font-semibold">{s.label}</div>
                  <div className="truncate text-xs text-muted-foreground">{s.desc}</div>
                </div>
                <button
                  onClick={() => toggleSection(s.key)}
                  role="switch"
                  aria-checked={!isHidden}
                  className={`flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                    isHidden
                      ? "bg-yellow-500/15 text-yellow-200 hover:bg-yellow-500/25"
                      : "bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/25"
                  }`}
                >
                  {isHidden ? "Hidden" : "Visible"}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="mt-4 rounded-2xl bg-white/[0.02] p-4">
        <div className="text-sm font-semibold">Prompts in this pack ({promptCount})</div>
        <ul className="mt-3 space-y-1">
          {inPack.length === 0 && (
            <li className="py-2 text-sm text-muted-foreground">
              None yet — add one from the picker below.
            </li>
          )}
          {inPack.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between gap-2 rounded-lg px-2 py-2 text-sm hover:bg-white/5"
            >
              <span className="min-w-0 truncate">
                <span className="font-semibold">{p.title}</span>
                <span className="ml-2 text-xs text-muted-foreground">
                  {p.categories?.name ?? "uncategorized"}
                </span>
              </span>
              <button
                onClick={() => assign(p.id, null)}
                className="flex-shrink-0 text-xs text-muted-foreground hover:text-destructive"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
        {others.length > 0 && (
          <SelectInput
            className="mt-3"
            value=""
            onChange={(e) => {
              if (e.target.value) void assign(e.target.value, pack.id);
            }}
          >
            <option value="" className="bg-background">
              + Add a prompt to this pack…
            </option>
            {others.map((p) => (
              <option key={p.id} value={p.id} className="bg-background">
                {p.title}
              </option>
            ))}
          </SelectInput>
        )}
      </div>

      <div className="mt-6 border-t border-border/40 pt-4">
        <button
          onClick={onDelete}
          className="inline-flex items-center gap-2 rounded-full border border-destructive/40 px-4 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10"
        >
          <Trash2 className="h-4 w-4" /> Delete pack
        </button>
      </div>

      <SaveBar isDirty={isDirty} saving={saving} onSave={save} onDiscard={reset} />
    </section>
  );
}
