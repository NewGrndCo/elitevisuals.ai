"use client";
import Link from "next/link";
export default function PageError({ reset }: { reset: () => void }) {
  return (
    <main className="route-state">
      <p className="kicker">Elite Visuals</p>
      <h1>This page couldn’t load.</h1>
      <p>Your content is safe. Check your connection and try again.</p>
      <button className="button button-solid" onClick={reset}>
        Try again
      </button>
      <Link href="/" className="button button-outline">
        Back home
      </Link>
    </main>
  );
}
