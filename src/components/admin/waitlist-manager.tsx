import { useEffect, useState } from "react";
import { Download, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Signup = { id: string; name: string; email: string; interests: string; created_at: string };

export function WaitlistManager() {
  const [items, setItems] = useState<Signup[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const db = supabase as unknown as {
      from: (table: string) => {
        select: (columns: string) => {
          order: (
            column: string,
            options: { ascending: boolean },
          ) => Promise<{ data: Signup[] | null }>;
        };
      };
    };
    db.from("waitlist_signups")
      .select("id,name,email,interests,created_at")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setItems(data ?? []);
        setLoading(false);
      });
  }, []);
  const exportCsv = () => {
    const escape = (value: string) => `"${value.replaceAll('"', '""')}"`;
    const csv = [
      "Name,Email,Interests,Joined",
      ...items.map((item) =>
        [item.name, item.email, item.interests, item.created_at].map(escape).join(","),
      ),
    ].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `elitevisuals-waitlist-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };
  return (
    <section>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Waitlist</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Early-access leads and requested tools.
          </p>
        </div>
        <button
          onClick={exportCsv}
          disabled={!items.length}
          className="ev-button ev-button-secondary"
        >
          <Download className="h-4 w-4" /> Export CSV
        </button>
      </div>
      {loading ? (
        <div className="glass animate-pulse rounded-3xl p-10 text-center">Loading…</div>
      ) : items.length ? (
        <div className="overflow-hidden rounded-3xl border border-border bg-white">
          <div className="grid grid-cols-[1fr_1fr_auto] gap-4 border-b border-border px-5 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <span>Person</span>
            <span>Interests</span>
            <span>Joined</span>
          </div>
          {items.map((item) => (
            <div
              key={item.id}
              className="grid grid-cols-1 gap-3 border-b border-border px-5 py-4 last:border-0 md:grid-cols-[1fr_1fr_auto]"
            >
              <div>
                <b>{item.name || "Unnamed"}</b>
                <a
                  href={`mailto:${item.email}`}
                  className="mt-1 flex items-center gap-1.5 text-sm text-primary"
                >
                  <Mail className="h-3.5 w-3.5" />
                  {item.email}
                </a>
              </div>
              <p className="text-sm text-muted-foreground">{item.interests || "—"}</p>
              <time className="text-xs text-muted-foreground">
                {new Date(item.created_at).toLocaleDateString()}
              </time>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass rounded-3xl p-10 text-center text-muted-foreground">
          No waitlist signups yet.
        </div>
      )}
    </section>
  );
}
