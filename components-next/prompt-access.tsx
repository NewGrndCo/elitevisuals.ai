"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, Copy, Lock } from "lucide-react";
import { useMemberSession } from "@/lib-next/member-auth";

export function PromptAccess({ prompt, slug }: { prompt: string; slug: string }) {
  const { session, loading } = useMemberSession();
  const [copied, setCopied] = useState(false);
  if (loading || !session)
    return (
      <div className="prompt-lock">
        <div className="blurred-copy">{prompt}</div>
        <div className="lock-cover">
          <Lock size={23} />
          <h2>Sign in to reveal prompt</h2>
          <p>Create a free account to view and copy the complete prompt.</p>
          <Link className="button button-solid" href={`/login?next=/prompt/${slug}`}>
            Sign In
          </Link>
        </div>
      </div>
    );
  const copy = async () => {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="prompt-revealed">
      <div className="prompt-revealed-heading">
        <span>Prompt</span>
        <button className="button button-solid" onClick={() => void copy()}>
          {copied ? <Check size={15} /> : <Copy size={15} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre>{prompt}</pre>
    </div>
  );
}
