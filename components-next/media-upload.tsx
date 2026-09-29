"use client";
import { useEffect, useRef, useState } from "react";
import { Upload, X, FolderOpen } from "lucide-react";
import { cmsRequest } from "@/lib-next/cms-request";
import { CHUNK_SIZE, fileError } from "@/lib-next/upload-policy";
import type { Row } from "@/lib-next/cms-model";

export function MediaUpload({
  kind,
  value = "",
  onChange,
  onBusy,
  multiple = false,
  disabled = false,
}: {
  kind: string;
  value?: string;
  onChange: (url: string) => void;
  onBusy: (busy: boolean) => void;
  multiple?: boolean;
  disabled?: boolean;
}) {
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [drag, setDrag] = useState(false);
  const [assets, setAssets] = useState<Row[] | null>(null);
  const [query, setQuery] = useState("");
  const [localPreview, setLocalPreview] = useState("");
  const [localType, setLocalType] = useState("");
  const controller = useRef<AbortController | null>(null);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => () => controller.current?.abort(), []);
  useEffect(
    () => () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
    },
    [localPreview],
  );
  const upload = async (files: File[]) => {
    if (!files.length || controller.current || disabled) return;
    const picked = multiple ? files : files.slice(0, 1);
    for (const file of picked) {
      const problem = fileError(kind, file.name, file.type, file.size);
      if (problem) {
        setError(`${file.name}: ${problem}`);
        return;
      }
    }
    const abort = new AbortController();
    controller.current = abort;
    onBusy(true);
    setError("");
    setNotice("");
    setProgress(0);
    setLocalPreview(URL.createObjectURL(picked[0]));
    setLocalType(picked[0].type);
    let completed = 0;
    try {
      for (const file of picked) {
        const total = Math.ceil(file.size / CHUNK_SIZE);
        const base = new URLSearchParams({
          kind,
          uploadId: crypto.randomUUID(),
          total: String(total),
        });
        const headers = {
          "content-type": "application/octet-stream",
          "x-file-name": encodeURIComponent(file.name),
          "x-file-type": file.type || "application/octet-stream",
        };
        for (let index = 0; index < total; index++) {
          await cmsRequest(`/api/admin/upload?${base}&stage=chunk&index=${index}`, {
            method: "POST",
            headers,
            signal: abort.signal,
            body: file.slice(index * CHUNK_SIZE, (index + 1) * CHUNK_SIZE),
          });
          setProgress(Math.round(((completed + (index + 1) / (total + 1)) / picked.length) * 100));
        }
        const result = await cmsRequest<{ url: string }>(
          `/api/admin/upload?${base}&stage=complete`,
          { method: "POST", headers, signal: abort.signal },
        );
        completed++;
        onChange(result.url);
      }
      setNotice(
        `${completed} file${completed === 1 ? "" : "s"} uploaded. Save content to use the selection.`,
      );
    } catch (cause) {
      setError(
        abort.signal.aborted
          ? "Upload cancelled. You can select the file again."
          : `${completed ? `${completed} file(s) uploaded. ` : ""}${cause instanceof Error ? cause.message : "Upload failed. Select the file again to retry."}`,
      );
    } finally {
      controller.current = null;
      setProgress(null);
      onBusy(false);
    }
  };
  const library = async () => {
    setError("");
    try {
      const result = await cmsRequest("/api/admin/content?table=site_assets");
      setAssets(result.data);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load media.");
    }
  };
  const preview = localPreview || value;
  const isVideo = localPreview
    ? localType.startsWith("video/")
    : /\.(mp4|webm|mov)(\?|$)/i.test(value);
  const isImage = localPreview
    ? localType.startsWith("image/")
    : /\.(png|jpe?g|gif|webp|avif)(\?|$)/i.test(value);
  const accept =
    kind === "skill-package"
      ? ".zip"
      : kind === "prompt-demo"
        ? "video/mp4,video/webm,video/quicktime"
        : kind === "site-asset"
          ? "image/png,image/jpeg,image/webp,image/gif,image/avif,video/mp4,video/webm,video/quicktime,application/pdf"
          : "image/png,image/jpeg,image/webp,image/gif,image/avif";
  return (
    <div className="media-upload">
      {preview &&
        (isVideo ? (
          <video className="upload-preview" src={preview} controls preload="metadata" />
        ) : isImage ? (
          <img className="upload-preview" src={preview} alt="Selected media preview" />
        ) : (
          <p className="upload-file">File selected</p>
        ))}
      <div
        className={`upload-dropzone ${drag ? "dragging" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          void upload(Array.from(e.dataTransfer.files));
        }}
      >
        <input
          ref={input}
          type="file"
          accept={accept}
          multiple={multiple}
          hidden
          onChange={(e) => {
            void upload(Array.from(e.target.files ?? []));
            e.target.value = "";
          }}
        />
        <button
          type="button"
          className="button button-outline"
          disabled={disabled || progress !== null}
          onClick={() => input.current?.click()}
        >
          <Upload size={16} />
          {value ? "Replace file" : multiple ? "Choose files" : "Choose file"}
        </button>
        <small>or drop {multiple ? "files" : "a file"} here · up to 18 MB each</small>
      </div>
      {progress !== null && (
        <div role="status">
          <progress value={progress} max={100} aria-label="Upload progress" /> {progress}%{" "}
          <button type="button" onClick={() => controller.current?.abort()}>
            Cancel upload
          </button>
        </div>
      )}
      <div className="admin-actions">
        <button
          type="button"
          className="button button-outline"
          onClick={() => void library()}
          disabled={disabled || progress !== null}
        >
          <FolderOpen size={16} />
          Choose from library
        </button>
        {value && (
          <button
            type="button"
            className="button button-outline"
            disabled={disabled || progress !== null}
            onClick={() => {
              onChange("");
              setLocalPreview("");
            }}
          >
            <X size={16} />
            Remove selection
          </button>
        )}
      </div>
      {error && (
        <p className="admin-error" role="alert">
          {error}
        </p>
      )}
      {notice && (
        <p className="admin-success" role="status">
          {notice}
        </p>
      )}
      {assets && (
        <section className="media-picker" aria-label="Media library">
          <div className="admin-actions">
            <label>
              Search media
              <input value={query} onChange={(e) => setQuery(e.target.value)} />
            </label>
            <button type="button" onClick={() => setAssets(null)}>
              Close library
            </button>
          </div>
          <div className="media-picker-grid">
            {assets
              .filter((asset) => {
                const url = String(asset.url || "");
                const compatible =
                  kind === "skill-package"
                    ? /\.zip$/i.test(url)
                    : kind === "prompt-demo"
                      ? asset.asset_type === "video"
                      : kind === "site-asset"
                        ? !/\.zip$/i.test(url)
                        : ["image", "icon"].includes(String(asset.asset_type));
                return (
                  compatible &&
                  `${asset.name} ${asset.alt_text}`.toLowerCase().includes(query.toLowerCase())
                );
              })
              .slice(0, 60)
              .map((asset) => (
                <button
                  type="button"
                  key={String(asset.id)}
                  onClick={() => {
                    onChange(String(asset.url));
                    setLocalPreview("");
                    setAssets(null);
                  }}
                >
                  {["image", "icon"].includes(String(asset.asset_type)) && (
                    <img src={String(asset.url)} alt="" loading="lazy" />
                  )}
                  <span>{String(asset.name || "Media")}</span>
                </button>
              ))}
          </div>
          <small>Showing up to 60 matching assets. Search to narrow the selection.</small>
        </section>
      )}
    </div>
  );
}
