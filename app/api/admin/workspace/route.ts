import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifyAdminToken } from "@/lib-next/admin";
import {
  changeWorkspaceSettings,
  encryptCredential,
  readWorkspaceSettings,
  workspaceModules,
  workspaceStore,
  type WorkspaceModule,
  type ModuleSettings,
} from "@/lib-next/workspace-admin";
import { matchesSignature } from "@/lib-next/upload-policy";

async function authorized() {
  return verifyAdminToken((await cookies()).get("ev_admin")?.value);
}
const denied = () => NextResponse.json({ error: "Unauthorized" }, { status: 401 });
function sameOrigin(request: Request) {
  return (
    !request.headers.get("origin") || request.headers.get("origin") === new URL(request.url).origin
  );
}
export async function GET(request: Request) {
  if (!(await authorized())) return denied();
  try {
    const settings = await readWorkspaceSettings();
    const module = new URL(request.url).searchParams.get("download") as WorkspaceModule;
    if (module) {
      if (!workspaceModules.includes(module))
        return NextResponse.json({ error: "Unknown module" }, { status: 400 });
      const item = settings.modules[module];
      const file = item?.skillKey
        ? await workspaceStore().get(item.skillKey, { type: "arrayBuffer" })
        : null;
      if (!file) return NextResponse.json({ error: "No skill uploaded" }, { status: 404 });
      return new Response(file, {
        headers: {
          "Content-Type": "application/zip",
          "Content-Disposition": `attachment; filename="${module.toLowerCase()}-skill.zip"`,
          "Cache-Control": "private, no-store",
        },
      });
    }
    const modules = Object.fromEntries(
      Object.entries(settings.modules).map(([name, item]) => [
        name,
        {
          instructions: item?.instructions || "",
          modelPath: item?.modelPath || "",
          skillName: item?.skillName,
        },
      ]),
    );
    return NextResponse.json(
      {
        modules,
        credentialConfigured: Boolean(process.env.HF_API_KEY || settings.credential),
        credentialSource: process.env.HF_API_KEY
          ? "environment"
          : settings.credential
            ? "admin"
            : "none",
        updatedAt: settings.updatedAt,
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch {
    return NextResponse.json({ error: "Workspace settings unavailable. Retry." }, { status: 503 });
  }
}
export async function PATCH(request: Request) {
  if (!(await authorized())) return denied();
  if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  try {
    const raw = await request.text();
    if (raw.length > 100000)
      return NextResponse.json({ error: "Settings too large" }, { status: 400 });
    const input = JSON.parse(raw);
    if (!input || typeof input !== "object" || !input.modules || typeof input.modules !== "object")
      return NextResponse.json({ error: "Invalid settings" }, { status: 400 });
    const clean: Partial<Record<WorkspaceModule, ModuleSettings>> = {};
    for (const [name, item] of Object.entries(input.modules)) {
      if (!workspaceModules.includes(name as WorkspaceModule) || !item || typeof item !== "object")
        return NextResponse.json({ error: "Invalid module" }, { status: 400 });
      const value = item as ModuleSettings;
      if (
        typeof value.instructions !== "string" ||
        value.instructions.length > 12000 ||
        typeof value.modelPath !== "string" ||
        !/^[a-zA-Z0-9._/-]{0,200}$/.test(value.modelPath) ||
        value.modelPath.includes("..") ||
        value.modelPath.startsWith("/")
      )
        return NextResponse.json({ error: "Check instructions and model paths" }, { status: 400 });
      clean[name as WorkspaceModule] = {
        instructions: value.instructions,
        modelPath: value.modelPath,
      };
    }
    if (
      input.apiKey !== undefined &&
      (typeof input.apiKey !== "string" ||
        input.apiKey.length > 2048 ||
        /[\r\n]/.test(input.apiKey))
    )
      return NextResponse.json({ error: "Invalid API credential" }, { status: 400 });
    const encrypted = input.apiKey?.trim() ? encryptCredential(input.apiKey.trim()) : undefined;
    await changeWorkspaceSettings((current) => {
      if (input.expectedUpdatedAt !== (current.updatedAt ?? null))
        throw new Error("Settings changed elsewhere. Reload and try again.");
      for (const name of workspaceModules)
        if (clean[name]) current.modules[name] = { ...current.modules[name], ...clean[name] };
      if (encrypted) current.credential = encrypted;
      if (input.removeCredential === true) delete current.credential;
      return current;
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error && error.message.includes("Settings changed")
            ? error.message
            : "Unable to save. Verify settings and server encryption configuration.",
      },
      { status: 409 },
    );
  }
}
export async function POST(request: Request) {
  if (!(await authorized())) return denied();
  if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  try {
    if (Number(request.headers.get("content-length")) > 4.5 * 1024 * 1024)
      return NextResponse.json({ error: "Choose a ZIP smaller than 4 MB" }, { status: 400 });
    const form = await request.formData();
    const module = String(form.get("module")) as WorkspaceModule;
    const file = form.get("file");
    if (
      !workspaceModules.includes(module) ||
      !(file instanceof File) ||
      !file.name.toLowerCase().endsWith(".zip") ||
      !file.size ||
      file.size > 4 * 1024 * 1024
    )
      return NextResponse.json(
        { error: "Choose a module and a ZIP smaller than 4 MB" },
        { status: 400 },
      );
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (!matchesSignature(bytes, "application/zip", "skill-package"))
      return NextResponse.json({ error: "Invalid ZIP file" }, { status: 400 });
    const key = `skills/${module}/${crypto.randomUUID()}.zip`;
    await workspaceStore().set(key, bytes.buffer);
    await changeWorkspaceSettings((current) => {
      current.modules[module] = {
        instructions: "",
        modelPath: "",
        ...current.modules[module],
        skillKey: key,
        skillName: file.name.slice(0, 200),
      };
      return current;
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Skill upload failed. Retry." }, { status: 503 });
  }
}
