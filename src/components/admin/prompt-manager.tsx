import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, ExternalLink, FileText, Plus, Search, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  useCategories,
  usePacks,
  usePrompts,
  type Category,
  type Pack,
  type Prompt,
} from "@/lib/queries";
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

type PromptRow = Prompt & {
  categories: { slug: string; name: string; accent_color: string | null } | null;
};

export function PromptManager() {
  const { data: prompts } = usePrompts();
  const { data: cats } = useCategories();
  const { data: packs } = usePacks(true);
  const qc = useQueryClient();
  const confirm = useConfirm();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [packFilter, setPackFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | "live" | "draft">("");
  const [busy, setBusy] = useState(false);

  const ordered = useMemo(
    () => [...((prompts ?? []) as PromptRow[])].sort((a, b) => a.sort_order - b.sort_order),
    [prompts],
  );

  const filtered = useMemo(
    () =>
      ordered.filter((p) => {
        if (catFilter && p.category_id !== catFilter) return false;
        if (packFilter && p.pack_id !== packFilter) return false;
        if (statusFilter === "live" && !p.is_published) return false;
        if (statusFilter === "draft" && p.is_published) return false;
        if (search && !`${p.title} ${p.slug}`.toLowerCase().includes(search.toLowerCase()))
          return false;
        return true;
      }),
    [ordered, search, catFilter, packFilter, statusFilter],
  );

  const isFiltered = !!(search || catFilter || packFilter || statusFilter);
  const selected = ordered.find((p) => p.id === selectedId) ?? null;
  const refresh = () => qc.invalidateQueries({ queryKey: ["prompts"] });

  const create = async () => {
    setBusy(true);
    const { data, error } = await supabase
      .from("prompts")
      .insert({
        slug: `new-prompt-${Date.now().toString(36)}`,
        title: "New prompt",
        description: "",
        prompt_text: "",
        category_id: cats?.[0]?.id ?? null,
        pack_id: packs?.[0]?.id ?? null,
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
    toast.success("Draft prompt created");
    if (data?.id) setSelectedId(data.id);
  };

  const reorder = async (id: string, dir: -1 | 1) => {
    const ids = moveInList(ordered, id, dir);
    if (!ids) return;
    setBusy(true);
    try {
      await persistOrder("prompts", ids);
      refresh();
    } catch (e) {
      toast.error(friendlyError(e));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (p: PromptRow) => {
    const ok = await confirm({
      title: `Delete "${p.title}"?`,
      body: "This permanently removes the prompt and its text. This cannot be undone.",
      confirmLabel: "Delete prompt",
      destructive: true,
    });
    if (!ok) return;
    const { error } = await supabase.from("prompts").delete().eq("id", p.id);
    if (error) {
      toast.error(friendlyError(error));
      return;
    }
    toast.success("Prompt deleted");
    setSelectedId(null);
    refresh();
  };

  if (selected) {
    return (
      <PromptEditor
        key={selected.id}
        prompt={selected}
        cats={cats ?? []}
        packs={packs ?? []}
        onBack={() => setSelectedId(null)}
        onDelete={() => remove(selected)}
        onSaved={refresh}
      />
    );
  }

  return (
    <section className="glass-card rounded-3xl p-6">
      <SectionHeader
        title="Prompts"
        desc={`${ordered.length} total · ${filtered.length} shown`}
        actions={
          <PrimaryButton onClick={create} loading={busy}>
            <Plus className="h-4 w-4" /> New prompt
          </PrimaryButton>
        }
      />

      <div className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <div className="glass flex items-center gap-2 rounded-xl px-3 lg:col-span-2">
          <Search className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title or slug…"
            className="w-full bg-transparent py-2.5 text-sm outline-none"
          />
        </div>
        <SelectInput value={packFilter} onChange={(e) => setPackFilter(e.target.value)}>
          <option value="" className="bg-background">
            All packs
          </option>
          {packs?.map((p) => (
            <option key={p.id} value={p.id} className="bg-background">
              {p.title}
            </option>
          ))}
        </SelectInput>
        <SelectInput value={catFilter} onChange={(e) => setCatFilter(e.target.value)}>
          <option value="" className="bg-background">
            All categories
          </option>
          {cats?.map((c) => (
            <option key={c.id} value={c.id} className="bg-background">
              {c.name}
            </option>
          ))}
        </SelectInput>
      </div>

      <div className="mt-2 flex items-center gap-2">
        {(["", "live", "draft"] as const).map((s) => (
          <button
            key={s || "all"}
            onClick={() => setStatusFilter(s)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              statusFilter === s
                ? "bg-white/12 text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {s === "" ? "All" : s === "live" ? "Live" : "Drafts"}
          </button>
        ))}
        {isFiltered && (
          <button
            onClick={() => {
              setSearch("");
              setCatFilter("");
              setPackFilter("");
              setStatusFilter("");
            }}
            className="ml-auto text-xs text-muted-foreground underline hover:text-foreground"
          >
            Clear filters
          </button>
        )}
      </div>

      {isFiltered && (
        <p className="mt-3 text-xs text-muted-foreground/70">
          Reordering is disabled while filtered — clear filters to change prompt order.
        </p>
      )}

      <div className="mt-4 space-y-2">
        {filtered.length === 0 && (
          <EmptyState
            icon={FileText}
            title={ordered.length === 0 ? "No prompts yet" : "No prompts match"}
            desc={
              ordered.length === 0
                ? "Create your first prompt to get started."
                : "Try clearing the filters."
            }
          />
        )}

        {filtered.map((p) => {
          const idx = ordered.findIndex((o) => o.id === p.id);
          return (
            <div key={p.id} className="glass flex items-center gap-3 rounded-2xl p-3">
              <ReorderControls
                onUp={() => reorder(p.id, -1)}
                onDown={() => reorder(p.id, 1)}
                disableUp={isFiltered || idx === 0}
                disableDown={isFiltered || idx === ordered.length - 1}
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
                    <span
                      className="rounded-full px-2 py-0.5"
                      style={{
                        background: `${p.categories?.accent_color ?? "#a78bfa"}33`,
                        color: p.categories?.accent_color ?? undefined,
                      }}
                    >
                      {p.categories?.name ?? "Uncategorized"}
                    </span>
                    <span className="ml-2 font-mono">/{p.slug}</span>
                  </div>
                </div>
              </button>
              <span className="hidden flex-shrink-0 text-xs text-muted-foreground sm:inline">
                {p.copy_count} copies
              </span>
              <GhostButton onClick={() => setSelectedId(p.id)} className="flex-shrink-0">
                Edit
              </GhostButton>
            </div>
          );
        })}
      </div>
    </section>
  );
}

type PromptForm = {
  title: string;
  slug: string;
  description: string;
  prompt_text: string;
  category_id: string | null;
  pack_id: string | null;
  cover_image_url: string;
  demo_video_url: string;
  gallery_text: string;
  is_published: boolean;
};

function PromptEditor({
  prompt,
  cats,
  packs,
  onBack,
  onDelete,
  onSaved,
}: {
  prompt: PromptRow;
  cats: Category[];
  packs: Pack[];
  onBack: () => void;
  onDelete: () => void;
  onSaved: () => void;
}) {
  const qc = useQueryClient();
  const confirm = useConfirm();
  const [saving, setSaving] = useState(false);

  const { form, patch, isDirty, commit, reset } = useDirtyForm<PromptForm>({
    title: prompt.title,
    slug: prompt.slug,
    description: prompt.description ?? "",
    prompt_text: prompt.prompt_text,
    category_id: prompt.category_id,
    pack_id: prompt.pack_id,
    cover_image_url: prompt.cover_image_url ?? "",
    demo_video_url: prompt.demo_video_url ?? "",
    gallery_text: (prompt.gallery_urls ?? []).join("\n"),
    is_published: prompt.is_published,
  });
  useUnsavedGuard(isDirty);

  const slugError = validateSlug(form.slug);

  const save = async () => {
    if (slugError) {
      toast.error(slugError);
      return;
    }
    if (!form.title.trim()) {
      toast.error("Title is required.");
      return;
    }
    if (form.is_published && !form.prompt_text.trim()) {
      toast.error("A published prompt needs prompt text.");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("prompts")
      .update({
        title: form.title.trim(),
        slug: form.slug,
        description: form.description,
        prompt_text: form.prompt_text,
        category_id: form.category_id,
        pack_id: form.pack_id,
        cover_image_url: form.cover_image_url || null,
        demo_video_url: form.demo_video_url || null,
        gallery_urls: form.gallery_text
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
        is_published: form.is_published,
      })
      .eq("id", prompt.id);
    setSaving(false);
    if (error) {
      toast.error(friendlyError(error));
      return;
    }
    commit();
    toast.success("Prompt saved");
    qc.invalidateQueries({ queryKey: ["prompt", form.slug] });
    onSaved();
  };

  const back = async () => {
    if (isDirty) {
      const ok = await confirm({
        title: "Discard unsaved changes?",
        body: "Your edits to this prompt haven't been saved.",
        confirmLabel: "Discard",
        destructive: true,
      });
      if (!ok) return;
    }
    onBack();
  };

  return (
    <section className="glass-card rounded-3xl p-6">
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={back}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> All prompts
        </button>
        <a
          href={`/prompt/${prompt.slug}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <ExternalLink className="h-3.5 w-3.5" /> Preview
        </a>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-2xl font-semibold">{form.title || "Untitled prompt"}</h2>
        <PublishToggle published={form.is_published} onChange={(v) => patch({ is_published: v })} />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Field label="Title">
          <TextInput value={form.title} onChange={(e) => patch({ title: e.target.value })} />
        </Field>
        <Field label="Slug" error={slugError} hint={`Public URL: /prompt/${form.slug || "…"}`}>
          <TextInput
            value={form.slug}
            invalid={!!slugError}
            onChange={(e) => patch({ slug: e.target.value })}
            onBlur={(e) => patch({ slug: slugify(e.target.value) })}
            className="font-mono"
          />
        </Field>
        <Field label="Pack">
          <SelectInput
            value={form.pack_id ?? ""}
            onChange={(e) => patch({ pack_id: e.target.value || null })}
          >
            <option value="" className="bg-background">
              — unassigned —
            </option>
            {packs.map((p) => (
              <option key={p.id} value={p.id} className="bg-background">
                {p.title}
              </option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Category">
          <SelectInput
            value={form.category_id ?? ""}
            onChange={(e) => patch({ category_id: e.target.value || null })}
          >
            <option value="" className="bg-background">
              — uncategorized —
            </option>
            {cats.map((c) => (
              <option key={c.id} value={c.id} className="bg-background">
                {c.name}
              </option>
            ))}
          </SelectInput>
        </Field>
      </div>

      <div className="mt-4 space-y-4">
        <Field label="Description">
          <TextArea
            rows={2}
            value={form.description}
            onChange={(e) => patch({ description: e.target.value })}
          />
        </Field>
        <Field
          label="Prompt text"
          hint={`${form.prompt_text.length} characters — this is what visitors copy.`}
        >
          <TextArea
            rows={8}
            value={form.prompt_text}
            onChange={(e) => patch({ prompt_text: e.target.value })}
            className="font-mono"
          />
        </Field>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <MediaField
          label="Cover image"
          url={form.cover_image_url || null}
          accept="image/*"
          pathPrefix={`prompts/${prompt.id}-cover`}
          onChange={(u) => patch({ cover_image_url: u })}
          preview="image"
        />
        <MediaField
          label="Demo video / GIF"
          url={form.demo_video_url || null}
          accept="video/*,image/gif,image/*"
          pathPrefix={`prompts/${prompt.id}-demo`}
          onChange={(u) => patch({ demo_video_url: u })}
          preview="auto"
        />
      </div>

      <div className="mt-4">
        <Field label="Gallery URLs" hint="One URL per line.">
          <TextArea
            rows={3}
            value={form.gallery_text}
            onChange={(e) => patch({ gallery_text: e.target.value })}
            className="font-mono text-xs"
          />
        </Field>
      </div>

      <div className="mt-6 border-t border-border/40 pt-4">
        <button
          onClick={onDelete}
          className="inline-flex items-center gap-2 rounded-full border border-destructive/40 px-4 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10"
        >
          <Trash2 className="h-4 w-4" /> Delete prompt
        </button>
      </div>

      <SaveBar isDirty={isDirty} saving={saving} onSave={save} onDiscard={reset} />
    </section>
  );
}
