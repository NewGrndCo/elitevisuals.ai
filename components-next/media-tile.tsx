"use client";

import Image from "next/image";
import { useState } from "react";
import type { Prompt } from "@/lib-next/supabase";

const IMAGE_RE = /\.(gif|png|jpe?g|webp|avif|svg)(\?|$)/i;

export function MediaTile({
  prompt,
}: {
  prompt: Pick<Prompt, "title" | "cover_image_url" | "demo_video_url">;
}) {
  const candidates = [prompt.cover_image_url, prompt.demo_video_url].filter(Boolean) as string[];
  const [index, setIndex] = useState(0);
  const [failed, setFailed] = useState(false);
  const src = candidates[index];

  const recover = () => {
    if (index + 1 < candidates.length) setIndex(index + 1);
    else setFailed(true);
  };

  if (!src || failed)
    return <div className="media-fallback" aria-label={`${prompt.title} artwork unavailable`} />;
  // Image/CDN URLs may have no file extension (including Next image proxies).
  if (
    IMAGE_RE.test(src) ||
    (src === prompt.cover_image_url && !/\.(mp4|webm|mov|m4v)(\?|$)/i.test(src))
  ) {
    return (
      <Image
        src={src}
        alt={prompt.title}
        fill
        sizes="(max-width: 700px) 45vw, 260px"
        onError={recover}
      />
    );
  }
  return <video src={src} muted controls loop playsInline preload="none" onError={recover} />;
}
