import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SiteHeader } from "@/components/site-chrome";
import { supabase } from "@/integrations/supabase/client";
export const Route = createFileRoute("/login")({
  validateSearch: (s: Record<string, unknown>) => ({
    next: typeof s.next === "string" && s.next.startsWith("/") ? s.next : "/account/downloads",
  }),
  component: Login,
});
function Login() {
  const { next } = Route.useSearch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signup, setSignup] = useState(false);
  const [msg, setMsg] = useState("");
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");
    const r = signup
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });
    if (r.error) {
      setMsg(r.error.message);
      return;
    }
    if (signup && !r.data.session) {
      setMsg("Check your email to confirm your account.");
      return;
    }
    location.href = next;
  };
  return (
    <>
      <SiteHeader />
      <main className="mx-auto grid min-h-screen max-w-md place-items-center px-5">
        <form onSubmit={submit} className="glass w-full rounded-3xl p-8">
          <h1 className="font-display text-3xl font-semibold">
            {signup ? "Create account" : "Welcome back"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to access secure skill downloads.
          </p>
          <input
            className="mt-7 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3"
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="mt-3 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3"
            type="password"
            minLength={8}
            required
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {msg && <p className="mt-3 text-sm text-amber-300">{msg}</p>}
          <button className="mt-5 w-full rounded-xl bg-primary py-3 font-bold text-primary-foreground">
            {signup ? "Create account" : "Sign in"}
          </button>
          <button
            type="button"
            onClick={() => setSignup(!signup)}
            className="mt-4 w-full text-sm text-muted-foreground"
          >
            {signup ? "Already have an account? Sign in" : "New here? Create an account"}
          </button>
        </form>
      </main>
    </>
  );
}
