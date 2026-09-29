"use client";

import Image from "next/image";
import Link from "next/link";
import { Check, Copy, FlipHorizontal, Loader2, Lock } from "lucide-react";
import { useEffect, useState } from "react";
import { FlippingCard } from "@/components/ui/flipping-card";
import { useMemberSession } from "@/lib-next/member-auth";

type PromptFlipCardProps = {
  slug: string;
  title: string;
  imageUrl: string | null;
  uses: number;
};

export function PromptFlipCard({ slug, title, imageUrl, uses }: PromptFlipCardProps) {
  const { session, loading } = useMemberSession();
  const [flipped, setFlipped] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!flipped || !session?.access_token || prompt) return;
    const controller = new AbortController();
    void fetch(`/api/prompts/${encodeURIComponent(slug)}`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
      signal: controller.signal,
      cache: "no-store",
    })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || "Unable to load prompt.");
        setPrompt(body.prompt);
      })
      .catch((cause) => {
        if (!controller.signal.aborted)
          setError(cause instanceof Error ? cause.message : "Unable to load prompt.");
      });
    return () => controller.abort();
  }, [flipped, prompt, session?.access_token, slug]);

  const copyPrompt = async () => {
    if (!prompt) return;
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setError("Clipboard access failed. Please select and copy the prompt.");
    }
  };

  return (
    <FlippingCard
      flipped={flipped}
      className="prompt-flip-card"
      frontContent={
        <button
          className="prompt-flip-front"
          type="button"
          onClick={() => setFlipped(true)}
          aria-label={`Reveal ${title} prompt`}
        >
          {imageUrl ? (
            <Image src={imageUrl} alt={title} fill sizes="25vw" />
          ) : (
            <div className="image-fallback" />
          )}
          <div className="prompt-flip-shade" />
          <div className="prompt-flip-front-copy">
            <span>{uses} uses</span>
            <h3>{title}</h3>
            <b>
              <FlipHorizontal size={14} /> Flip to reveal
            </b>
          </div>
        </button>
      }
      backContent={
        <div className="prompt-flip-back-content">
          <button
            className="prompt-flip-close"
            type="button"
            onClick={() => setFlipped(false)}
            aria-label="Show prompt cover"
          >
            <FlipHorizontal size={15} /> Back
          </button>
          <h3>{title}</h3>
          {loading ? (
            <p className="prompt-flip-status">
              <Loader2 className="spin" size={16} /> Checking access…
            </p>
          ) : !session ? (
            <div className="prompt-flip-locked">
              <Lock size={19} />
              <p>Sign in to reveal and copy this prompt.</p>
              <Link className="button button-solid" href={`/login?next=/promptbox`}>
                Sign In
              </Link>
            </div>
          ) : error ? (
            <p className="prompt-flip-error">{error}</p>
          ) : !prompt ? (
            <p className="prompt-flip-status">
              <Loader2 className="spin" size={16} /> Loading prompt…
            </p>
          ) : (
            <>
              <p className="prompt-flip-text">{prompt}</p>
              <button className="prompt-flip-copy" type="button" onClick={() => void copyPrompt()}>
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? "Copied" : "Copy prompt"}
              </button>
            </>
          )}
        </div>
      }
    />
  );
}
