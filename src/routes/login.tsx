import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-chrome";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mail, Sparkles } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — Elite Visuals" }] }),
  component: LoginPage,
});

function LoginPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) nav({ to: "/" });
    });
    supabase.auth.getUser().then(({ data }) => { if (data.user) nav({ to: "/" }); });
    return () => sub.subscription.unsubscribe();
  }, [nav]);


  const emailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } });
        if (error) throw error;
        toast.success("Check your inbox to confirm your email.");
      }
    } catch (err: any) {
      toast.error(err.message ?? "Authentication failed");
    } finally { setLoading(false); }
  };

  return (
    <>
      <SiteHeader />
      <main className="grid min-h-screen place-items-center px-6 pt-28">
        <div className="glass-strong aurora-bg relative w-full max-w-md overflow-hidden rounded-3xl p-8">
          <div className="absolute -top-20 right-0 h-56 w-56 rounded-full bg-[oklch(0.55_0.22_295/30%)] blur-3xl" />
          <div className="relative">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-[oklch(0.72_0.20_295)] to-[oklch(0.82_0.16_200)]">
              <Sparkles className="h-5 w-5 text-background" />
            </div>
            <h1 className="mt-5 font-display text-3xl font-semibold text-gradient">Welcome back</h1>
            <p className="mt-1 text-sm text-muted-foreground">Sign in to access the admin dashboard.</p>




            <form onSubmit={emailAuth} className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground">Email</label>
                <div className="glass mt-1 flex items-center gap-2 rounded-xl px-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <input value={email} onChange={(e) => setEmail(e.target.value)} required type="email" className="w-full bg-transparent py-2.5 text-sm outline-none" placeholder="you@studio.com" />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Password</label>
                <input value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} type="password" className="glass mt-1 w-full rounded-xl bg-transparent px-3 py-2.5 text-sm outline-none" placeholder="••••••••" />
              </div>
              <button disabled={loading} className="ring-glow w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60">
                {mode === "signin" ? "Sign in" : "Create account"}
              </button>
            </form>

            <button onClick={() => setMode(mode === "signin" ? "signup" : "signin")} className="mt-4 w-full text-center text-xs text-muted-foreground hover:text-foreground">
              {mode === "signin" ? "No account? Create one" : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      </main>
    </>
  );
}

