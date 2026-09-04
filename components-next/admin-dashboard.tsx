"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Eye,
  EyeOff,
  Loader2,
  Lock,
  LogOut,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  Upload,
  X,
} from "lucide-react";

const tabs = [
  ["packs", "Prompt Packs"],
  ["prompts", "Prompts"],
  ["skills", "Skills"],
  ["resources", "Resources"],
  ["site_assets", "Site Assets"],
  ["site_content", "Page Copy"],
  ["categories", "Categories"],
  ["ai_logos", "AI Models"],
] as const;
type Table = (typeof tabs)[number][0];
type Row = Record<string, unknown> & { id?: string; key?: string };
type Field = {
  key: string;
  label: string;
  type?: "text" | "textarea" | "number" | "boolean" | "json";
  required?: boolean;
  upload?: { kind: string; accept: string; label: string };
};
const f = (key: string, label: string, type: Field["type"] = "text", required = false): Field => ({
  key,
  label,
  type,
  required,
});
const fields: Record<Table, Field[]> = {
  packs: [
    f("title", "Title", "text", true),
    f("slug", "URL slug", "text", true),
    f("description", "Description", "textarea"),
    f("cover_image_url", "Cover image URL"),
    f("sort_order", "Sort order", "number"),
    f("is_published", "Published", "boolean"),
  ],
  prompts: [
    f("title", "Title", "text", true),
    f("slug", "URL slug", "text", true),
    f("description", "Description", "textarea"),
    f("prompt_text", "Prompt text", "textarea", true),
    {
      ...f("cover_image_url", "Cover image URL"),
      upload: { kind: "prompt-cover", accept: "image/*", label: "Upload cover" },
    },
    {
      ...f("demo_video_url", "Demo video URL"),
      upload: { kind: "prompt-demo", accept: "video/*", label: "Upload video" },
    },
    f("gallery_urls", "Gallery URLs (one per line)", "textarea"),
    f("category_id", "Category ID"),
    f("pack_id", "Pack ID"),
    f("sort_order", "Sort order", "number"),
    f("is_published", "Published", "boolean"),
  ],
  skills: [
    f("title", "Title", "text", true),
    f("slug", "URL slug", "text", true),
    f("summary", "Summary", "textarea"),
    f("description", "Description", "textarea"),
    {
      ...f("cover_image_url", "Cover image URL"),
      upload: { kind: "skill-cover", accept: "image/*", label: "Upload cover" },
    },
    {
      ...f("download_url", "Skill ZIP URL"),
      upload: { kind: "skill-package", accept: ".zip,application/zip", label: "Upload ZIP" },
    },
    f("compatibility", "Compatibility (one per line)", "textarea"),
    f("install_instructions", "Install instructions", "textarea"),
    f("price_cents", "Price in cents", "number"),
    f("sort_order", "Sort order", "number"),
    f("is_featured", "Featured", "boolean"),
    f("is_published", "Published", "boolean"),
  ],
  resources: [
    f("title", "Title", "text", true),
    f("slug", "URL slug", "text", true),
    f("description", "Description", "textarea"),
    f("url", "Destination URL", "text", true),
    {
      ...f("image_url", "Image URL"),
      upload: { kind: "resource-image", accept: "image/*", label: "Upload image" },
    },
    f("resource_type", "Type"),
    f("tags", "Tags (one per line)", "textarea"),
    f("sort_order", "Sort order", "number"),
    f("is_featured", "Featured", "boolean"),
    f("is_published", "Published", "boolean"),
  ],
  site_assets: [
    f("name", "Name", "text", true),
    f("asset_key", "Asset key", "text", true),
    f("asset_type", "Asset type"),
    f("url", "Asset URL", "text", true),
    f("alt_text", "Alt text"),
    f("notes", "Notes", "textarea"),
    f("is_published", "Published", "boolean"),
  ],
  site_content: [
    f("key", "Section key", "text", true),
    f("value", "Section copy (JSON)", "json", true),
  ],
  categories: [
    f("name", "Name", "text", true),
    f("slug", "URL slug", "text", true),
    f("description", "Description", "textarea"),
    f("accent_color", "Accent color"),
    f("sort_order", "Sort order", "number"),
  ],
  ai_logos: [
    f("name", "Name", "text", true),
    f("logo_url", "Logo URL"),
    f("image_url", "Image URL"),
    f("sort_order", "Sort order", "number"),
    f("is_published", "Published", "boolean"),
  ],
};
const rowId = (row: Row) => String(row.id ?? row.key ?? "");
const shown = (value: unknown, field: Field) =>
  field.type === "json"
    ? JSON.stringify(value ?? {}, null, 2)
    : Array.isArray(value)
      ? value.join("\n")
      : value == null
        ? ""
        : String(value);
