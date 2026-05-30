import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-chrome";
import { useAuth } from "@/lib/use-auth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCategories, usePrompts, useAiLogos, type Prompt, type Category, type AiLogo } from "@/lib/queries";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2, Save, Upload, Mail, ArrowUp, ArrowDown } from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — Elite Visuals" }] }),
  component: AdminPage,
});

function AdminPage() {
  const { user, isAdmin, loading } = useAuth();
  const nav = useNavigate();
  useEffect(() => { if (!loading && !user) nav({ to: "/login" }); }, [loading, user, nav]);

  if (loading) return <Shell><div className="glass animate-pulse rounded-3xl p-10">Loading…</div></Shell>;
  if (!user) return null;
  if (!isAdmin) return (
    <Shell>
      <div className="glass rounded-3xl p-10 text-center">
        <h1 className="font-display text-2xl">Not authorized</h1>
        <p className="mt-2 text-sm text-muted-foreground">Your account ({user.email}) isn't on the admin whitelist. Ask an existing admin to add you, or add your email to the admin_whitelist table from Lovable Cloud.</p>
      </div>
    </Shell>
  );

  return (
    <Shell>
      <h1 className="font-display text-4xl font-semibold sm:text-5xl text-gradient">Admin Dashboard</h1>
      <p className="mt-2 text-muted-foreground">Manage prompts, categories, and media.</p>

      <div className="mt-10 grid gap-8">
        <WhitelistManager />
        <CategoryManager />
        <PromptManager />
        <AiLogoManager />
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-6 pb-24 pt-28">{children}</main>
    </>
  );
}

