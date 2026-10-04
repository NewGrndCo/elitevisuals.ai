"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { safeDestination } from "@/lib-next/content-policy";
import coverArt from "@/assets/skill-covers/elite-visuals-ai-cover-art-lite.png";

const previews = [
  { title: "Particle Dissolution", image: "/media/prompts/particle-diss.webp" },
  { title: "Shattered Mirror", image: "/media/prompts/shattered-mirror.webp" },
  { title: "Chrono Distortion", image: "/media/prompts/chrono-distortion.webp" },
  { title: "Liquid Metal", image: "/media/prompts/liquid-metal.webp" },
  { title: "Tone Scatter", image: "/media/prompts/tone-scatter.webp" },
  { title: "LIDAR Tear", image: "/media/prompts/lidar-tear.webp" },
];

// Only public artwork and presentation labels belong in this decorative preview.
// Protected prompt text, resource links, packages, and workspace state stay server gated.
export function MemberAccessPreview() {
  const destination = safeDestination(useSearchParams().get("next"));
  const section = destination.split("/")[1];
  const kind =
    section === "resources"
      ? "resources"
      : section === "workspace"
        ? "workspace"
        : section === "skills" || section === "skill"
          ? "skills"
          : "prompts";
  const title = {
    resources: "Useful AI resources.",
    workspace: "Your ideas. One workspace.",
    skills: "Downloadable AI skills.",
    prompts: "Find your next visual.",
  }[kind];
  return (
    <div className={`access-preview access-preview-${kind}`} aria-hidden="true" inert>
      <section className="subhero">
        <p className="kicker">
          {kind === "resources"
            ? "Curated directory"
            : kind === "skills"
              ? "Creative systems"
              : kind}
        </p>
        <h1>{title}</h1>
        <p>Tools, visual workflows, and creative inspiration for your next creation.</p>
      </section>
      <section className="catalog-section">
        {kind === "resources" ? (
          <div className="resource-directory">
            {[
              "Image tools",
              "Video platforms",
              "Creative workflows",
              "AI news",
              "Creator resources",
              "Production tools",
            ].map((label) => (
              <article className="resource-card" key={label}>
                <div className="resource-logo">✦</div>
                <div className="resource-copy">
                  <span>Curated resource</span>
                  <h2>{label}</h2>
                  <div className="preview-line" />
                  <div className="preview-line short" />
                </div>
                <span>↗</span>
              </article>
            ))}
          </div>
        ) : kind === "workspace" ? (
          <div className="preview-studio">
            <aside>
              <h2>Elite Visual Workspace</h2>
              {["Cover art", "Transitions", "Logos", "Promo graphics", "Flyers", "Enhance"].map(
                (label) => (
                  <p key={label}>{label}</p>
                ),
              )}
            </aside>
            <div className="preview-studio-canvas">
              <Image src={coverArt} alt="" fill sizes="(max-width: 700px) 90vw, 50vw" />
              <span>Add your image</span>
            </div>
            <aside>
              <h2>Shape your idea</h2>
              <div className="preview-line" />
              <div className="preview-line" />
              <div className="preview-line short" />
            </aside>
          </div>
        ) : (
          <div className="catalog-grid">
            {previews.map((item, index) => (
              <article className="preview-visual-card" key={item.title}>
                <Image
                  src={kind === "skills" ? coverArt : item.image}
                  alt=""
                  fill
                  sizes="(max-width: 700px) 50vw, 33vw"
                />
                <div>
                  <span>{kind === "skills" ? "Creative workflow" : "AI Transition"}</span>
                  <h2>
                    {kind === "skills"
                      ? ["Cover Art Skill", "HELIX Lite", "Creative systems"][index % 3]
                      : item.title}
                  </h2>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
