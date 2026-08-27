import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Check, Sparkles } from "lucide-react";
import { useState } from "react";
import { joinWaitlist } from "@/lib/waitlist.functions";

export const Route = createFileRoute("/waitlist")({
  head: () => ({
    meta: [
      { title: "Join the waitlist — Elite Visuals" },
      {
        name: "description",
        content: "Get early access to new EliteVisuals creative tools and downloadable AI skills.",
      },
    ],
  }),
  component: WaitlistPage,
});

function WaitlistPage() {
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      await joinWaitlist({
        data: {
          name: String(form.get("name") ?? ""),
          email: String(form.get("email") ?? ""),
          interests: String(form.get("interests") ?? ""),
          website: String(form.get("website") ?? ""),
        },
      });
      setSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please try again");
    } finally {
      setBusy(false);
    }
  };
  return (
    <main className="relative min-h-screen overflow-hidden px-5 py-12 sm:py-16">
      <div
        className="pointer-events-none absolute inset-0 opacity-35"
        style={{
          backgroundImage: "radial-gradient(#8b5cf6 1px,transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      />
      <div className="relative mx-auto max-w-3xl">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> EliteVisuals.ai
        </Link>
        <div className="mx-auto mt-12 flex h-44 max-w-md items-end justify-center">
          {[
            "-rotate-12 translate-x-10",
            "-rotate-3 translate-x-5",
            "rotate-3 -translate-x-5",
            "rotate-12 -translate-x-10",
          ].map((c, i) => (
            <div
              key={i}
              className={`-mx-3 h-36 w-28 rounded-[20px] border-4 border-white shadow-xl ${c}`}
              style={{
                background: [
                  "linear-gradient(145deg,#2e1065,#7c3aed)",
                  "linear-gradient(145deg,#ddd6fe,#6d28d9)",
                  "linear-gradient(145deg,#4c1d95,#f5f3ff)",
                  "linear-gradient(145deg,#171027,#a855f7)",
                ][i],
              }}
            />
          ))}
        </div>
        <header className="mt-10 text-center">
          <p className="text-xs font-bold uppercase tracking-[.22em] text-primary">Early access</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-.055em] sm:text-6xl">
            Help shape what we build next.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Get first access to new visual tools, prompt packs, and installable creative skills.
          </p>
        </header>
        {sent ? (
          <div className="mx-auto mt-10 max-w-xl rounded-[28px] bg-white p-10 text-center shadow-sm">
            <Check className="mx-auto h-8 w-8 text-primary" />
            <h2 className="mt-4 text-2xl font-semibold">You’re on the list.</h2>
            <p className="mt-2 text-muted-foreground">
              We’ll email you when the next EliteVisuals release is ready.
            </p>
          </div>
        ) : (
          <form
            onSubmit={submit}
            className="mx-auto mt-10 grid max-w-2xl gap-4 rounded-[30px] bg-white p-5 shadow-[0_20px_70px_rgba(65,35,105,.10)] sm:grid-cols-2 sm:p-7"
          >
            <label className="text-sm font-semibold">
              Name
              <input
                name="name"
                maxLength={100}
                className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 font-normal outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="Your name"
              />
            </label>
            <label className="row-span-2 text-sm font-semibold">
              What do you want from EliteVisuals?
              <textarea
                name="interests"
                maxLength={1000}
                className="mt-2 min-h-32 w-full resize-none rounded-2xl border border-border bg-background px-4 py-3 font-normal outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="Prompt tools, video workflows, downloadable skills…"
              />
            </label>
            <label className="text-sm font-semibold">
              Email
              <input
                name="email"
                type="email"
                required
                maxLength={320}
                className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 font-normal outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="you@example.com"
              />
            </label>
            <input
              name="website"
              tabIndex={-1}
              autoComplete="off"
              className="hidden"
              aria-hidden="true"
            />
            {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}
            <button
              disabled={busy}
              className="ev-button ev-button-primary sm:col-span-2 sm:mx-auto sm:min-w-48"
            >
              <Sparkles className="h-4 w-4" /> {busy ? "Joining…" : "Join waitlist"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
