import { getStore } from "@netlify/blobs";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

export const workspaceModules = ["Cover", "Motion", "Logo", "Promo", "Flyer", "Enhance"] as const;
export type WorkspaceModule = (typeof workspaceModules)[number];
export type ModuleSettings = {
  instructions: string;
  modelPath: string;
  skillName?: string;
  skillKey?: string;
};
export type WorkspaceSettings = {
  modules: Partial<Record<WorkspaceModule, ModuleSettings>>;
  credential?: string;
  updatedAt?: string;
};
export function workspaceStore() {
  const preview = process.env.CONTEXT && process.env.CONTEXT !== "production";
  return getStore({
    name: `elitevisuals-workspace-private${preview ? "-preview" : ""}`,
    consistency: "strong",
  });
}
function encryptionKey() {
  const secret = process.env.WORKSPACE_SETTINGS_SECRET || process.env.ADMIN_SESSION_SECRET;
  if (!secret)
    throw new Error(
      "Configure WORKSPACE_SETTINGS_SECRET or ADMIN_SESSION_SECRET before saving API credentials.",
    );
  return createHash("sha256").update(secret).digest();
}
export function encryptCredential(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), encrypted].map((part) => part.toString("base64")).join(".");
}
export function decryptCredential(value: string) {
  const [iv, tag, data] = value.split(".").map((part) => Buffer.from(part, "base64"));
  const cipher = createDecipheriv("aes-256-gcm", encryptionKey(), iv);
  cipher.setAuthTag(tag);
  return Buffer.concat([cipher.update(data), cipher.final()]).toString("utf8");
}
export async function readWorkspaceSettings(): Promise<WorkspaceSettings> {
  return (await workspaceStore().get("settings", { type: "json" })) ?? { modules: {} };
}
export async function changeWorkspaceSettings(
  change: (settings: WorkspaceSettings) => WorkspaceSettings,
) {
  const store = workspaceStore();
  const snapshot = await store.getWithMetadata("settings", { type: "json" });
  const settings = change((snapshot?.data as WorkspaceSettings) ?? { modules: {} });
  settings.updatedAt = new Date().toISOString();
  const result = await store.setJSON(
    "settings",
    settings,
    snapshot ? { onlyIfMatch: snapshot.etag } : { onlyIfNew: true },
  );
  if (!result.modified) throw new Error("Settings changed elsewhere. Reload and try again.");
  return settings;
}
