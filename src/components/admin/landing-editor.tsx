import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ChevronDown } from "lucide-react";
import { useSiteContent, useSiteContentMutation } from "@/lib/queries";
import { DEFAULT_SECTIONS, getSectionOrder, type SectionId } from "@/lib/sections";
import { friendlyError, useUnsavedGuard } from "./use-admin";
import {
  Field,
  MediaField,
  ReorderControls,
  SaveBar,
  SectionHeader,
  TextArea,
  TextInput,
} from "./primitives";

type FieldKind = "text" | "textarea" | "image";
type Block = { key: string; label: string; desc: string; fields: { name: string; label: string; hint?: string; type: FieldKind }[] };

/* Pricing block intentionally absent — the site is free and Stripe is
   donations only. */
const LANDING_BLOCKS: Block[] = [
  {
    key: "hero",
    label: "Hero",
    desc: "The first thing visitors see.",
    fields: [
      { name: "badge", label: "Badge", hint: "Small uppercase tag, e.g. EVKT1", type: "text" },
      { name: "badge_label", label: "Badge label", type: "text" },
      { name: "headline", label: "Headline", type: "textarea" },
      { name: "subhead", label: "Subheading", type: "textarea" },
      { name: "cta_primary", label: "Primary button text", type: "text" },
      { name: "background_image", label: "Background image / GIF", type: "image" },
      { name: "product_image", label: "Product preview image", type: "image" },
    ],
  },
  {
    key: "demo",
    label: "Demo Reel",
    desc: "The video block on the homepage.",
    fields: [
      { name: "video_url", label: "Video URL", hint: "mp4 or webm", type: "text" },
      { name: "poster_image", label: "Poster image", hint: "Shown before play", type: "image" },
      { name: "caption", label: "Caption", type: "text" },
    ],
  },
  {
    key: "library",
    label: "Library page",
    desc: "Copy at the top of /library.",
    fields: [
      { name: "title", label: "Page title", type: "text" },
      { name: "description", label: "Page description", type: "textarea" },
      { name: "hero_image", label: "Image above the title", type: "image" },
    ],
  },
  {
    key: "footer",
    label: "Footer",
    desc: "Copyright and up to four links.",
    fields: [
      { name: "copyright", label: "Copyright text", type: "text" },
      { name: "tagline", label: "Tagline", type: "text" },
      { name: "link1_label", label: "Link 1 label", type: "text" },
      { name: "link1_url", label: "Link 1 URL", type: "text" },
      { name: "link2_label", label: "Link 2 label", type: "text" },
      { name: "link2_url", label: "Link 2 URL", type: "text" },
      { name: "link3_label", label: "Link 3 label", type: "text" },
      { name: "link3_url", label: "Link 3 URL", type: "text" },
      { name: "link4_label", label: "Link 4 label", type: "text" },
      { name: "link4_url", label: "Link 4 URL", type: "text" },
    ],
  },
];

type Drafts = Record<string, Record<string, string>>;

function draftsFromSite(site: ReturnType<typeof useSiteContent>["data"]): Drafts {
  const next: Drafts = {};
  LANDING_BLOCKS.forEach((b) => {
    next[b.key] = {};
    b.fields.forEach((f) => {
      const v = site?.[b.key]?.[f.name];
      next[b.key][f.name] = typeof v === "string" ? v : "";
    });
  });
  return next;
}

