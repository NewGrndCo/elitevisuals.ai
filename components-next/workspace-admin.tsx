"use client";
import { useEffect, useState } from "react";
import { cmsRequest, jsonRequest } from "@/lib-next/cms-request";
const modules = ["Cover", "Motion", "Logo", "Promo", "Flyer", "Enhance"] as const;
type Module = (typeof modules)[number];
type Config = { instructions: string; modelPath: string; skillName?: string };
type Settings = {
  modules: Partial<Record<Module, Config>>;
  credentialConfigured: boolean;
  credentialSource: string;
  updatedAt?: string;
};
export function WorkspaceAdmin({ onBack }: { onBack: () => void }) {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [selected, setSelected] = useState<Module>("Cover");
  const [key, setKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [dirty, setDirty] = useState(false);
  async function load() {
    setSettings(await cmsRequest<Settings>("/api/admin/workspace"));
    setDirty(false);
  }
  useEffect(() => {
    void load().catch(() =>
      setMessage(
        "Unable to load Workspace settings. Return to CMS and sign in again if your session expired.",
      ),
    );
  }, []);
  async function act(work: () => Promise<unknown>, success: string) {
    setBusy(true);
    setMessage("");
    try {
      await work();
      await load();
      setMessage(success);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Request failed");
    } finally {
      setBusy(false);
    }
  }
  function update(name: "instructions" | "modelPath", value: string) {
    setSettings((current) =>
      current
        ? {
            ...current,
            modules: {
              ...current.modules,
              [selected]: {
                instructions: "",
                modelPath: "",
                ...current.modules[selected],
                [name]: value,
              },
            },
          }
        : current,
    );
    setDirty(true);
  }
  return (
    <main className="workspace-admin-page">
      <header>
        <div>
          <p className="kicker">Elite Visuals · Admin</p>
          <h1>Workspace</h1>
          <p>Manage creative modules, skill packages, and the generation provider.</p>
        </div>
        <button
          className="button button-outline"
          disabled={busy}
          onClick={() => {
            if (!dirty || window.confirm("Leave Workspace settings? Unsaved changes will be lost."))
              onBack();
          }}
        >
          Back to CMS
        </button>
      </header>
      {message && (
        <p className="admin-error" role="status">
          {message}
        </p>
      )}
      {!settings ? (
        <p>Loading settings…</p>
      ) : (
        <>
          <section className="workspace-admin-block">
            <h2>Higgsfield connection</h2>
            <p>
              {settings.credentialConfigured
                ? `Credential configured (${settings.credentialSource === "environment" ? "server environment" : "encrypted admin storage"}).`
                : "No API credential configured."}
            </p>
            <p>Base URL: https://api.higgsfield.ai · Credentials stay on the server.</p>
            <label>
              Connect API key
              <input
                type="password"
                autoComplete="new-password"
                value={key}
                onChange={(event) => {
                  setKey(event.target.value);
                  setDirty(true);
                }}
                placeholder="Paste the complete credential from Higgsfield"
                disabled={busy}
              />
            </label>
            <p className="ev-help">
              Leave blank to keep the existing key. Server HF_API_KEY takes priority. Generation is
              not active yet.
            </p>
            <div className="admin-actions">
              <a
                className="button button-outline"
                href="https://open.higgsfield.ai"
                target="_blank"
                rel="noreferrer"
              >
                Open Higgsfield console
              </a>
              {settings.credentialSource === "admin" && (
                <button
                  className="button button-outline"
                  disabled={busy || dirty}
                  onClick={() => {
                    if (window.confirm("Remove the saved API credential?"))
                      void act(
                        () =>
                          cmsRequest(
                            "/api/admin/workspace",
                            jsonRequest("PATCH", {
                              modules: {},
                              removeCredential: true,
                              expectedUpdatedAt: settings.updatedAt ?? null,
                            }),
                          ),
                        "Saved credential removed.",
                      );
                  }}
                >
                  Remove credential
                </button>
              )}
            </div>
          </section>
          <section className="workspace-admin-block">
            <h2>Module skills and settings</h2>
            <div className="admin-actions">
              {modules.map((module) => (
                <button
                  key={module}
                  className={`button ${selected === module ? "button-solid" : "button-outline"}`}
                  aria-pressed={selected === module}
                  onClick={() => setSelected(module)}
                >
                  {module === "Motion" ? "Transitions" : module}
                </button>
              ))}
            </div>
            <h3>{selected === "Motion" ? "Transitions" : selected} module</h3>
            <label>
              Higgsfield model path
              <input
                value={settings.modules[selected]?.modelPath || ""}
                onChange={(event) => update("modelPath", event.target.value)}
                placeholder="Copy the exact model path from its API documentation"
                disabled={busy}
              />
            </label>
            <label>
              Creative instructions
              <textarea
                rows={7}
                value={settings.modules[selected]?.instructions || ""}
                onChange={(event) => update("instructions", event.target.value)}
                placeholder="Add the approved direction and quality rules for this module."
                disabled={busy}
                maxLength={12000}
              />
            </label>
            <label>
              Upload module skill ZIP
              <input
                type="file"
                accept=".zip,application/zip"
                disabled={busy || dirty}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  const form = new FormData();
                  form.set("module", selected);
                  form.set("file", file);
                  void act(
                    () => cmsRequest("/api/admin/workspace", { method: "POST", body: form }),
                    "Skill uploaded privately and assigned to this module.",
                  );
                  event.target.value = "";
                }}
              />
            </label>
            <p>{settings.modules[selected]?.skillName || "No skill package assigned."}</p>
            {settings.modules[selected]?.skillName && (
              <a
                className="button button-outline"
                href={`/api/admin/workspace?download=${selected}`}
              >
                Download assigned skill
              </a>
            )}
            <p className="ev-help">
              ZIP limit: 4 MB. Save changed settings before uploading a package. Packages are stored
              privately; uploading does not automatically execute skill instructions.
            </p>
          </section>
          <section className="workspace-admin-block">
            <h2>Release controls</h2>
            <p>
              Workspace visibility is controlled in CMS Overview. Generation, payments, and customer
              jobs remain pending integration.
            </p>
            <button
              className="button button-solid"
              disabled={busy || !dirty}
              onClick={() =>
                void act(async () => {
                  await cmsRequest(
                    "/api/admin/workspace",
                    jsonRequest("PATCH", {
                      modules: settings.modules,
                      apiKey: key || undefined,
                      expectedUpdatedAt: settings.updatedAt ?? null,
                    }),
                  );
                  setKey("");
                }, "Workspace settings saved.")
              }
            >
              {busy ? "Saving…" : "Save Workspace settings"}
            </button>
          </section>
        </>
      )}
    </main>
  );
}
