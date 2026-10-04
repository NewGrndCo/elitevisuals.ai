"use client";
import { useEffect, useRef, useState } from "react";
import { Save, X, Eye } from "@/components-next/icons";
import { fields, parsed, shown, rowId, titleOf, type Row, type Table } from "@/lib-next/cms-model";
import { cmsRequest, jsonRequest } from "@/lib-next/cms-request";
import { MediaUpload } from "./media-upload";

export function CmsEditor({
  table,
  row,
  onClose,
  onSaved,
  onBusy,
}: {
  table: Table;
  row: Row;
  onClose: () => void;
  onSaved: () => void;
  onBusy: (value: boolean) => void;
}) {
  const definitions = row.referenced
    ? fields.site_assets.filter((f) => f.key === "url")
    : fields[table];
  const [draft, setDraft] = useState<Record<string, string | boolean>>(() =>
    Object.fromEntries(
      definitions.map((f) => [
        f.key,
        f.type === "boolean"
          ? Boolean(row[f.key])
          : f.type === "datetime" && row[f.key]
            ? new Date(
                new Date(String(row[f.key])).getTime() - new Date().getTimezoneOffset() * 60000,
              )
                .toISOString()
                .slice(0, 16)
            : shown(row[f.key], f),
      ]),
    ),
  );
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    onBusy(busy || uploading);
    return () => onBusy(false);
  }, [busy, uploading, onBusy]);
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    form.current?.querySelector<HTMLInputElement>("input")?.focus();
  }, []);
  useEffect(() => {
    const protect = (e: BeforeUnloadEvent) => {
      if (dirty || uploading) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", protect);
    return () => window.removeEventListener("beforeunload", protect);
  }, [dirty, uploading]);
  const update = (key: string, value: string | boolean) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setDirty(true);
  };
  const close = () => {
    if (!busy && !uploading && (!dirty || window.confirm("Discard unsaved changes?"))) onClose();
  };
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy || uploading) return;
    setBusy(true);
    setError("");
    try {
      const data = Object.fromEntries(
        definitions.map((f) => [f.key, parsed(draft[f.key] ?? "", f)]),
      );
      const id = rowId(row);
      await cmsRequest(
        `/api/admin/content?table=${table}`,
        jsonRequest(
          id ? "PATCH" : "POST",
          id ? { id, patch: data, expectedUpdatedAt: row.updated_at ?? "" } : { data },
        ),
      );
      setDirty(false);
      onSaved();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <form ref={form} className="admin-editor" onSubmit={save} aria-label="Content editor">
      <header>
        <div>
          <p className="kicker">{rowId(row) ? "Edit content" : "Create draft"}</p>
          <h3>{titleOf(row)}</h3>
        </div>
        <button
          type="button"
          className="admin-icon"
          aria-label="Close editor"
          disabled={busy || uploading}
          onClick={close}
        >
          <X size={18} />
        </button>
      </header>
      {Boolean(row.referenced) && (
        <p>This asset is used by existing content. Saving replaces that content’s media.</p>
      )}
      <fieldset disabled={busy || uploading} className="admin-fields">
        {definitions.map((f) => (
          <div
            key={f.key}
            className={["textarea", "json"].includes(f.type ?? "") || f.upload ? "wide" : ""}
          >
            {f.type === "boolean" ? (
              <label className="admin-check">
                <input
                  type="checkbox"
                  checked={Boolean(draft[f.key])}
                  onChange={(e) => update(f.key, e.target.checked)}
                />
                {f.label}
              </label>
            ) : (
              <>
                <label htmlFor={`field-${f.key}`}>
                  {f.label}
                  {f.required ? " *" : ""}
                </label>
                {["textarea", "json"].includes(f.type ?? "") ? (
                  <textarea
                    id={`field-${f.key}`}
                    rows={f.type === "json" ? 8 : 4}
                    required={f.required}
                    value={String(draft[f.key] ?? "")}
                    onChange={(e) => update(f.key, e.target.value)}
                  />
                ) : (
                  <input
                    id={`field-${f.key}`}
                    type={
                      f.type === "number"
                        ? "number"
                        : f.type === "datetime"
                          ? "datetime-local"
                          : f.key === "email"
                            ? "email"
                            : "text"
                    }
                    required={f.required}
                    readOnly={f.key === "key" && Boolean(row.key)}
                    value={String(draft[f.key] ?? "")}
                    onChange={(e) => update(f.key, e.target.value)}
                  />
                )}
              </>
            )}
            {f.type === "datetime" && (
              <small>
                Uses your local timezone. Enable Published to schedule; leave empty to publish
                immediately.
              </small>
            )}
          </div>
        ))}
      </fieldset>
      {definitions
        .filter((f) => f.upload)
        .map((f) => (
          <section className="editor-media" key={f.key}>
            <h4>{f.label}</h4>
            <MediaUpload
              disabled={busy || uploading}
              kind={f.upload!.kind}
              value={String(draft[f.key] || "")}
              onChange={(url) => update(f.key, url)}
              onBusy={setUploading}
            />
          </section>
        ))}
      {preview && (
        <section className="editor-preview" aria-label="Draft preview">
          <p className="kicker">
            Unsaved preview · {draft.is_published ? "Publication enabled" : "Draft"}
          </p>
          {draft.cover_image_url && <img src={String(draft.cover_image_url)} alt="Draft cover" />}
          <h2>{String(draft.title || draft.name || "Untitled")}</h2>
          <p>{String(draft.description || draft.summary || "")}</p>
          {draft.prompt_text && <pre>{String(draft.prompt_text)}</pre>}
        </section>
      )}
      {error && (
        <div className="admin-error" role="alert">
          {error}
        </div>
      )}
      <div className="editor-savebar">
        <span role="status">
          {uploading ? "Upload in progress" : dirty ? "Unsaved changes" : "Ready to edit"}
        </span>
        <button
          type="button"
          className="button button-outline"
          onClick={() => setPreview((v) => !v)}
        >
          <Eye size={16} />
          Preview
        </button>
        <button className="button button-solid" disabled={busy || uploading}>
          <Save size={16} />
          {busy ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
