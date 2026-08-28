import Link from "next/link";
import Image from "next/image";
import type { Prompt } from "@/lib-next/supabase";

export function VisualGrid({ prompts }: { prompts: Prompt[] }) {
  const items = prompts.filter((p) => p.cover_image_url || p.demo_video_url).slice(0, 8);
  return (
    <div className="visual-stage">
      <div className="visual-fade left" />
      <div className="visual-fade right" />
      <div className="visual-grid">
        {items.map((p, i) => (
          <Link href={`/prompt/${p.slug}`} className={`visual-tile tile-${i}`} key={p.id}>
            {p.cover_image_url ? (
              <Image
                src={p.cover_image_url}
                alt={p.title}
                fill
                sizes="(max-width: 700px) 45vw, 260px"
              />
            ) : (
              <video src={p.demo_video_url ?? ""} muted autoPlay loop playsInline />
            )}
            <span>{p.title}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
