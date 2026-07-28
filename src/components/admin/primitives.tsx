import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AlertTriangle, ArrowDown, ArrowUp, Loader2, Save, Upload, X } from "lucide-react";
import { uploadMedia } from "./use-admin";
import { toast } from "sonner";

/* ────────────────────────────── inputs ────────────────────────────── */

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string | null;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      {children}
      {error ? (
        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-destructive">
          <AlertTriangle className="h-3 w-3 flex-shrink-0" />
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-muted-foreground/70">{hint}</p>
      ) : null}
    </div>
  );
}

const inputBase =
  "glass w-full rounded-xl bg-transparent px-3 py-2.5 text-sm outline-none transition-colors focus:bg-white/5 focus:ring-1 focus:ring-[rgba(124,92,252,0.45)] disabled:opacity-50";

export function TextInput({
  invalid,
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return (
    <input
      {...props}
      className={`${inputBase} ${invalid ? "ring-1 ring-destructive" : ""} ${className}`}
    />
  );
}

export function TextArea({
  className = "",
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${inputBase} resize-y ${className}`} />;
}

export function SelectInput({
  className = "",
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className={`${inputBase} ${className}`}>
      {children}
    </select>
  );
}

/** Published / draft toggle used by packs, prompts and logos. */
export function PublishToggle({
  published,
  onChange,
}: {
  published: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={published}
      onClick={() => onChange(!published)}
      className={`glass inline-flex items-center gap-2.5 rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${
        published ? "text-emerald-300" : "text-yellow-300"
      }`}
    >
      <span
        className={`relative h-5 w-9 flex-shrink-0 rounded-full transition-colors ${
          published ? "bg-emerald-400/30" : "bg-yellow-400/25"
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full transition-transform ${
            published ? "translate-x-4 bg-emerald-300" : "translate-x-0.5 bg-yellow-300"
          }`}
        />
      </span>
      {published ? "Published" : "Draft"}
    </button>
  );
}

export function StatusPill({ published }: { published: boolean }) {
  return published ? (
    <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
      Live
    </span>
  ) : (
    <span className="rounded-full bg-yellow-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-yellow-200">
      Draft
    </span>
  );
}

/* ───────────────────────────── layout ───────────────────────────── */

export function SectionHeader({
  title,
  desc,
  actions,
}: {
  title: string;
  desc?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h2 className="font-display text-xl font-semibold tracking-[-0.01em]">{title}</h2>
        {desc && <p className="mt-1 text-sm text-muted-foreground">{desc}</p>}
      </div>
      {actions && <div className="flex flex-shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  desc,
  action,
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  title: string;
  desc?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border/50 px-6 py-14 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/5">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <div>
        <div className="font-semibold">{title}</div>
        {desc && <p className="mt-1 text-sm text-muted-foreground">{desc}</p>}
      </div>
      {action}
    </div>
  );
}

export function PrimaryButton({
  loading,
  className = "",
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
  return (
    <button
      {...props}
      disabled={props.disabled || loading}
      className={`ring-glow inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity disabled:opacity-50 ${className}`}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

export function GhostButton({
  className = "",
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-full border border-border/60 px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40 ${className}`}
    >
      {children}
    </button>
  );
}

/** Up/down reorder control. */
export function ReorderControls({
  onUp,
  onDown,
  disableUp,
  disableDown,
  busy,
}: {
  onUp: () => void;
  onDown: () => void;
  disableUp: boolean;
  disableDown: boolean;
  busy?: boolean;
}) {
  return (
    <div className="flex flex-shrink-0 flex-col">
      <button
        type="button"
        onClick={onUp}
        disabled={disableUp || busy}
        aria-label="Move up"
        className="rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-25"
      >
        <ArrowUp className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={onDown}
        disabled={disableDown || busy}
        aria-label="Move down"
        className="rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-25"
      >
        <ArrowDown className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

/**
 * Sticky save bar. Appears only when there are unsaved changes, so "did that
 * save?" is never ambiguous.
 */
export function SaveBar({
  isDirty,
  saving,
  onSave,
  onDiscard,
  label = "Unsaved changes",
}: {
  isDirty: boolean;
  saving: boolean;
  onSave: () => void;
  onDiscard: () => void;
  label?: string;
}) {
  if (!isDirty) return null;
  return (
    <div className="sticky bottom-4 z-30 mt-4 flex items-center justify-between gap-3 rounded-2xl border border-[rgba(124,92,252,0.3)] bg-[rgba(20,16,40,0.92)] px-4 py-3 backdrop-blur-xl">
      <span className="flex items-center gap-2 text-sm text-[#c4b5fd]">
        <span className="h-2 w-2 flex-shrink-0 animate-pulse rounded-full bg-[#a78bfa]" />
        {label}
      </span>
      <div className="flex flex-shrink-0 items-center gap-2">
        <GhostButton onClick={onDiscard} disabled={saving}>
          Discard
        </GhostButton>
        <PrimaryButton onClick={onSave} loading={saving}>
          <Save className="h-4 w-4" /> Save
        </PrimaryButton>
      </div>
    </div>
  );
}

/* ─────────────────────────── confirm dialog ───────────────────────────
 * Replaces window.confirm(), which is suppressed inside some embedded and
 * preview contexts — meaning deletes could silently no-op.
 */

type ConfirmOptions = {
  title: string;
  body?: string;
  confirmLabel?: string;
  destructive?: boolean;
};

const ConfirmContext = createContext<((o: ConfirmOptions) => Promise<boolean>) | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ConfirmOptions | null>(null);
  const resolverRef = useRef<((v: boolean) => void) | null>(null);

  const confirm = useCallback((o: ConfirmOptions) => {
    setState(o);
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const settle = useCallback((value: boolean) => {
    resolverRef.current?.(value);
    resolverRef.current = null;
    setState(null);
  }, []);

  // Escape must be bound at the window: the overlay div isn't focusable, so a
  // React onKeyDown on it would never fire.
  useEffect(() => {
    if (!state) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") settle(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state, settle]);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state && (
        <div
          className="fixed inset-0 z-[200] grid place-items-center px-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => settle(false)} />
          <div className="glass-strong relative w-full max-w-sm rounded-3xl p-6">
            <h2 className="font-display text-lg font-semibold">{state.title}</h2>
            {state.body && <p className="mt-2 text-sm text-muted-foreground">{state.body}</p>}
            <div className="mt-6 flex justify-end gap-2">
              <GhostButton onClick={() => settle(false)} autoFocus>
                Cancel
              </GhostButton>
              <button
                onClick={() => settle(true)}
                className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold ${
                  state.destructive
                    ? "bg-destructive text-white hover:opacity-90"
                    : "bg-primary text-primary-foreground"
                }`}
              >
                {state.confirmLabel ?? "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used within ConfirmProvider");
  return ctx;
}

/* ─────────────────────────────── media ─────────────────────────────── */

export function MediaField({
  label,
  hint,
  url,
  accept,
  pathPrefix,
  onChange,
  preview = "auto",
}: {
  label: string;
  hint?: string;
  url: string | null;
  accept: string;
  /** Deterministic storage path (no timestamp) so re-uploads replace. */
  pathPrefix: string;
  onChange: (url: string) => void;
  preview?: "image" | "video" | "auto";
}) {
  const [busy, setBusy] = useState(false);
  const isImageUrl = (u: string) => /\.(gif|png|jpe?g|webp|avif|svg)(\?|$)/i.test(u);
  const renderAs = preview === "auto" ? (url && isImageUrl(url) ? "image" : "video") : preview;

  const handleFile = async (file: File) => {
    setBusy(true);
    const result = await uploadMedia(file, pathPrefix);
    setBusy(false);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    onChange(result.url);
    toast.success("Uploaded — remember to save");
  };

  return (
    <Field label={label} hint={hint}>
      <div className="space-y-2">
        {url && (
          <div className="glass relative aspect-video w-full overflow-hidden rounded-xl bg-black/40">
            {renderAs === "image" ? (
              <img src={url} alt="" className="h-full w-full object-contain" />
            ) : (
              <video src={url} className="h-full w-full object-contain" muted playsInline controls />
            )}
            <button
              type="button"
              onClick={() => onChange("")}
              aria-label="Remove media"
              className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-black/70 text-white/80 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
        <TextInput
          value={url ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://… or upload below"
          className="font-mono text-xs"
        />
        <label
          className={`glass flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs transition-colors ${
            busy ? "opacity-60" : "cursor-pointer hover:bg-white/10"
          }`}
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
          {busy ? "Uploading…" : "Upload file"}
          <input
            type="file"
            accept={accept}
            className="hidden"
            disabled={busy}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleFile(f);
              e.target.value = "";
            }}
          />
        </label>
      </div>
    </Field>
  );
}
