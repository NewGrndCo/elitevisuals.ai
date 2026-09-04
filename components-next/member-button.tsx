"use client";

import Link from "next/link";
import { useMemberSession } from "@/lib-next/member-auth";

export function MemberButton() {
  const { client, session, loading } = useMemberSession();
  if (loading) return <span className="button button-solid nav-signin">Checking…</span>;
  if (!session)
    return (
      <Link href="/login" className="button button-solid nav-signin">
        Sign In
      </Link>
    );
  return (
    <button className="button button-solid nav-signin" onClick={() => void client.auth.signOut()}>
      Sign Out
    </button>
  );
}