function WhitelistManager() {
  const [emails, setEmails] = useState<{ email: string }[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const load = async () => {
    const { data } = await supabase.from("admin_whitelist").select("email").order("email");
    setEmails(data ?? []);
  };
  useEffect(() => { load(); }, []);
  const add = async () => {
    if (!newEmail) return;
    const { error } = await supabase.from("admin_whitelist").insert({ email: newEmail.toLowerCase().trim() });
    if (error) toast.error(error.message); else { toast.success("Added — they'll be admin on next sign-in"); setNewEmail(""); load(); }
  };
  const remove = async (email: string) => {
    const { error } = await supabase.from("admin_whitelist").delete().eq("email", email);
    if (error) toast.error(error.message); else load();
  };
  return (
    <section className="glass rounded-3xl p-6">
      <h2 className="font-display text-xl font-semibold">Admin whitelist</h2>
      <p className="mt-1 text-sm text-muted-foreground">Emails listed here become admins automatically when they sign up.</p>
      <div className="mt-4 flex gap-2">
        <div className="glass flex flex-1 items-center gap-2 rounded-xl px-3"><Mail className="h-4 w-4 text-muted-foreground" />
          <input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="email@studio.com" className="w-full bg-transparent py-2 text-sm outline-none" />
        </div>
        <button onClick={add} className="rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground"><Plus className="inline h-4 w-4" /></button>
      </div>
      <ul className="mt-3 space-y-2">
        {emails.map((e) => (
          <li key={e.email} className="glass flex items-center justify-between rounded-xl px-3 py-2 text-sm">
            <span>{e.email}</span>
            <button onClick={() => remove(e.email)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function CategoryManager() {
  const { data: cats } = useCategories();
  const qc = useQueryClient();
  const [newCat, setNewCat] = useState({ slug: "", name: "", accent_color: "#a78bfa" });
  const refresh = () => qc.invalidateQueries({ queryKey: ["categories"] });

  const add = async () => {
    if (!newCat.slug || !newCat.name) return;
    const { error } = await supabase.from("categories").insert({ ...newCat, sort_order: (cats?.length ?? 0) + 1 });
    if (error) toast.error(error.message); else { setNewCat({ slug: "", name: "", accent_color: "#a78bfa" }); refresh(); toast.success("Category added"); }
  };
  const update = async (c: Category, patch: Partial<Category>) => {
    const { error } = await supabase.from("categories").update(patch).eq("id", c.id);
    if (error) toast.error(error.message); else refresh();
  };
  const remove = async (id: string) => {
    if (!confirm("Delete this category?")) return;
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) toast.error(error.message); else refresh();
  };

  return (
    <section className="glass rounded-3xl p-6">
      <h2 className="font-display text-xl font-semibold">Categories</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-[120px_1fr_120px_auto]">
        <input value={newCat.slug} onChange={(e) => setNewCat({ ...newCat, slug: e.target.value })} placeholder="slug" className="glass rounded-xl bg-transparent px-3 py-2 text-sm outline-none" />
        <input value={newCat.name} onChange={(e) => setNewCat({ ...newCat, name: e.target.value })} placeholder="Name" className="glass rounded-xl bg-transparent px-3 py-2 text-sm outline-none" />
        <input value={newCat.accent_color} onChange={(e) => setNewCat({ ...newCat, accent_color: e.target.value })} placeholder="#a78bfa" className="glass rounded-xl bg-transparent px-3 py-2 text-sm font-mono outline-none" />
        <button onClick={add} className="rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground"><Plus className="inline h-4 w-4" /></button>
      </div>
      <div className="mt-4 space-y-2">
        {cats?.map((c) => (
          <div key={c.id} className="glass grid items-center gap-2 rounded-xl p-3 sm:grid-cols-[120px_1fr_120px_auto]">
            <code className="text-xs text-muted-foreground">{c.slug}</code>
            <input defaultValue={c.name} onBlur={(e) => e.target.value !== c.name && update(c, { name: e.target.value })} className="rounded-lg bg-transparent px-2 py-1 text-sm outline-none focus:bg-white/5" />
            <div className="flex items-center gap-2"><span className="h-4 w-4 rounded-full" style={{ background: c.accent_color ?? "" }} />
              <input defaultValue={c.accent_color ?? ""} onBlur={(e) => e.target.value !== c.accent_color && update(c, { accent_color: e.target.value })} className="w-full rounded-lg bg-transparent px-2 py-1 font-mono text-xs outline-none focus:bg-white/5" />
            </div>
            <button onClick={() => remove(c.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
      </div>
    </section>
  );
}

function PromptManager() {
  const { data: prompts } = usePrompts();
  const { data: cats } = useCategories();
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <section className="glass rounded-3xl p-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-semibold">Prompts</h2>
        <NewPromptButton cats={cats ?? []} />
      </div>
      <div className="mt-4 space-y-2">
        {prompts?.map((p) => (
          <div key={p.id} className="glass rounded-2xl">
            <button onClick={() => setOpenId(openId === p.id ? null : p.id)} className="flex w-full items-center justify-between p-4 text-left">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 overflow-hidden rounded-lg bg-white/5">
                  {p.cover_image_url && <img src={p.cover_image_url} alt="" className="h-full w-full object-cover" />}
                </div>
                <div>
                  <div className="text-sm font-semibold">{p.title}</div>
                  <div className="text-xs text-muted-foreground">{p.categories.name} · /{p.slug}</div>
                </div>
              </div>
              <span className="text-xs text-muted-foreground">{openId === p.id ? "Close" : "Edit"}</span>
            </button>
            {openId === p.id && <PromptEditor prompt={p} cats={cats ?? []} onClose={() => setOpenId(null)} />}
          </div>
        ))}
      </div>
    </section>
  );
}

function NewPromptButton({ cats }: { cats: Category[] }) {
  const qc = useQueryClient();
  const create = async () => {
    if (cats.length === 0) { toast.error("Create a category first"); return; }
    const slug = `new-prompt-${Date.now()}`;
    const { error } = await supabase.from("prompts").insert({ slug, title: "New prompt", description: "", prompt_text: "", category_id: cats[0].id });
    if (error) toast.error(error.message); else { qc.invalidateQueries({ queryKey: ["prompts"] }); toast.success("Prompt created"); }
  };
  return <button onClick={create} className="rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground"><Plus className="inline h-4 w-4" /> New</button>;
}

function PromptEditor({ prompt, cats, onClose }: { prompt: Prompt & { categories: { slug: string; name: string; accent_color: string | null } }; cats: Category[]; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState<Prompt>(prompt);
  const [galleryText, setGalleryText] = useState(prompt.gallery_urls.join("\n"));
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const payload = { ...form, gallery_urls: galleryText.split("\n").map((s) => s.trim()).filter(Boolean) };
    const { error } = await supabase.from("prompts").update({
      title: payload.title, slug: payload.slug, description: payload.description,
      prompt_text: payload.prompt_text, category_id: payload.category_id,
      cover_image_url: payload.cover_image_url, demo_video_url: payload.demo_video_url,
      gallery_urls: payload.gallery_urls, is_published: payload.is_published,
    }).eq("id", form.id);
    setSaving(false);
    if (error) toast.error(error.message); else { toast.success("Saved"); qc.invalidateQueries({ queryKey: ["prompts"] }); qc.invalidateQueries({ queryKey: ["prompt", form.slug] }); }
  };
  const del = async () => {
    if (!confirm("Delete this prompt?")) return;
    const { error } = await supabase.from("prompts").delete().eq("id", form.id);
    if (error) toast.error(error.message); else { qc.invalidateQueries({ queryKey: ["prompts"] }); onClose(); }
  };

  const upload = async (file: File, kind: "cover" | "video") => {
    const path = `${form.slug}/${kind}-${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("elite-media").upload(path, file, { upsert: true });
    if (error) { toast.error(error.message); return; }
    const { data } = supabase.storage.from("elite-media").getPublicUrl(path);
    setForm({ ...form, [kind === "cover" ? "cover_image_url" : "demo_video_url"]: data.publicUrl });
    toast.success("Uploaded");
  };

  return (
    <div className="space-y-3 border-t border-border/40 p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Title"><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="glass w-full rounded-xl bg-transparent px-3 py-2 text-sm outline-none" /></Field>
        <Field label="Slug"><input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="glass w-full rounded-xl bg-transparent px-3 py-2 text-sm font-mono outline-none" /></Field>
        <Field label="Category">
          <select value={form.category_id ?? ""} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="glass w-full rounded-xl bg-transparent px-3 py-2 text-sm outline-none">
            {cats.map((c) => <option key={c.id} value={c.id} className="bg-background">{c.name}</option>)}
          </select>
        </Field>
        <Field label="Published">
          <label className="glass flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm">
            <input type="checkbox" checked={form.is_published} onChange={(e) => setForm({ ...form, is_published: e.target.checked })} /> Visible to public
          </label>
        </Field>
      </div>
      <Field label="Description"><textarea value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="glass w-full rounded-xl bg-transparent px-3 py-2 text-sm outline-none" /></Field>
      <Field label="Prompt text"><textarea value={form.prompt_text} onChange={(e) => setForm({ ...form, prompt_text: e.target.value })} rows={5} className="glass w-full rounded-xl bg-transparent px-3 py-2 font-mono text-sm outline-none" /></Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <MediaField label="Cover image" url={form.cover_image_url} accept="image/*" onUrl={(u) => setForm({ ...form, cover_image_url: u })} onFile={(f) => upload(f, "cover")} />
        <MediaField label="Demo video" url={form.demo_video_url} accept="video/*" onUrl={(u) => setForm({ ...form, demo_video_url: u })} onFile={(f) => upload(f, "video")} />
      </div>
      <Field label="Gallery URLs (one per line)"><textarea value={galleryText} onChange={(e) => setGalleryText(e.target.value)} rows={3} className="glass w-full rounded-xl bg-transparent px-3 py-2 font-mono text-xs outline-none" /></Field>

      <div className="flex justify-between">
        <button onClick={del} className="rounded-full border border-destructive/40 px-4 py-2 text-sm text-destructive hover:bg-destructive/10"><Trash2 className="inline h-4 w-4" /> Delete</button>
        <button onClick={save} disabled={saving} className="ring-glow rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground"><Save className="inline h-4 w-4" /> {saving ? "Saving…" : "Save"}</button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="mb-1 block text-xs text-muted-foreground">{label}</label>{children}</div>;
}

function MediaField({ label, url, accept, onUrl, onFile }: { label: string; url: string | null; accept: string; onUrl: (u: string) => void; onFile: (f: File) => void }) {
  return (
    <Field label={label}>
      <div className="space-y-2">
        <input value={url ?? ""} onChange={(e) => onUrl(e.target.value)} placeholder="https://…" className="glass w-full rounded-xl bg-transparent px-3 py-2 text-xs outline-none" />
        <label className="glass flex cursor-pointer items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs hover:bg-white/10">
          <Upload className="h-3.5 w-3.5" /> Upload file
          <input type="file" accept={accept} className="hidden" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
        </label>
      </div>
    </Field>
  );
}
