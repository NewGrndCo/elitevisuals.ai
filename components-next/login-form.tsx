"use client";

import { safeDestination } from "@/lib-next/content-policy";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { syncMemberSession, useMemberSession } from "@/lib-next/member-auth";
import { Loader2 } from "lucide-react";

export function LoginForm() {
  const search = useSearchParams();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const { session, loading, syncError } = useMemberSession();
  const token = session?.access_token;
  const destination = safeDestination(search.get("next"));

  useEffect(() => {
    if (loading || !token) return;
    let active = true;
    void syncMemberSession(token)
      .then(() => {
        if (active)
          window.location.replace(
            destination === "/login" || destination.startsWith("/login?")
              ? "/promptbox"
              : destination,
          );
      })
      .catch(() => {
        if (active) setError("Unable to verify your session. Reload to try again.");
      });
    return () => {
      active = false;
    };
  }, [loading, token, destination]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    const next = search.get("next");
    const destination = safeDestination(next);
    try {
      const response = await fetch("/api/member-signup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, next: destination }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to send the sign-in link.");
      setMessage("Check your email for your secure sign-in link.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to send the sign-in link.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit}>
      <label>
        Email address
        <input
          type="email"
          name="email"
          maxLength={320}
          aria-describedby={
            error || syncError ? "login-error" : message ? "login-status" : undefined
          }
          aria-invalid={error === "Enter a valid email address." || undefined}
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </label>
      <button className="button button-solid" type="submit" disabled={busy}>
        {busy && <Loader2 className="spin" size={16} />}
        {busy ? "Sending…" : "Send magic link"}
      </button>
      {message && (
        <div id="login-status" role="status" className="admin-success">
          {message}
        </div>
      )}
      {(error || syncError) && (
        <div id="login-error" role="alert" className="admin-error">
          {error || syncError}
        </div>
      )}
    </form>
  );
}
