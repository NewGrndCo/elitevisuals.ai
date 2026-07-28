import { useMemo } from "react";
import { AlertTriangle, Copy, ExternalLink, FileText, FolderKanban, Package } from "lucide-react";
import { useAiLogos, useCategories, usePacks, usePrompts } from "@/lib/queries";
import type { AdminTab } from "./tabs";
import { SectionHeader } from "./primitives";

export function Overview({ onJump }: { onJump: (t: AdminTab) => void }) {
  const { data: prompts } = usePrompts();
  const { data: cats } = useCategories();
  const { data: logos } = useAiLogos();
  const { data: packs } = usePacks(true);

  const stats = useMemo(() => {
    const allPrompts = prompts ?? [];
    const allPacks = packs ?? [];
    return {
      prompts: allPrompts.length,
      livePrompts: allPrompts.filter((p) => p.is_published).length,
      packs: allPacks.length,
      livePacks: allPacks.filter((p) => p.is_published).length,
      cats: (cats ?? []).length,
      liveLogos: (logos ?? []).filter((l) => l.is_published).length,
      totalCopies: allPrompts.reduce((s, p) => s + (p.copy_count ?? 0), 0),
    };
  }, [prompts, packs, cats, logos]);

  /* Things that need attention — the old overview only showed vanity counts,
     so problems like an empty pack or a prompt with no text were invisible. */
  const issues = useMemo(() => {
    const out: { label: string; detail: string; tab: AdminTab }[] = [];
    const allPrompts = prompts ?? [];
    const allPacks = packs ?? [];

    const emptyText = allPrompts.filter((p) => p.is_published && !p.prompt_text.trim());
    if (emptyText.length)
      out.push({
        label: `${emptyText.length} published prompt${emptyText.length === 1 ? "" : "s"} with no text`,
        detail: emptyText
          .slice(0, 3)
          .map((p) => p.title)
          .join(", "),
        tab: "prompts",
      });

    const noPack = allPrompts.filter((p) => p.is_published && !p.pack_id);
    if (noPack.length)
      out.push({
        label: `${noPack.length} published prompt${noPack.length === 1 ? "" : "s"} not in a pack`,
        detail: "These won't appear on any pack page.",
        tab: "prompts",
      });

    const emptyPacks = allPacks.filter(
      (pk) => pk.is_published && !allPrompts.some((p) => p.pack_id === pk.id && p.is_published),
    );
    if (emptyPacks.length)
      out.push({
        label: `${emptyPacks.length} published pack${emptyPacks.length === 1 ? "" : "s"} with no live prompts`,
        detail: emptyPacks
          .slice(0, 3)
          .map((p) => p.title)
          .join(", "),
        tab: "packs",
      });

    const noCover = allPacks.filter((pk) => pk.is_published && !pk.cover_image_url);
    if (noCover.length)
      out.push({
        label: `${noCover.length} published pack${noCover.length === 1 ? "" : "s"} without a cover image`,
        detail: "They render as a gradient placeholder.",
        tab: "packs",
      });

    return out;
  }, [prompts, packs]);

  const cards = [
    {
      label: "Prompts",
      value: stats.prompts,
      sub: `${stats.livePrompts} live · ${stats.prompts - stats.livePrompts} draft`,
      tab: "prompts" as AdminTab,
      icon: FileText,
    },
    {
      label: "Packs",
      value: stats.packs,
      sub: `${stats.livePacks} live · ${stats.packs - stats.livePacks} draft`,
      tab: "packs" as AdminTab,
      icon: Package,
    },
    {
      label: "Categories",
      value: stats.cats,
      sub: `${stats.liveLogos} logos on homepage`,
      tab: "categories" as AdminTab,
      icon: FolderKanban,
    },
    {
      label: "Total copies",
      value: stats.totalCopies,
      sub: "All-time prompt copies",
      tab: "prompts" as AdminTab,
      icon: Copy,
    },
  ];

  const top = useMemo(
    () => [...(prompts ?? [])].sort((a, b) => (b.copy_count ?? 0) - (a.copy_count ?? 0)).slice(0, 5),
    [prompts],
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <button
              key={c.label}
              onClick={() => onJump(c.tab)}
              className="glass-card group rounded-3xl p-5 text-left transition-transform hover:-translate-y-0.5"
            >
              <div className="flex items-start justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {c.label}
                </span>
                <Icon className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
              </div>
              <div className="mt-3 font-display text-3xl font-semibold">
                {c.value.toLocaleString()}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">{c.sub}</div>
            </button>
          );
        })}
      </div>

      {issues.length > 0 && (
        <section className="glass-card rounded-3xl border-yellow-500/25 p-6">
          <SectionHeader
            title="Needs attention"
            desc="Things that will look broken or empty on the public site."
          />
          <ul className="mt-4 space-y-2">
            {issues.map((issue) => (
              <li key={issue.label}>
                <button
                  onClick={() => onJump(issue.tab)}
                  className="glass flex w-full items-start gap-3 rounded-2xl p-3 text-left transition-colors hover:bg-white/5"
                >
                  <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-yellow-300" />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">{issue.label}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {issue.detail}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="glass-card rounded-3xl p-6">
        <SectionHeader
          title="Most copied prompts"
          actions={
            <button
              onClick={() => onJump("prompts")}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              View all →
            </button>
          }
        />
        {top.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No prompts yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-border/40">
            {top.map((p, i) => (
              <li key={p.id} className="flex items-center gap-4 py-3">
                <span className="w-5 flex-shrink-0 text-center font-mono text-xs text-muted-foreground">
                  {i + 1}
                </span>
                <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-white/5">
                  {p.cover_image_url && (
                    <img src={p.cover_image_url} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{p.title}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {p.categories?.name ?? "Uncategorized"}
                  </div>
                </div>
                <div className="flex-shrink-0 text-right">
                  <div className="font-mono text-sm">{p.copy_count}</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    copies
                  </div>
                </div>
                <a
                  href={`/prompt/${p.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Open ${p.title}`}
                  className="flex-shrink-0 text-muted-foreground hover:text-foreground"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
