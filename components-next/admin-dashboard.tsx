"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Archive,
  Copy,
  Download,
  Eye,
  Loader2,
  Lock,
  LogOut,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import {
  tabs,
  fields,
  rowId,
  titleOf,
  statusOf,
  previewPath,
  type Row,
  type Table,
} from "@/lib-next/cms-model";
import { cmsRequest, jsonRequest, RequestError } from "@/lib-next/cms-request";
import { CmsEditor } from "./cms-editor";
import { MediaUpload } from "./media-upload";

const pageSize = 20;
export function AdminDashboard() {
  const [unlocked, setUnlocked] = useState(false),
    [checking, setChecking] = useState(true),
    [pin, setPin] = useState("");
  const [tab, setTab] = useState<Table>("packs"),
    [rows, setRows] = useState<Row[]>([]),
    [overview, setOverview] = useState(true);
  const [summary, setSummary] = useState<{ table: Table; rows: Row[] }[]>([]);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  const [editing, setEditing] = useState<Row | null>(null),
    [search, setSearch] = useState(""),
    [filter, setFilter] = useState("all"),
    [sort, setSort] = useState("recent"),
    [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]),
    [uploading, setUploading] = useState(false);
  const requestVersion = useRef(0);
  const handleError = useCallback((cause: unknown) => {
    setError(cause instanceof Error ? cause.message : "Unable to complete the request.");
    if (cause instanceof RequestError && cause.status === 401) {
      setUnlocked(false);
    }
  }, []);
  useEffect(() => {
    void cmsRequest<{ authenticated: boolean }>("/api/admin/session")
      .then((r) => setUnlocked(r.authenticated))
      .catch(handleError)
      .finally(() => setChecking(false));
  }, [handleError]);
  const load = useCallback(async () => {
    const version = ++requestVersion.current;
    setBusy(true);
    setError("");
    try {
      if (overview) {
        const result = await Promise.all(
          tabs
            .filter(([t]) => ["packs", "prompts", "skills", "resources", "site_assets"].includes(t))
            .map(async ([table]) => ({
              table,
              rows: (await cmsRequest(`/api/admin/content?table=${table}`)).data as Row[],
            })),
        );
        if (version === requestVersion.current) setSummary(result);
      } else {
        const result = await cmsRequest(
          tab === "members" ? "/api/admin/members" : `/api/admin/content?table=${tab}`,
        );
        if (version === requestVersion.current) {
          setRows(result.data as Row[]);
          setSelected([]);
        }
      }
    } catch (cause) {
      if (version === requestVersion.current) handleError(cause);
    } finally {
      if (version === requestVersion.current) setBusy(false);
    }
  }, [tab, overview, handleError]);
  useEffect(() => {
    if (unlocked) void load();
    const requestVersionAtEffectStart = requestVersion;
    return () => {
      requestVersionAtEffectStart.current++;
    };
  }, [unlocked, load]);
  const navigate = (next: Table | null) => {
    if (uploading) return;
    if (editing && !window.confirm("Close the editor? Unsaved changes will be lost.")) return;
    setEditing(null);
    setOverview(next === null);
    if (next) setTab(next);
    setRows([]);
    setSearch("");
    setFilter("all");
    setPage(1);
    setSelected([]);
    setMessage("");
  };
  const filtered = useMemo(
    () =>
      rows
        .filter(
          (row) =>
            `${titleOf(row)} ${row.slug || ""} ${row.description || ""}`
              .toLowerCase()
              .includes(search.toLowerCase()) &&
            (filter === "all" || statusOf(row) === filter),
        )
        .sort((a, b) =>
          sort === "title"
            ? titleOf(a).localeCompare(titleOf(b))
            : sort === "order"
              ? Number(a.sort_order || 0) - Number(b.sort_order || 0)
              : String(b.updated_at || b.created_at || "").localeCompare(
                  String(a.updated_at || a.created_at || ""),
                ),
        ),
    [rows, search, filter, sort],
  );
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize)),
    currentPage = Math.min(page, pageCount);
  const visible = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const mutate = async (row: Row, patch: Record<string, unknown>) =>
    cmsRequest(
      `/api/admin/content?table=${tab}`,
      jsonRequest("PATCH", { id: rowId(row), patch, expectedUpdatedAt: row.updated_at ?? "" }),
    );
  const action = async (work: () => Promise<unknown>, success: string) => {
    if (busy) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await work();
      setMessage(success);
      await load();
    } catch (cause) {
      handleError(cause);
    } finally {
      setBusy(false);
    }
  };
  const unlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await cmsRequest("/api/admin/session", jsonRequest("POST", { pin }));
      setUnlocked(true);
      setPin("");
    } catch (cause) {
      handleError(cause);
    } finally {
      setBusy(false);
    }
  };
  const duplicate = (row: Row) => {
    const copy = { ...row };
    delete copy.id;
    delete copy.key;
    delete copy.created_at;
    delete copy.updated_at;
    copy.title = `${titleOf(row)} (copy)`;
    copy.slug = `${row.slug || "item"}-copy-${crypto.randomUUID().slice(0, 6)}`;
    copy.is_published = false;
    copy.publish_at = null;
    copy.archived_at = null;
    setEditing(copy);
  };
  const remove = (row: Row) => {
    if (window.confirm(`Permanently delete ${titleOf(row)}? This cannot be undone.`))
      void action(
        () =>
          cmsRequest(
            `/api/admin/content?table=${tab}`,
            jsonRequest("DELETE", { id: rowId(row), expectedUpdatedAt: row.updated_at ?? "" }),
          ),
        "Item deleted.",
      );
  };
  const bulk = (publish: boolean) => {
    const targets = rows.filter((r) => selected.includes(rowId(r)));
    if (
      !targets.length ||
      !window.confirm(`${publish ? "Publish" : "Unpublish"} ${targets.length} selected items?`)
    )
      return;
    void action(async () => {
      let done = 0;
      try {
        for (const row of targets) {
          await mutate(row, { is_published: publish });
          done++;
        }
      } catch (cause) {
        throw new Error(
          `${done} of ${targets.length} items updated. Refresh before retrying. ${cause instanceof Error ? cause.message : ""}`,
        );
      }
    }, "Selected items updated.");
  };
  const exportCsv = () => {
    const cell = (v: unknown) => {
      const text = String(v ?? "");
      return `"${(/^[=+@\-\t\r]/.test(text) ? "'" : "") + text.replaceAll('"', '""')}"`;
    };
    const keys = ["email", "name", "interests", "source", "created_at"];
    const csv = [
      keys.join(","),
      ...filtered.map((r) => keys.map((k) => cell(r[k])).join(",")),
    ].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `elitevisuals-${tab}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  if (checking)
    return (
      <main className="admin-gate">
        <p role="status">Checking admin session…</p>
      </main>
    );
  if (!unlocked)
    return (
      <main className="admin-gate">
        <form className="admin-pin" onSubmit={unlock}>
          <div className="admin-lock">
            <Lock />
          </div>
          <p className="kicker">Elite Visuals CMS</p>
          <h1>Admin access</h1>
          <p>Enter your admin PIN.</p>
          <input
            aria-label="Admin PIN"
            type="password"
            autoComplete="current-password"
            required
            value={pin}
            onChange={(e) => setPin(e.target.value)}
          />
          {error && (
            <p className="admin-error" role="alert">
              {error}
            </p>
          )}
          <button className="button button-solid" disabled={busy || !pin}>
            {busy ? "Unlocking…" : "Unlock"}
          </button>
        </form>
      </main>
    );
  const all: (Row & { table: Table })[] = summary.flatMap((g) =>
    g.rows.filter((r) => !r.referenced).map((r) => ({ ...r, table: g.table })),
  );
  const hasPublishing = fields[tab].some((f) => f.key === "is_published");
  return (
    <main className="admin-page">
      <aside>
        <div>
          <p className="kicker">Elite Visuals</p>
          <h1>CMS</h1>
        </div>
        <nav aria-label="CMS sections">
          <button className={overview ? "active" : ""} onClick={() => navigate(null)}>
            Overview
          </button>
          {tabs.map(([key, label]) => (
            <button
              key={key}
              className={!overview && tab === key ? "active" : ""}
              aria-current={!overview && tab === key ? "page" : undefined}
              onClick={() => navigate(key)}
            >
              {label}
            </button>
          ))}
        </nav>
        <a href="/" className="button button-outline">
          View website
        </a>
        <button
          disabled={busy || uploading}
          onClick={() =>
            void action(async () => {
              await cmsRequest("/api/admin/session", { method: "DELETE" });
              setUnlocked(false);
              setRows([]);
              setEditing(null);
            }, "Locked")
          }
        >
          <LogOut size={16} />
          Lock
        </button>
      </aside>
      <section>
        <header>
          <div>
            <p className="kicker">Your creative workspace</p>
            <h2>{overview ? "Overview" : tabs.find(([key]) => key === tab)?.[1]}</h2>
          </div>
          <div className="admin-actions">
            <button
              className="admin-icon"
              aria-label="Refresh content"
              disabled={busy || uploading || Boolean(editing)}
              onClick={() => void load()}
            >
              <RefreshCw size={18} />
            </button>
            {!overview && ["waitlist_signups", "members"].includes(tab) && (
              <button
                className="button button-outline"
                onClick={exportCsv}
                disabled={!filtered.length}
              >
                <Download size={16} />
                Export CSV
              </button>
            )}
            {!overview && tab !== "members" && (
              <button
                className="button button-solid"
                disabled={busy || uploading || Boolean(editing)}
                onClick={() => setEditing({})}
              >
                <Plus size={16} />
                Add new
              </button>
            )}
          </div>
        </header>
        {error && (
          <div className="admin-error" role="alert">
            {error}
          </div>
        )}
        {message && (
          <div className="admin-success" role="status">
            {message}
          </div>
        )}
        {busy && !editing ? (
          <div className="admin-loading" role="status">
            <Loader2 className="spin" />
            Loading content…
          </div>
        ) : overview ? (
          <>
            <div className="cms-stats">
              {[
                ["Content items", all.filter((r) => r.table !== "site_assets").length],
                [
                  "Published",
                  all.filter((r) => r.table !== "site_assets" && statusOf(r) === "published")
                    .length,
                ],
                [
                  "Drafts",
                  all.filter((r) => r.table !== "site_assets" && statusOf(r) === "draft").length,
                ],
                ["Scheduled", all.filter((r) => statusOf(r) === "scheduled").length],
              ].map(([label, count]) => (
                <article key={label}>
                  <span>{label}</span>
                  <strong>{count}</strong>
                </article>
              ))}
            </div>
            <section className="cms-overview-section">
              <h3>Quick create</h3>
              <div className="admin-actions">
                {tabs
                  .filter(([key]) => ["prompts", "skills", "resources"].includes(key))
                  .map(([key, label]) => (
                    <button
                      className="button button-outline"
                      key={key}
                      onClick={() => {
                        navigate(key);
                        setEditing({});
                      }}
                    >
                      <Plus size={16} />
                      {label}
                    </button>
                  ))}
              </div>
            </section>
            <section className="cms-overview-section">
              <h3>Recently edited</h3>
              <div className="recent-list">
                {all
                  .sort((a, b) =>
                    String(b.updated_at || b.created_at || "").localeCompare(
                      String(a.updated_at || a.created_at || ""),
                    ),
                  )
                  .slice(0, 8)
                  .map((row) => (
                    <button
                      key={`${row.table}-${rowId(row)}`}
                      onClick={() => {
                        navigate(row.table);
                        setEditing(row);
                      }}
                    >
                      <span>
                        {titleOf(row)}
                        <small>{tabs.find(([t]) => t === row.table)?.[1]}</small>
                      </span>
                      <span className={`status-badge ${statusOf(row)}`}>{statusOf(row)}</span>
                    </button>
                  ))}
              </div>
            </section>
          </>
        ) : (
          <>
            {editing ? (
              <CmsEditor
                key={`${tab}-${rowId(editing)}`}
                table={tab}
                row={editing}
                onBusy={setUploading}
                onClose={() => setEditing(null)}
                onSaved={() => {
                  setEditing(null);
                  setMessage("Changes saved.");
                  void load();
                }}
              />
            ) : (
              <>
                {tab === "site_assets" && (
                  <details className="cms-overview-section">
                    <summary>Upload media to your library</summary>
                    <MediaUpload
                      kind="site-asset"
                      multiple
                      onChange={() =>
                        setMessage("Media added to library. Refresh to view uploads.")
                      }
                      onBusy={setUploading}
                    />
                  </details>
                )}
                <div className="cms-toolbar">
                  <label>
                    Search
                    <input
                      type="search"
                      placeholder="Search content…"
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(1);
                        setSelected([]);
                      }}
                    />
                  </label>
                  {hasPublishing && (
                    <label>
                      Status
                      <select
                        value={filter}
                        onChange={(e) => {
                          setFilter(e.target.value);
                          setPage(1);
                          setSelected([]);
                        }}
                      >
                        <option value="all">All statuses</option>
                        {["published", "draft", "scheduled", "archived"].map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                  <label>
                    Sort
                    <select value={sort} onChange={(e) => setSort(e.target.value)}>
                      <option value="recent">Recently edited</option>
                      <option value="title">Title A–Z</option>
                      <option value="order">Display order</option>
                    </select>
                  </label>
                </div>
                {selected.length > 0 && (
                  <div className="cms-bulk">
                    <span>{selected.length} selected</span>
                    <button disabled={busy} onClick={() => bulk(true)}>
                      Publish
                    </button>
                    <button disabled={busy} onClick={() => bulk(false)}>
                      Unpublish
                    </button>
                    <button onClick={() => setSelected([])}>Clear selection</button>
                  </div>
                )}
                <div className="admin-list">
                  {visible.map((row) => {
                    const name = titleOf(row),
                      status = statusOf(row),
                      url = previewPath(tab, row);
                    const media =
                      row.cover_image_url ||
                      row.image_url ||
                      row.logo_url ||
                      (["image", "icon"].includes(String(row.asset_type)) ? row.url : null);
                    return (
                      <article key={rowId(row)}>
                        <div className="admin-thumb">
                          {typeof media === "string" && media ? (
                            <img src={media} alt="" loading="lazy" />
                          ) : (
                            <span>{name.slice(0, 1)}</span>
                          )}
                        </div>
                        <div className="cms-row-copy">
                          <h3>{name}</h3>
                          <p>{String(row.slug || row.asset_type || row.created_at || "")}</p>
                        </div>
                        <div className="cms-row-actions">
                          {hasPublishing && !row.referenced && (
                            <>
                              <input
                                type="checkbox"
                                aria-label={`Select ${name}`}
                                checked={selected.includes(rowId(row))}
                                onChange={(e) =>
                                  setSelected((ids) =>
                                    e.target.checked
                                      ? [...ids, rowId(row)]
                                      : ids.filter((id) => id !== rowId(row)),
                                  )
                                }
                              />
                              <button
                                disabled={busy || status === "archived"}
                                className={`status-badge ${status}`}
                                aria-label={`${status === "published" ? "Unpublish" : "Publish"} ${name}`}
                                onClick={() =>
                                  void action(
                                    () => mutate(row, { is_published: !row.is_published }),
                                    "Publication updated.",
                                  )
                                }
                              >
                                {status}
                              </button>
                            </>
                          )}
                          {url && status === "published" && (
                            <a
                              className="admin-icon"
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              aria-label={`View ${name}`}
                            >
                              <Eye size={16} />
                            </a>
                          )}
                          {tab !== "members" && (
                            <>
                              <button
                                className="admin-icon"
                                disabled={busy}
                                aria-label={`Edit ${name}`}
                                onClick={() => setEditing(row)}
                              >
                                <Pencil size={16} />
                              </button>
                              {["packs", "prompts", "skills", "resources", "ai_logos"].includes(
                                tab,
                              ) && (
                                <>
                                  <button
                                    className="admin-icon"
                                    disabled={busy}
                                    aria-label={`Duplicate ${name}`}
                                    onClick={() => duplicate(row)}
                                  >
                                    <Copy size={16} />
                                  </button>
                                  <button
                                    className="admin-icon"
                                    disabled={busy}
                                    aria-label={`${row.archived_at ? "Restore" : "Archive"} ${name}`}
                                    onClick={() =>
                                      void action(
                                        () =>
                                          mutate(row, {
                                            archived_at: row.archived_at
                                              ? null
                                              : new Date().toISOString(),
                                            is_published: false,
                                          }),
                                        row.archived_at
                                          ? "Restored as draft."
                                          : "Archived. You can restore this item.",
                                      )
                                    }
                                  >
                                    <Archive size={16} />
                                  </button>
                                </>
                              )}
                              {!["packs", "categories"].includes(tab) && (
                                <button
                                  className="admin-icon admin-delete"
                                  disabled={busy}
                                  aria-label={`Delete ${name}`}
                                  onClick={() => remove(row)}
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </article>
                    );
                  })}
                  {!visible.length && !error && (
                    <div className="empty-state">
                      <h3>
                        {search || filter !== "all" ? "No matching content" : "No content yet"}
                      </h3>
                      <p>
                        {search || filter !== "all"
                          ? "Try another search or status filter."
                          : "Use Add new to create your first item."}
                      </p>
                    </div>
                  )}
                </div>
                <nav className="cms-pagination" aria-label="Content pagination">
                  <span>
                    {filtered.length} items · Page {currentPage} of {pageCount}
                  </span>
                  <button
                    className="button button-outline"
                    disabled={currentPage === 1}
                    onClick={() => setPage(currentPage - 1)}
                  >
                    Previous
                  </button>
                  <button
                    className="button button-outline"
                    disabled={currentPage === pageCount}
                    onClick={() => setPage(currentPage + 1)}
                  >
                    Next
                  </button>
                </nav>
              </>
            )}
          </>
        )}
      </section>
    </main>
  );
}
