import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Eye, EyeOff, Image as ImageIcon, Loader2, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAiLogos, useSiteContent, useSiteContentMutation, type AiLogo } from "@/lib/queries";
import {
  friendlyError,
  moveInList,
  nextSortOrder,
  persistOrder,
  uploadMedia,
  useUnsavedGuard,
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

type Draft = { name: string; link_url: string };

export function AiLogoManager() {
  const { data: logos } = useAiLogos();
  const { data: site } = useSiteContent();
  const mut = useSiteContentMutation();
  const qc = useQueryClient();
  const confirm = useConfirm();

  const ordered = useMemo(
    () => [...(logos ?? [])].sort((a, b) => a.sort_order - b.sort_order),
    [logos],
  );

  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [desc, setDesc] = useState("");
  const [descBaseline, setDescBaseline] = useState("");
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const next: Record<string, Draft> = {};
    ordered.forEach((l) => {
      next[l.id] = { name: l.name, link_url: l.link_url ?? "" };
    });
    setDrafts(next);
  }, [ordered]);

  useEffect(() => {
    const v = site?.compat?.description;
    const s = typeof v === "string" ? v : "";
    setDesc(s);
    setDescBaseline(s);
  }, [site]);

  const changed = useMemo(
    () =>
      ordered.filter((l) => {
        const d = drafts[l.id];
        if (!d) return false;
        return d.name !== l.name || d.link_url !== (l.link_url ?? "");
      }),
    [ordered, drafts],
  );
  const descDirty = desc !== descBaseline;
  const isDirty = changed.length > 0 || descDirty;
  useUnsavedGuard(isDirty);

  const refresh = () => qc.invalidateQueries({ queryKey: ["ai_logos"] });
  const setDraft = (id: string, patch: Partial<Draft>) =>
    setDrafts((d) => ({ ...d, [id]: { ...d[id], ...patch } }));

  const saveAll = async () => {
    if (changed.some((l) => !drafts[l.id].name.trim())) {
      toast.error("Logo names can't be empty.");
      return;
    }
    setSaving(true);
    try {
      const results = await Promise.all(
        changed.map((l) =>
          supabase
            .from("ai_logos")
            .update({
              name: drafts[l.id].name.trim(),
              link_url: drafts[l.id].link_url.trim() || null,
            })
            .eq("id", l.id),
        ),
      );
      const failed = results.find((r) => r.error);
      if (failed?.error) throw failed.error;
      if (descDirty) {
        await mut.mutateAsync({ key: "compat", value: { description: desc } });
        setDescBaseline(desc);
      }
      toast.success("Saved");
      refresh();
    } catch (e) {
      toast.error(friendlyError(e));
    } finally {
      setSaving(false);
    }
  };

  const discard = () => {
    const next: Record<string, Draft> = {};
    ordered.forEach((l) => {
      next[l.id] = { name: l.name, link_url: l.link_url ?? "" };
    });
    setDrafts(next);
    setDesc(descBaseline);
  };

  const addLogo = async (file: File) => {
    setBusy(true);
    const name = file.name.replace(/\.[^.]+$/, "").slice(0, 60) || "Logo";
    const result = await uploadMedia(file, `ai-logos/${Date.now().toString(36)}`);
    if ("error" in result) {
      setBusy(false);
      toast.error(result.error);
      return;
    }
    const { error } = await supabase.from("ai_logos").insert({
      name,
      logo_url: result.url,
      sort_order: nextSortOrder(ordered),
    });
    setBusy(false);
    if (error) {
      toast.error(friendlyError(error));
      return;
    }
    toast.success("Logo added");
    refresh();
  };

  const togglePublished = async (l: AiLogo) => {
    const { error } = await supabase
      .from("ai_logos")
      .update({ is_published: !l.is_published })
      .eq("id", l.id);
    if (error) {
      toast.error(friendlyError(error));
      return;
    }
    refresh();
  };

  const reorder = async (id: string, dir: -1 | 1) => {
    const ids = moveInList(ordered, id, dir);
    if (!ids) return;
    setBusy(true);
    try {
      await persistOrder("ai_logos", ids);
      refresh();
    } catch (e) {
      toast.error(friendlyError(e));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (l: AiLogo) => {
    const ok = await confirm({
      title: `Delete "${l.name}"?`,
      body: "It will be removed from the homepage carousel.",
      confirmLabel: "Delete logo",
      destructive: true,
    });
    if (!ok) return;
    const { error } = await supabase.from("ai_logos").delete().eq("id", l.id);
    if (error) {
      toast.error(friendlyError(error));
      return;
    }
    toast.success("Logo deleted");
    refresh();
  };

  const liveCount = ordered.filter((l) => l.is_published).length;

  return (
    <section className="glass-card rounded-3xl p-6">
      <SectionHeader
        title="AI Models Carousel"
        desc={`${ordered.length} logo${ordered.length === 1 ? "" : "s"} · ${liveCount} showing on the homepage`}
        actions={
          <label
            className={`ring-glow inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground ${
              busy ? "opacity-60" : "cursor-pointer"
            }`}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Upload logo
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
              className="hidden"
              disabled={busy}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void addLogo(f);
                e.target.value = "";
              }}
            />
          </label>
        }
      />

      <div className="glass mt-6 rounded-2xl p-4">
        <Field label="Carousel caption" hint="Shown above the logos on the homepage. Leave blank to hide.">
          <TextInput
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Compatible with the leading AI video models"
          />
        </Field>
      </div>

      <div className="mt-4 grid gap-2 lg:grid-cols-2">
        {ordered.length === 0 && (
          <div className="lg:col-span-2">
            <EmptyState
              icon={ImageIcon}
              title="No logos yet"
              desc="Upload your first logo to populate the homepage carousel."
            />
          </div>
        )}

        {ordered.map((l, i) => {
          const d = drafts[l.id] ?? { name: l.name, link_url: l.link_url ?? "" };
          return (
            <div
              key={l.id}
              className={`glass flex items-center gap-3 rounded-2xl p-3 transition-opacity ${
                l.is_published ? "" : "opacity-50"
              }`}
            >
              <ReorderControls
                onUp={() => reorder(l.id, -1)}
                onDown={() => reorder(l.id, 1)}
                disableUp={i === 0}
                disableDown={i === ordered.length - 1}
                busy={busy}
              />
              <div className="grid h-14 w-20 flex-shrink-0 place-items-center rounded-lg bg-white/5 p-2">
                <img src={l.logo_url} alt={l.name} className="max-h-10 max-w-full object-contain" />
              </div>
              <div className="min-w-0 flex-1 space-y-1.5">
                <TextInput
                  value={d.name}
                  onChange={(e) => setDraft(l.id, { name: e.target.value })}
                  className="py-1.5 text-sm font-semibold"
                />
                <TextInput
                  value={d.link_url}
                  onChange={(e) => setDraft(l.id, { link_url: e.target.value })}
                  placeholder="Optional link URL"
                  className="py-1.5 text-xs"
                />
              </div>
              <div className="flex flex-shrink-0 flex-col items-center gap-2">
                <button
                  onClick={() => togglePublished(l)}
                  aria-label={l.is_published ? `Hide ${l.name}` : `Show ${l.name}`}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  {l.is_published ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => remove(l)}
                  aria-label={`Delete ${l.name}`}
                  className="text-muted-foreground transition-colors hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <SaveBar isDirty={isDirty} saving={saving} onSave={saveAll} onDiscard={discard} />
    </section>
  );
}
