"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff, Loader2, Lock, LogOut, RefreshCw, Trash2 } from "lucide-react";

const tabs = [
  ["packs", "Prompt Packs"],
  ["prompts", "Prompts"],
  ["skills", "Skills"],
  ["resources", "Resources"],
  ["site_assets", "Site Assets"],
  ["categories", "Categories"],
  ["ai_logos", "AI Models"],
] as const;
type Row = Record<string, unknown> & { id: string };

export function AdminDashboard() {
  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState("");
  const [tab, setTab] = useState<(typeof tabs)[number][0]>("packs");
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [readOnly, setReadOnly] = useState(false);

  const load = async () => {
    setBusy(true);
    setError("");
    const response = await fetch(`/api/admin/content?table=${tab}`);
    const body = await response.json();
    setBusy(false);
    if (response.status === 401) {
      setUnlocked(false);
      return;
    }
    if (!response.ok) {
      setError(body.error || "Unable to load admin data");
      return;
    }
    setRows(body.data || []);
    setReadOnly(Boolean(body.readOnly));
  };
  useEffect(() => {
    if (unlocked) void load();
  }, [unlocked, tab]);

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
  const patch = async (row: Row, next: Record<string, unknown>) => {
    const response = await fetch(`/api/admin/content?table=${tab}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: row.id, patch: next }),
    });
    const body = await response.json();
    if (!response.ok) {
      setError(body.error || "Update failed");
      return;
    }
    await load();
  };
  const remove = async (row: Row) => {
    if (!window.confirm(`Delete ${String(row.title || row.name || "this item")}?`)) return;
    const response = await fetch(`/api/admin/content?table=${tab}`, {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: row.id }),
    });
    const body = await response.json();
    if (!response.ok) {
      setError(body.error || "Delete failed");
      return;
    }
    await load();
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
            <button key={key} onClick={() => setTab(key)} className={tab === key ? "active" : ""}>
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
            <p className="kicker">Manage content</p>
            <h2>{tabs.find(([key]) => key === tab)?.[1]}</h2>
          </div>
          <button onClick={load} className="admin-icon">
            <RefreshCw size={17} />
          </button>
        </header>
        {readOnly && (
          <div className="admin-error admin-config-error">
            Read-only mode
            <small>Add SUPABASE_SERVICE_ROLE_KEY to enable publishing and deletion.</small>
          </div>
        )}
        {error && (
          <div className="admin-error admin-config-error">
            {error}
            {error.includes("SERVICE_ROLE") && (
              <small>
                Add SUPABASE_SERVICE_ROLE_KEY to .env and Netlify environment variables, then
                restart.
              </small>
            )}
          </div>
        )}
        {busy ? (
          <div className="admin-loading">
            <Loader2 className="spin" /> Loading
          </div>
        ) : (
          <div className="admin-list">
            {rows.map((row) => {
              const published = typeof row.is_published === "boolean" ? row.is_published : null;
              return (
                <article key={row.id}>
                  <div className="admin-thumb">
                    {typeof row.cover_image_url === "string" && row.cover_image_url ? (
                      <img src={row.cover_image_url} alt="" />
                    ) : (
                      <span>{String(row.title || row.name || "A").slice(0, 1)}</span>
                    )}
                  </div>
                  <div>
                    <h3>{String(row.title || row.name || row.asset_key || "Untitled")}</h3>
                    <p>{String(row.slug || row.resource_type || row.asset_type || "")}</p>
                  </div>
                  {published !== null && (
                    <button
                      className={`publish ${published ? "live" : "draft"}`}
                      onClick={() => patch(row, { is_published: !published })}
                    >
                      {published ? <Eye size={14} /> : <EyeOff size={14} />}{" "}
                      {published ? "Live" : "Draft"}
                    </button>
                  )}
                  <button className="admin-delete" onClick={() => remove(row)} aria-label="Delete">
                    <Trash2 size={16} />
                  </button>
                </article>
              );
            })}
            {!rows.length && !error && (
              <div className="empty-state">
                <h3>No items found.</h3>
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
