"use client";

import Link from "next/link";
import { useState } from "react";
import { Download, Loader2, Lock } from "lucide-react";
import { useMemberSession } from "@/lib-next/member-auth";

export function SkillDownload({ downloadUrl, slug }: { downloadUrl: string; slug: string }) {
  const { session, loading } = useMemberSession();
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");

  if (loading || !session)
    return (
      <div className="locked-download">
        <button className="button button-solid" disabled>
          <Download size={16} /> Download ZIP
        </button>
        <Link href={`/login?next=/skill/${slug}`} className="locked-download-cover">
          <Lock size={15} /> Sign in to download
        </Link>
      </div>
    );

  const download = async () => {
    setDownloading(true);
    setError("");
    try {
      const response = await fetch(downloadUrl, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!response.ok) throw new Error("The download could not be authorized.");
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = decodeURIComponent(downloadUrl.split("/").pop() || `${slug}.zip`).replace(
        /^[0-9a-f-]+-/i,
        "",
      );
      anchor.click();
      URL.revokeObjectURL(objectUrl);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Download failed.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <>
      <button
        className="button button-solid"
        onClick={() => void download()}
        disabled={downloading}
      >
        {downloading ? <Loader2 className="spin" size={16} /> : <Download size={16} />}
        {downloading ? "Preparing…" : "Download ZIP"}
      </button>
      {error && <div className="admin-error">{error}</div>}
    </>
  );
}
