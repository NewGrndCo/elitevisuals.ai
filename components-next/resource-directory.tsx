"use client";

import Image from "next/image";
import Link from "next/link";
import { ExternalLink, Link2, Lock } from "lucide-react";
import type { ResourceItem } from "@/lib-next/supabase";
import { useMemberSession } from "@/lib-next/member-auth";

export function ResourceDirectory({ items }: { items: ResourceItem[] }) {
  const { session, loading } = useMemberSession();
  const locked = loading || !session;
  return (
    <div className="member-gate-shell">
      <div className={`resource-directory ${locked ? "member-content-locked" : ""}`}>
        {items.map((resource) => {
          const contents = (
            <>
              <div className="resource-logo">
                {resource.image_url ? (
                  <Image src={resource.image_url} alt="" width={64} height={64} />
                ) : (
                  <Link2 />
                )}
              </div>
              <div className="resource-copy">
                <span>{resource.resource_type}</span>
                <h2>{resource.title}</h2>
                <p>{resource.description}</p>
                <small>{resource.url.replace(/^https?:\/\//, "").replace(/\/$/, "")}</small>
              </div>
              <div className="resource-visit" aria-label="Open resource">
                <ExternalLink size={17} />
              </div>
            </>
          );
          return locked ? (
            <article className="resource-card" key={resource.id} aria-hidden="true">
              {contents}
            </article>
          ) : (
            <a
              href={resource.url}
              target="_blank"
              rel="noreferrer"
              className="resource-card"
              key={resource.id}
            >
              {contents}
            </a>
          );
        })}
      </div>
      {locked && (
        <div className="member-gate-card">
          <Lock size={24} />
          <h2>Sign in to view resources</h2>
          <p>Free member access unlocks every recommended tool and source link.</p>
          <Link href="/login?next=/resources" className="button button-solid">
            Sign In
          </Link>
        </div>
      )}
    </div>
  );
}
