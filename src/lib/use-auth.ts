import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useAuth() {
  const [user, setUser] = useState<{ id: string; email: string | null } | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const { data } = await supabase.auth.getUser();
      if (!active) return;
      if (!data.user) { setUser(null); setIsAdmin(false); setLoading(false); return; }
      setUser({ id: data.user.id, email: data.user.email ?? null });
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id);
      if (!active) return;
      setIsAdmin(!!roles?.some((r) => r.role === "admin"));
      setLoading(false);
    };
    load();
    const { data: sub } = supabase.auth.onAuthStateChange(() => load());
    return () => { active = false; sub.subscription.unsubscribe(); };
  }, []);

  return { user, isAdmin, loading };
}
