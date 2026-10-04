"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Check, Copy, Lock } from "@/components-next/icons";
import { useMemberSession } from "@/lib-next/member-auth";
import { useWebsiteAccess } from "@/lib-next/use-website-access";
export function PromptAccess({ slug }: { slug: string }) {
  const { session, loading } = useMemberSession();
  const access = useWebsiteAccess();
  const [prompt, setPrompt] = useState(""),
    [error, setError] = useState(""),
    [copied, setCopied] = useState(false),
    [retry, setRetry] = useState(0);
  const token = session?.access_token;
  useEffect(() => {
    setPrompt("");
    setError("");
    if (access.loading || (!token && access.required)) return;
    const controller = new AbortController();
    void fetch(`/api/prompts/${encodeURIComponent(slug)}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      signal: controller.signal,
      cache: "no-store",
    })
      .then(async (r) => {
        const body = await r.json();
        if (!r.ok) throw new Error(body.error || "Unable to load prompt.");
        return body;
      })
      .then((b) => setPrompt(b.prompt))
      .catch((e) => {
        if (!controller.signal.aborted)
          setError(e instanceof Error ? e.message : "Connection interrupted.");
      });
    return () => controller.abort();
  }, [token, slug, retry, access.required, access.loading]);
  if (access.loading || (access.required && (loading || !session)))
    return (
      <div className="prompt-lock">
        <div className="blurred-copy" aria-hidden="true">
          Your next creative idea starts here. Sign in to reveal the complete prompt and make it
          your own.
        </div>
        <div className="lock-cover">
          <Lock size={23} />
          <h2>Sign in to reveal prompt</h2>
          <p>Create a free account to view and copy the complete prompt.</p>
          <Link
            className="button button-solid"
            href={`/login?next=/prompt/${encodeURIComponent(slug)}`}
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setError("Clipboard access failed. Select and copy the prompt below.");
    }
  };
  return (
    <div className="prompt-revealed">
      <div className="prompt-revealed-heading">
        <span>Prompt</span>
        <button className="button button-solid" disabled={!prompt} onClick={() => void copy()}>
          {copied ? <Check size={15} /> : <Copy size={15} />} {copied ? "Copied" : "Copy"}
        </button>
      </div>
      {error && (
        <div role="alert" className="admin-error">
          {error}
          <button onClick={() => setRetry((n) => n + 1)}>Retry</button>
        </div>
      )}
      {prompt ? <pre>{prompt}</pre> : !error && <p role="status">Loading prompt…</p>}
    </div>
  );
}
