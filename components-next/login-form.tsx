"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { getMemberClient } from "@/lib-next/member-auth";

export function LoginForm() {
  const search = useSearchParams();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    const next = search.get("next");
    const destination = next?.startsWith("/") ? next : "/promptbox";
    try {
      const { error: authError } = await getMemberClient().auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}${destination}` },
      });
      if (authError) throw authError;
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
      {message && <div className="admin-success">{message}</div>}
      {error && <div className="admin-error">{error}</div>}
    </form>
  );
}
