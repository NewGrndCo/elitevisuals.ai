import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ExternalLink, Search, Sparkles } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { useResources } from "@/lib/queries";

export const Route = createFileRoute("/resources")({
  head: () => ({
    meta: [
      { title: "AI Resources — Elite Visuals" },
      {
        name: "description",
        content: "Curated AI tools, platforms, creators, news sources, and visual workflows.",
      },
    ],
  }),
  component: ResourcesPage,
});

function ResourcesPage() {
  const { data, isLoading, isError } = useResources();
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");
  const types = ["all", ...new Set((data ?? []).map((r) => r.resource_type))];
  const items = useMemo(
    () =>
      (data ?? []).filter(
        (r) =>
          (type === "all" || r.resource_type === type) &&
          `${r.title} ${r.description} ${r.tags.join(" ")}`
            .toLowerCase()
            .includes(search.toLowerCase()),
      ),
    [data, search, type],
  );

  return (
    <>
      <SiteHeader />
      <main className="pt-32">
        <section className="mx-auto max-w-6xl px-6 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#f1ebff] px-4 py-2 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" /> Curated by Elite Visuals
          </span>
          <h1 className="mt-6 font-display text-5xl font-extrabold tracking-[-0.05em] sm:text-7xl">
            useful AI resources,
            <br />
            <span className="text-gradient">all in one place.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-muted-foreground">
            Tools, platforms, trusted information sources, and visual workflow references worth
            keeping close.
          </p>
        </section>
        <section className="mx-auto mt-14 max-w-6xl px-6">
          <div className="glass flex flex-col gap-3 rounded-3xl p-4 sm:flex-row">
            <label className="flex flex-1 items-center gap-2 rounded-2xl bg-white px-4 shadow-sm">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search resources"
                className="w-full bg-transparent py-3 text-sm outline-none"
              />
            </label>
            <div className="flex gap-2 overflow-x-auto">
              {types.map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`rounded-full px-4 py-2 text-xs font-semibold capitalize ${type === t ? "bg-primary text-white" : "bg-white text-muted-foreground"}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          {isLoading ? (
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="glass aspect-[4/3] animate-pulse rounded-3xl" />
              ))}
            </div>
          ) : items.length ? (
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((r) => (
                <a
                  key={r.id}
                  href={r.url}
                  target="_blank"
                  rel="noreferrer"
                  className="glass group overflow-hidden rounded-3xl transition hover:-translate-y-1"
                >
                  {r.image_url ? (
                    <img src={r.image_url} alt="" className="aspect-[16/9] w-full object-cover" />
                  ) : (
                    <div className="aspect-[16/9] bg-gradient-to-br from-[#efe7ff] via-white to-[#dff7ff]" />
                  )}
                  <div className="p-5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                        {r.resource_type}
                      </span>
                      <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                    </div>
                    <h2 className="mt-2 font-display text-xl font-semibold">{r.title}</h2>
                    <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                      {r.description}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {r.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-white px-2.5 py-1 text-[10px] text-muted-foreground"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <div className="glass mt-8 rounded-3xl p-12 text-center">
              <h2 className="font-display text-xl font-semibold">
                {isError
                  ? "Resources need their database migration"
                  : "Resources are being curated"}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Add and publish entries from Admin → Resources.
              </p>
            </div>
          )}
        </section>
        <SiteFooter />
      </main>
    </>
  );
}
