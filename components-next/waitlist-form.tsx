"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";

export function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, company, source: "website" }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to join right now.");
      setMessage(body.existing ? "You’re already on the list." : "You’re on the list.");
      setEmail("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to join right now.");
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
          autoComplete="email"
          maxLength={320}
          placeholder="you@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </label>
      <label className="waitlist-trap" aria-hidden="true">
        Company
        <input
          type="text"
          name="company"
          tabIndex={-1}
          autoComplete="off"
          value={company}
          onChange={(event) => setCompany(event.target.value)}
        />
      </label>
      <button className="button button-solid" type="submit" disabled={busy}>
        {busy ? <Loader2 className="spin" size={17} /> : message ? <Check size={17} /> : null}
        {busy ? "Joining…" : message || "Join Waitlist"}
      </button>
      {error && (
        <div className="admin-error" role="alert">
          {error}
        </div>
      )}
      {message && (
        <div className="admin-success" role="status">
          {message}
        </div>
      )}
    </form>
  );
}
