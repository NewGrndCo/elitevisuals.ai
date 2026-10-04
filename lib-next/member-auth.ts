"use client";

import { createClient, type Session } from "@supabase/supabase-js";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

let browserClient: ReturnType<typeof createClient> | null = null;
let lastBridgeToken: string | null | undefined;
let bridgeQueue: Promise<void> = Promise.resolve();

export function syncMemberSession(token: string | null): Promise<void> {
  if (lastBridgeToken === token) return bridgeQueue;
  lastBridgeToken = token;
  bridgeQueue = bridgeQueue
    .catch(() => {})
    .then(async () => {
      const response = await fetch("/api/member-session", {
        method: token ? "POST" : "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        cache: "no-store",
      });
      if (!response.ok) {
        lastBridgeToken = undefined;
        throw new Error("Unable to verify your session. Please retry.");
      }
    });
  return bridgeQueue;
}

export function getMemberClient() {
  if (browserClient) return browserClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Member sign-in is not configured.");
  browserClient = createClient(url, key, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });
  return browserClient;
}

export function useMemberSession() {
  const router = useRouter();
  const client = useMemo(() => getMemberClient(), []);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncError, setSyncError] = useState("");
  const token = session?.access_token ?? null;
  const previousToken = useRef<string | null>(null);

  useEffect(() => {
    if (loading) return;
    let active = true;
    void syncMemberSession(token)
      .then(() => {
        if (active) {
          setSyncError("");
          // Refresh server-rendered member routes after logout.
          if (previousToken.current && !token) router.refresh();
          previousToken.current = token;
        }
      })
      .catch(() => {
        if (active) setSyncError("Unable to verify your session. Please retry.");
      });
    return () => {
      active = false;
    };
  }, [loading, token, router]);

  useEffect(() => {
    let active = true;
    void client.auth
      .getSession()
      .then(({ data }) => {
        if (active) {
          setSession(data.session);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setSession(null);
          setLoading(false);
        }
      });
    const { data } = client.auth.onAuthStateChange((_event, nextSession) => {
      if (active) {
        setSession(nextSession);
        setLoading(false);
      }
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [client]);

  return { client, session, loading, syncError };
}
