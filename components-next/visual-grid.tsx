import Link from "next/link";
import type { Prompt } from "@/lib-next/supabase";
import { MotionControl } from "./motion-control";
import { MediaTile } from "./media-tile";

function Track({ prompts, reverse = false }: { prompts: Prompt[]; reverse?: boolean }) {
  const repeated = [...prompts, ...prompts];
  return (
    <div className="marquee-row">
      <div className={`marquee-track ${reverse ? "reverse" : ""}`}>
        {repeated.map((prompt, index) => (
          <Link
            href={`/prompt/${prompt.slug}`}
            prefetch={false}
            className="visual-tile"
            key={`${prompt.id}-${index}`}
            aria-hidden={index >= prompts.length}
            tabIndex={index >= prompts.length ? -1 : 0}
          >
            <MediaTile
              prompt={{
                title: prompt.title,
                cover_image_url: prompt.cover_image_url,
                demo_video_url: prompt.demo_video_url,
              }}
            />
            <span>{prompt.title}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function VisualGrid({ prompts }: { prompts: Prompt[] }) {
  const media = prompts.filter((p) => p.cover_image_url || p.demo_video_url);
  const midpoint = Math.max(1, Math.ceil(media.length / 2));
  const first = media.slice(0, midpoint);
  const second = media.slice(midpoint);
  if (!first.length) return null;
  return (
    <MotionControl>
      <div className="visual-fade left" />
      <div className="visual-fade right" />
      <Track prompts={first} />
      <Track prompts={second.length ? second : [...first].reverse()} reverse />
    </MotionControl>
  );
}
