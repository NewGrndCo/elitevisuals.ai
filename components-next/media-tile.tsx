"use client";

import Image from "next/image";
import { useState } from "react";
import type { Prompt } from "@/lib-next/supabase";

const IMAGE_RE = /\.(gif|png|jpe?g|webp|avif|svg)(\?|$)/i;

export function MediaTile({ prompt }: { prompt: Prompt }) {
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
  if (IMAGE_RE.test(src)) {
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
  return <video src={src} muted autoPlay loop playsInline preload="metadata" onError={recover} />;
}