export function LandingEditor() {
  const { data: site } = useSiteContent();
  const mut = useSiteContentMutation();
  const [drafts, setDrafts] = useState<Drafts>(() => draftsFromSite(undefined));
  const [baseline, setBaseline] = useState<Drafts>(() => draftsFromSite(undefined));
  const [openKey, setOpenKey] = useState<string>("hero");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!site) return;
    const next = draftsFromSite(site);
    setDrafts(next);
    setBaseline(next);
  }, [site]);

  const dirtyBlocks = useMemo(
    () =>
      LANDING_BLOCKS.filter(
        (b) => JSON.stringify(drafts[b.key]) !== JSON.stringify(baseline[b.key]),
      ),
    [drafts, baseline],
  );
  const isDirty = dirtyBlocks.length > 0;
  useUnsavedGuard(isDirty);

  const setField = (block: string, field: string, value: string) =>
    setDrafts((d) => ({ ...d, [block]: { ...(d[block] ?? {}), [field]: value } }));

  /** Saves every changed block in one go, so there's a single Save action for
   *  the whole tab instead of a separate button per accordion. */
  const saveAll = async () => {
    setSaving(true);
    try {
      for (const b of dirtyBlocks) {
        await mut.mutateAsync({ key: b.key, value: drafts[b.key] ?? {} });
      }
      setBaseline(drafts);
      toast.success(
        dirtyBlocks.length === 1
          ? `${dirtyBlocks[0].label} saved — live now`
          : `${dirtyBlocks.length} sections saved — live now`,
      );
    } catch (e) {
      toast.error(friendlyError(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <section className="glass-card rounded-3xl p-6">
        <SectionHeader
          title="Landing page content"
          desc="Edit homepage, library and footer copy. Saved changes appear on the live site immediately."
        />
      </section>

      {LANDING_BLOCKS.map((block) => {
        const isOpen = openKey === block.key;
        const blockDirty = dirtyBlocks.some((b) => b.key === block.key);
        return (
          <section key={block.key} className="glass-card overflow-hidden rounded-3xl">
            <button
              onClick={() => setOpenKey(isOpen ? "" : block.key)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-3 p-5 text-left"
            >
              <div className="min-w-0">
                <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
                  {block.label}
                  {blockDirty && (
                    <span className="h-2 w-2 flex-shrink-0 rounded-full bg-[#a78bfa]" title="Unsaved changes" />
                  )}
                </h2>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{block.desc}</p>
              </div>
              <ChevronDown
                className={`h-5 w-5 flex-shrink-0 text-muted-foreground transition-transform ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            {isOpen && (
              <div className="grid gap-4 border-t border-border/40 bg-white/[0.02] p-5 sm:grid-cols-2">
                {block.fields.map((f) => {
                  const val = drafts[block.key]?.[f.name] ?? "";
                  const wide = f.type !== "text";
                  return (
                    <div key={f.name} className={wide ? "sm:col-span-2" : ""}>
                      {f.type === "image" ? (
                        <MediaField
                          label={f.label}
                          hint={f.hint}
                          url={val || null}
                          accept="image/*"
                          pathPrefix={`landing/${block.key}-${f.name}`}
                          onChange={(u) => setField(block.key, f.name, u)}
                          preview="image"
                        />
                      ) : (
                        <Field label={f.label} hint={f.hint}>
                          {f.type === "textarea" ? (
                            <TextArea
                              rows={3}
                              value={val}
                              onChange={(e) => setField(block.key, f.name, e.target.value)}
                            />
                          ) : (
                            <TextInput
                              value={val}
                              onChange={(e) => setField(block.key, f.name, e.target.value)}
                            />
                          )}
                        </Field>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        );
      })}

      <SaveBar
        isDirty={isDirty}
        saving={saving}
        onSave={saveAll}
        onDiscard={() => setDrafts(baseline)}
        label={`${dirtyBlocks.length} section${dirtyBlocks.length === 1 ? "" : "s"} changed`}
      />
    </div>
  );
}

/* ─────────────────────── homepage section order ─────────────────────── */

export function SectionOrderManager() {
  const { data: site } = useSiteContent();
  const mut = useSiteContentMutation();
  const [order, setOrder] = useState<SectionId[]>(() => DEFAULT_SECTIONS.map((s) => s.id));
  const [baseline, setBaseline] = useState<SectionId[]>(() => DEFAULT_SECTIONS.map((s) => s.id));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!site) return;
    const next = getSectionOrder(site);
    setOrder(next);
    setBaseline(next);
  }, [site]);

  const isDirty = JSON.stringify(order) !== JSON.stringify(baseline);
  useUnsavedGuard(isDirty);

  const move = (idx: number, dir: -1 | 1) => {
    const j = idx + dir;
    if (j < 0 || j >= order.length) return;
    const next = [...order];
    [next[idx], next[j]] = [next[j], next[idx]];
    setOrder(next);
  };

  const save = async () => {
    setSaving(true);
    try {
      await mut.mutateAsync({ key: "layout", value: { sections: order } });
      setBaseline(order);
      toast.success("Section order saved — live now");
    } catch (e) {
      toast.error(friendlyError(e));
    } finally {
      setSaving(false);
    }
  };

  const labelFor = (id: SectionId) => DEFAULT_SECTIONS.find((s) => s.id === id)?.label ?? id;

  return (
    <section className="glass-card rounded-3xl p-6">
      <SectionHeader
        title="Homepage section order"
        desc="Set the order sections appear in under the hero."
        actions={
          <button
            onClick={() => setOrder(DEFAULT_SECTIONS.map((s) => s.id))}
            className="rounded-full bg-white/5 px-4 py-2 text-sm transition-colors hover:bg-white/10"
          >
            Reset to default
          </button>
        }
      />

      <ol className="mt-6 space-y-2">
        {order.map((id, i) => (
          <li key={id} className="glass flex items-center gap-3 rounded-2xl p-3">
            <span className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg bg-white/5 font-mono text-xs">
              {i + 1}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm font-semibold">{labelFor(id)}</span>
            <code className="hidden flex-shrink-0 text-xs text-muted-foreground sm:inline">{id}</code>
            <ReorderControls
              onUp={() => move(i, -1)}
              onDown={() => move(i, 1)}
              disableUp={i === 0}
              disableDown={i === order.length - 1}
            />
          </li>
        ))}
      </ol>

      <p className="mt-4 text-xs text-muted-foreground">
        The hero stays pinned at the top and the footer at the bottom.
      </p>

      <SaveBar
        isDirty={isDirty}
        saving={saving}
        onSave={save}
        onDiscard={() => setOrder(baseline)}
        label="Section order changed"
      />
    </section>
  );
}
