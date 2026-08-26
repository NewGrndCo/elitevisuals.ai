import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSkills, useSkillVersions, type Skill } from "@/lib/queries";
const slugify = (v: string) =>
  v
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
export function SkillManager() {
  const qc = useQueryClient();
  const { data = [] } = useSkills(true);
  const [selected, setSelected] = useState<Skill | null>(null);
  const create = async () => {
    const title = "New skill";
    const { data: s, error } = await supabase
      .from("skills")
      .insert({ title, slug: `new-skill-${Date.now().toString(36)}` })
      .select()
      .single();
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["skills"] });
    setSelected(s as Skill);
  };
  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold">Downloadable skills</h2>
          <p className="text-sm text-muted-foreground">
            Listings, ZIP versions, pricing, and publishing.
          </p>
        </div>
        <button
          onClick={create}
          className="rounded-xl bg-primary px-4 py-2 font-semibold text-primary-foreground"
        >
          New skill
        </button>
      </div>
      {selected ? (
        <Editor
          skill={selected}
          done={() => {
            setSelected(null);
            qc.invalidateQueries({ queryKey: ["skills"] });
          }}
        />
      ) : (
        <div className="grid gap-3">
          {data.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelected(s)}
              className="glass flex items-center justify-between rounded-2xl p-5 text-left"
            >
              <span>
                <b>{s.title}</b>
                <small className="mt-1 block text-muted-foreground">
                  /{s.slug} ·{" "}
                  {s.price_cents === 0 ? "Free" : `$${(s.price_cents / 100).toFixed(2)}`}
                </small>
              </span>
              <span
                className={`rounded-full px-3 py-1 text-xs ${s.is_published ? "bg-emerald-400/15 text-emerald-300" : "bg-white/10"}`}
              >
                {s.is_published ? "Published" : "Draft"}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
function Editor({ skill, done }: { skill: Skill; done: () => void }) {
  const [f, setF] = useState(skill);
  const { data: versions = [] } = useSkillVersions(skill.id, true);
  const save = async () => {
    const { error } = await supabase
      .from("skills")
      .update({
        title: f.title,
        slug: slugify(f.slug),
        summary: f.summary,
        description: f.description,
        install_instructions: f.install_instructions,
        cover_image_url: f.cover_image_url || null,
        compatibility: f.compatibility,
        price_cents: f.price_cents,
        is_featured: f.is_featured,
        is_published: f.is_published,
      })
      .eq("id", skill.id);
    if (error) return toast.error(error.message);
    toast.success("Skill saved");
    done();
  };
  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".zip")) return toast.error("Upload a ZIP file");
    const version = prompt("Version (example: 1.0.0)", "1.0.0");
    if (!version) return;
    const hash = Array.from(
      new Uint8Array(await crypto.subtle.digest("SHA-256", await file.arrayBuffer())),
    )
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    const path = `${skill.id}/${version}/${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
    const up = await supabase.storage
      .from("skill-packages")
      .upload(path, file, { contentType: "application/zip" });
    if (up.error) return toast.error(up.error.message);
    const { error } = await supabase.from("skill_versions").insert({
      skill_id: skill.id,
      version,
      storage_path: path,
      file_size: file.size,
      sha256: hash,
      is_published: true,
    });
    if (error) return toast.error(error.message);
    toast.success("Version uploaded");
    location.reload();
  };
  return (
    <div className="glass rounded-3xl p-6">
      <button onClick={done} className="mb-5 text-sm text-muted-foreground">
        ← All skills
      </button>
      <div className="grid gap-3">
        <input
          value={f.title}
          onChange={(e) => setF({ ...f, title: e.target.value })}
          className="rounded-xl bg-black/20 p-3"
          placeholder="Title"
        />
        <input
          value={f.slug}
          onChange={(e) => setF({ ...f, slug: e.target.value })}
          className="rounded-xl bg-black/20 p-3"
          placeholder="slug"
        />
        <textarea
          value={f.summary}
          onChange={(e) => setF({ ...f, summary: e.target.value })}
          className="rounded-xl bg-black/20 p-3"
          placeholder="Short summary"
        />
        <textarea
          value={f.description}
          onChange={(e) => setF({ ...f, description: e.target.value })}
          className="min-h-32 rounded-xl bg-black/20 p-3"
          placeholder="Description"
        />
        <textarea
          value={f.install_instructions}
          onChange={(e) => setF({ ...f, install_instructions: e.target.value })}
          className="rounded-xl bg-black/20 p-3"
          placeholder="Install instructions"
        />
        <input
          value={f.cover_image_url ?? ""}
          onChange={(e) => setF({ ...f, cover_image_url: e.target.value })}
          className="rounded-xl bg-black/20 p-3"
          placeholder="Cover image URL"
        />
        <label>
          Price in cents{" "}
          <input
            type="number"
            value={f.price_cents}
            onChange={(e) => setF({ ...f, price_cents: Number(e.target.value) })}
            className="ml-3 rounded-lg bg-black/20 p-2"
          />
        </label>
        <label>
          <input
            type="checkbox"
            checked={f.is_published}
            onChange={(e) => setF({ ...f, is_published: e.target.checked })}
          />{" "}
          Published
        </label>
        <button
          onClick={save}
          className="rounded-xl bg-primary p-3 font-bold text-primary-foreground"
        >
          Save skill
        </button>
      </div>
      <div className="mt-8 border-t border-white/10 pt-6">
        <h3 className="font-semibold">Versions ({versions.length})</h3>
        <input
          type="file"
          accept=".zip,application/zip"
          onChange={upload}
          className="mt-4 block text-sm"
        />
        {versions.map((v) => (
          <p key={v.id} className="mt-2 text-sm text-muted-foreground">
            v{v.version} · {(v.file_size / 1024 / 1024).toFixed(1)} MB
          </p>
        ))}
      </div>
    </div>
  );
}
