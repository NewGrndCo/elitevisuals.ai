"use client";
import { useEffect, useState } from "react";

let pending: Promise<boolean> | undefined;
function readAccess() {
  if (!pending) {
    pending = fetch("/api/website-access", { cache: "no-store" })
      .then(async (response) => (response.ok ? (await response.json()).required !== false : true))
      .catch(() => true);
    void pending.finally(() => {
      pending = undefined;
    });
  }
  return pending;
}
export function useWebsiteAccess() {
  const [required, setRequired] = useState(true);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    void readAccess().then((value) => {
      if (active) {
        setRequired(value);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);
  return { required, loading };
}
