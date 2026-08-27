import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Image, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useResources, useSiteAssets, type ResourceItem, type SiteAsset } from "@/lib/queries";
import { friendlyError, slugify } from "./use-admin";
import {
  EmptyState,
  Field,
  MediaField,
  PrimaryButton,
  PublishToggle,
  SectionHeader,
  SelectInput,
  TextArea,
  TextInput,
  useConfirm,
} from "./primitives";

// Generated database types are refreshed after the migration is applied remotely.
/* eslint-disable @typescript-eslint/no-explicit-any */
const table = (name: string): any =>
  (supabase as unknown as { from: (table: string) => any }).from(name);
/* eslint-enable @typescript-eslint/no-explicit-any */

export function ResourceManager() {
  const { data } = useResources(true);
  const qc = useQueryClient();
  const confirm = useConfirm();
  const blank = {
    title: "",
    slug: "",
    description: "",
    url: "",
    image_url: "",
    resource_type: "tool",
    tags: "",
    is_featured: false,
    is_published: false,
  };
  const [form, setForm] = useState(blank);
  const [busy, setBusy] = useState(false);
  const patch = (p: Partial<typeof form>) => setForm((f) => ({ ...f, ...p }));
  const save = async () => {
    if (!form.title.trim() || !form.url.trim())
      return toast.error("Title and destination URL are required.");
    setBusy(true);
    const { error } = await table("resources").insert({
      ...form,
      slug: slugify(form.slug || form.title),
      tags: form.tags
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean),
      image_url: form.image_url || null,
      sort_order: (data?.length ?? 0) + 1,
    });
    setBusy(false);
    if (error) return toast.error(friendlyError(error));
    setForm(blank);
    qc.invalidateQueries({ queryKey: ["resources"] });
    toast.success("Resource added");
  };
  const update = async (r: ResourceItem, p: Partial<ResourceItem>) => {
    const { error } = await table("resources").update(p).eq("id", r.id);
    if (error) toast.error(friendlyError(error));
    else qc.invalidateQueries({ queryKey: ["resources"] });
  };
  const remove = async (r: ResourceItem) => {
    if (
      !(await confirm({
        title: `Delete “${r.title}”?`,
        body: "This removes the resource from the directory.",
        confirmLabel: "Delete",
        destructive: true,
      }))
    )
      return;
    await table("resources").delete().eq("id", r.id);
    qc.invalidateQueries({ queryKey: ["resources"] });
  };
  return (
    <section className="glass-card rounded-3xl p-6">
      <SectionHeader
        title="Resources"
        desc="Curate tools, platforms, creators, news sources, and visual workflow references."
      />
      <div className="glass mt-6 grid gap-4 rounded-2xl p-4 sm:grid-cols-2">
        <Field label="Title">
          <TextInput value={form.title} onChange={(e) => patch({ title: e.target.value })} />
        </Field>
        <Field label="Type">
          <SelectInput
            value={form.resource_type}
            onChange={(e) => patch({ resource_type: e.target.value })}
          >
            {["tool", "platform", "creator", "news", "workflow", "community", "other"].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Destination URL">
          <TextInput
            type="url"
            value={form.url}
            onChange={(e) => patch({ url: e.target.value })}
            placeholder="https://…"
          />
        </Field>
        <Field label="Tags" hint="Comma-separated">
          <TextInput value={form.tags} onChange={(e) => patch({ tags: e.target.value })} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Description">
            <TextArea
              rows={3}
              value={form.description}
              onChange={(e) => patch({ description: e.target.value })}
            />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <MediaField
            label="Illustration"
            url={form.image_url}
            accept="image/*"
            pathPrefix={`resources/${slugify(form.title) || "new"}`}
            onChange={(url) => patch({ image_url: url })}
            preview="image"
          />
        </div>
        <div className="flex items-center gap-3 sm:col-span-2">
          <PublishToggle
            published={form.is_published}
            onChange={(v) => patch({ is_published: v })}
          />
          <PrimaryButton loading={busy} onClick={save}>
            <Plus className="h-4 w-4" /> Add resource
          </PrimaryButton>
        </div>
      </div>
      <div className="mt-5 space-y-2">
        {!data?.length && (
          <EmptyState
            icon={ExternalLink}
            title="No resources yet"
            desc="Add your first curated link above."
          />
        )}
        {data?.map((r) => (
          <div key={r.id} className="glass flex items-center gap-3 rounded-2xl p-3">
            {r.image_url ? (
              <img src={r.image_url} alt="" className="h-12 w-16 rounded-lg object-cover" />
            ) : (
              <div className="h-12 w-16 rounded-lg bg-white/5" />
            )}
            <div className="min-w-0 flex-1">
              <div className="truncate font-semibold">{r.title}</div>
              <div className="truncate text-xs text-muted-foreground">
                {r.resource_type} · {r.url}
              </div>
            </div>
            <PublishToggle
              published={r.is_published}
              onChange={(v) => update(r, { is_published: v })}
            />
            <button onClick={() => remove(r)} aria-label={`Delete ${r.title}`}>
              <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

export function SiteAssetManager() {
  const { data } = useSiteAssets();
  const qc = useQueryClient();
  const confirm = useConfirm();
  const blank = {
    asset_key: "",
    name: "",
    asset_type: "image",
    url: "",
    alt_text: "",
    notes: "",
    is_published: true,
  };
  const [form, setForm] = useState(blank);
  const [busy, setBusy] = useState(false);
  const patch = (p: Partial<typeof form>) => setForm((f) => ({ ...f, ...p }));
  const save = async () => {
    if (!form.name.trim() || !form.url.trim())
      return toast.error("Name and file URL are required.");
    setBusy(true);
    const { error } = await table("site_assets").insert({
      ...form,
      asset_key: slugify(form.asset_key || form.name),
    });
    setBusy(false);
    if (error) return toast.error(friendlyError(error));
    setForm(blank);
    qc.invalidateQueries({ queryKey: ["site_assets"] });
    toast.success("Asset saved");
  };
  const remove = async (a: SiteAsset) => {
    if (
      !(await confirm({
        title: `Delete “${a.name}”?`,
        body: "This removes the library record. Existing pages using its URL may still show the file.",
        confirmLabel: "Delete",
        destructive: true,
      }))
    )
      return;
    await table("site_assets").delete().eq("id", a.id);
    qc.invalidateQueries({ queryKey: ["site_assets"] });
  };
  return (
    <section className="glass-card rounded-3xl p-6">
      <SectionHeader
        title="Global site assets"
        desc="One media library for reusable images, videos, icons, documents, and their accessibility text."
      />
      <div className="glass mt-6 grid gap-4 rounded-2xl p-4 sm:grid-cols-2">
        <Field label="Asset name">
          <TextInput value={form.name} onChange={(e) => patch({ name: e.target.value })} />
        </Field>
        <Field label="Type">
          <SelectInput
            value={form.asset_type}
            onChange={(e) => patch({ asset_type: e.target.value })}
          >
            {["image", "video", "icon", "document", "other"].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </SelectInput>
        </Field>
        <div className="sm:col-span-2">
          <MediaField
            label="File or URL"
            url={form.url}
            accept="image/*,video/*,.pdf,.zip"
            pathPrefix={`site-assets/${slugify(form.name) || "new"}`}
            onChange={(url) => patch({ url })}
          />
        </div>
        <Field label="Alt text">
          <TextInput value={form.alt_text} onChange={(e) => patch({ alt_text: e.target.value })} />
        </Field>
        <Field label="Internal notes">
          <TextInput value={form.notes} onChange={(e) => patch({ notes: e.target.value })} />
        </Field>
        <div className="sm:col-span-2">
          <PrimaryButton loading={busy} onClick={save}>
            <Plus className="h-4 w-4" /> Add asset
          </PrimaryButton>
        </div>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {!data?.length && (
          <div className="sm:col-span-2">
            <EmptyState
              icon={Image}
              title="No global assets yet"
              desc="Upload a reusable site asset above."
            />
          </div>
        )}
        {data?.map((a) => (
          <div key={a.id} className="glass flex items-center gap-3 rounded-2xl p-3">
            {a.asset_type === "image" ? (
              <img src={a.url} alt={a.alt_text} className="h-14 w-14 rounded-xl object-cover" />
            ) : (
              <div className="grid h-14 w-14 place-items-center rounded-xl bg-white/5">
                <Image className="h-5 w-5" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="truncate font-semibold">{a.name}</div>
              <div className="truncate font-mono text-xs text-muted-foreground">{a.asset_key}</div>
            </div>
            <button onClick={() => remove(a)} aria-label={`Delete ${a.name}`}>
              <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