function parsed(value: string | boolean, field: Field) {
  if (field.type === "boolean") return Boolean(value);
  if (field.type === "number") return Number(value || 0);
  if (field.type === "json") return JSON.parse(String(value || "{}"));
  if (["gallery_urls", "compatibility", "tags"].includes(field.key))
    return String(value)
      .split("\n")
      .map((v) => v.trim())
      .filter(Boolean);
  return value === "" &&
    [
      "category_id",
      "pack_id",
      "cover_image_url",
      "demo_video_url",
      "image_url",
      "logo_url",
      "download_url",
    ].includes(field.key)
    ? null
    : value;
}

export function AdminDashboard() {
  const [unlocked, setUnlocked] = useState(false),
    [pin, setPin] = useState(""),
    [tab, setTab] = useState<Table>("packs"),
    [rows, setRows] = useState<Row[]>([]),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [editing, setEditing] = useState<Row | null>(null),
    [uploading, setUploading] = useState<string | null>(null),
    [uploadProgress, setUploadProgress] = useState(0),
    [draft, setDraft] = useState<Record<string, string | boolean>>({});
  const activeFields = useMemo(() => fields[tab], [tab]);
  const load = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/content?table=${tab}`, { cache: "no-store" });
      const body = await response.json();
      if (response.status === 401) {
        setUnlocked(false);
        return;
      }
      if (!response.ok) throw new Error(body.error || "Unable to load admin data");
      setRows(body.data || []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load admin data");
    } finally {
      setBusy(false);
    }
  }, [tab]);
  useEffect(() => {
    if (unlocked) void load();
  }, [unlocked, load]);
  const openEditor = (row?: Row) => {
    const source = row ?? {};
    setEditing(row ?? {});
    setDraft(
      Object.fromEntries(
        activeFields.map((field) => [
          field.key,
          field.type === "boolean" ? Boolean(source[field.key]) : shown(source[field.key], field),
        ]),
      ),
    );
    setError("");
    setMessage("");
  };
  const unlock = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    const response = await fetch("/api/admin/session", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ pin }),
    });
    const body = await response.json();
    setBusy(false);
    if (!response.ok) {
      setError(body.error || "Unable to unlock");
      return;
    }
    setUnlocked(true);
    setPin("");
  };
  const uploadFile = async (field: Field, file?: File) => {
    if (!field.upload || !file) return;
    if (file.size > 18 * 1024 * 1024) {
      setError("Files must be 18 MB or smaller.");
      return;
    }
    const chunkSize = 4 * 1024 * 1024;
    const total = Math.ceil(file.size / chunkSize);
    const uploadId = crypto.randomUUID();
    const base = new URLSearchParams({
      kind: field.upload.kind,
      uploadId,
      total: String(total),
    });
    const headers = {
      "content-type": "application/octet-stream",
      "x-file-name": encodeURIComponent(file.name),
      "x-file-type": file.type || "application/octet-stream",
    };
    try {
      setUploading(field.key);
      setUploadProgress(0);
      setError("");
      for (let index = 0; index < total; index += 1) {
        const response = await fetch(`/api/admin/upload?${base}&stage=chunk&index=${index}`, {
          method: "POST",
          headers,
          body: file.slice(index * chunkSize, Math.min(file.size, (index + 1) * chunkSize)),
        });
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || "Upload failed");
        setUploadProgress(Math.round(((index + 1) / (total + 1)) * 100));
      }
      const response = await fetch(`/api/admin/upload?${base}&stage=complete`, {
        method: "POST",
        headers,
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Upload could not be completed");
      setDraft((current) => ({ ...current, [field.key]: body.url }));
      setMessage(`${file.name} uploaded. Save the item to publish this file.`);
      setUploadProgress(100);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Upload failed");
    } finally {
      setUploading(null);
    }
  };
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editing) return;
    try {
      setBusy(true);
      setError("");
      const data = Object.fromEntries(
        activeFields.map((field) => [field.key, parsed(draft[field.key] ?? "", field)]),
      );
      const id = rowId(editing),
        creating = !id;
      const response = await fetch(`/api/admin/content?table=${tab}`, {
        method: creating ? "POST" : "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(creating ? { data } : { id, patch: data }),
      });
      const body = await response.json();
      setBusy(false);
      if (!response.ok) {
        setError(body.error || "Save failed");
        return;
      }
      setEditing(null);
      setMessage(creating ? "Item created." : "Changes saved.");
      await load();
    } catch (cause) {
      setBusy(false);
      setError(cause instanceof Error ? cause.message : "Invalid form value");
    }
  };
  const publish = async (row: Row) => {
    const response = await fetch(`/api/admin/content?table=${tab}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: rowId(row), patch: { is_published: !row.is_published } }),
    });
    const body = await response.json();
    if (!response.ok) setError(body.error || "Update failed");
    else await load();
  };
  const remove = async (row: Row) => {
    if (
      !window.confirm(
        `Permanently delete ${String(row.title || row.name || row.key || "this item")}?`,
      )
    )
      return;
    const response = await fetch(`/api/admin/content?table=${tab}`, {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: rowId(row) }),
    });
    const body = await response.json();
    if (!response.ok) setError(body.error || "Delete failed");
    else {
      setMessage("Item deleted.");
      await load();
    }
  };
  const lock = async () => {
    await fetch("/api/admin/session", { method: "DELETE" });
    setUnlocked(false);
    setRows([]);
  };
  if (!unlocked)
    return (
      <main className="admin-gate">
        <form onSubmit={unlock} className="admin-pin">
          <div className="admin-lock">
            <Lock />
          </div>
          <p className="kicker">Elite Visuals CMS</p>
          <h1>Admin access</h1>
          <p>Enter your four-digit PIN.</p>
          <input
            aria-label="Admin PIN"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={4}
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
          />
          {error && <div className="admin-error">{error}</div>}
          <button className="button button-solid" disabled={busy || pin.length !== 4}>
            {busy ? <Loader2 className="spin" /> : "Unlock"}
          </button>
        </form>
      </main>
    );
  return (
    <main className="admin-page">
      <aside>
        <div>
          <p className="kicker">Elite Visuals</p>
          <h1>CMS</h1>
        </div>
        <nav>
          {tabs.map(([key, label]) => (
            <button
              key={key}
              onClick={() => {
                setTab(key);
                setEditing(null);
              }}
              className={tab === key ? "active" : ""}
            >
              {label}
            </button>
          ))}
        </nav>
        <button onClick={lock}>
          <LogOut size={15} /> Lock
        </button>
      </aside>
      <section>
        <header>
          <div>
            <p className="kicker">Manage the live site</p>
            <h2>{tabs.find(([key]) => key === tab)?.[1]}</h2>
          </div>
          <div className="admin-actions">
            <button onClick={load} className="admin-icon" aria-label="Refresh">
              <RefreshCw size={17} />
            </button>
            <button onClick={() => openEditor()} className="button button-solid" disabled={busy}>
              <Plus size={16} /> Add new
            </button>
          </div>
        </header>
        {error && <div className="admin-error admin-config-error">{error}</div>}
        {message && <div className="admin-success">{message}</div>}
        {editing && (
          <form className="admin-editor" onSubmit={save}>
            <header>
              <div>
                <p className="kicker">{rowId(editing) ? "Edit item" : "Create item"}</p>
                <h3>{String(editing.title || editing.name || editing.key || "New content")}</h3>
              </div>
              <button
                type="button"
                className="admin-icon"
                onClick={() => setEditing(null)}
                aria-label="Close editor"
              >
                <X size={17} />
              </button>
            </header>
            <div className="admin-fields">
              {activeFields.map((field) => (
                <div
                  key={field.key}
                  className={field.type === "textarea" || field.type === "json" ? "wide" : ""}
                >
                  {field.type === "boolean" ? (
                    <label className="admin-check">
                      <input
                        type="checkbox"
                        checked={Boolean(draft[field.key])}
                        onChange={(e) =>
                          setDraft((current) => ({ ...current, [field.key]: e.target.checked }))
                        }
                      />{" "}
                      {field.label}
                    </label>
                  ) : (
                    <>
                      <label htmlFor={`admin-field-${field.key}`}>{field.label}</label>
                      {field.type === "textarea" || field.type === "json" ? (
                        <textarea
                          id={`admin-field-${field.key}`}
                          rows={field.type === "json" ? 10 : 5}
                          required={field.required}
                          value={String(draft[field.key] ?? "")}
                          onChange={(e) =>
                            setDraft((current) => ({ ...current, [field.key]: e.target.value }))
                          }
                        />
                      ) : (
                        <>
                          <input
                            id={`admin-field-${field.key}`}
                            type={field.type === "number" ? "number" : "text"}
                            required={field.required}
                            value={String(draft[field.key] ?? "")}
                            onChange={(e) =>
                              setDraft((current) => ({ ...current, [field.key]: e.target.value }))
                            }
                          />
                          {field.upload && (
                            <span className="admin-upload-row">
                              <label className="button button-outline admin-upload-button">
                                {uploading === field.key ? (
                                  <Loader2 className="spin" size={15} />
                                ) : (
                                  <Upload size={15} />
                                )}
                                {uploading === field.key
                                  ? `Uploading ${uploadProgress}%`
                                  : field.upload.label}
                                <input
                                  type="file"
                                  accept={field.upload.accept}
                                  disabled={Boolean(uploading)}
                                  onChange={(event) => {
                                    void uploadFile(field, event.target.files?.[0]);
                                    event.target.value = "";
                                  }}
                                />
                              </label>
                              <small>Up to 18 MB</small>
                            </span>
                          )}
                        </>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
            <button className="button button-solid" disabled={busy}>
              <Save size={16} /> {busy ? "Saving…" : "Save changes"}
            </button>
          </form>
        )}
        {busy && !editing ? (
          <div className="admin-loading">
            <Loader2 className="spin" /> Loading
          </div>
        ) : (
          <div className="admin-list">
            {rows.map((row) => {
              const published = typeof row.is_published === "boolean" ? row.is_published : null;
              const media = row.cover_image_url || row.image_url || row.logo_url;
              return (
                <article key={rowId(row)}>
                  <div className="admin-thumb">
                    {typeof media === "string" && media ? (
                      <img src={media} alt="" />
                    ) : (
                      <span>{String(row.title || row.name || row.key || "A").slice(0, 1)}</span>
                    )}
                  </div>
                  <div>
                    <h3>
                      {String(row.title || row.name || row.asset_key || row.key || "Untitled")}
                    </h3>
                    <p>{String(row.slug || row.resource_type || row.asset_type || "")}</p>
                  </div>
                  {published !== null && (
                    <button
                      className={`publish ${published ? "live" : "draft"}`}
                      onClick={() => void publish(row)}
                      disabled={busy}
                    >
                      {published ? <Eye size={14} /> : <EyeOff size={14} />}{" "}
                      {published ? "Live" : "Draft"}
                    </button>
                  )}
                  <button
                    className="admin-edit"
                    onClick={() => openEditor(row)}
                    disabled={busy}
                    aria-label="Edit"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    className="admin-delete"
                    onClick={() => void remove(row)}
                    disabled={busy}
                    aria-label="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </article>
              );
            })}
            {!rows.length && !error && (
              <div className="empty-state">
                <h3>No items found.</h3>
                <p>Create the first item with “Add new.”</p>
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
