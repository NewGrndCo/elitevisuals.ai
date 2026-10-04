"use client";

import Link from "next/link";
import { ArrowRight } from "@/components-next/icons";
import { CardStack, type CardStackItem } from "@/components/ui/card-stack";

export function WaitlistCardStack({ items }: { items: CardStackItem[] }) {
  return (
    <CardStack
      items={items}
      className="waitlist-card-stack"
      renderCard={(item) => (
        <Link
          href={item.href ?? "/"}
          className="waitlist-stack-card"
          aria-label={`${item.tag}: ${item.title}`}
        >
          {item.imageSrc ? (
            <img src={item.imageSrc} alt="" draggable={false} />
          ) : (
            <div className="image-fallback" />
          )}
          <div className="waitlist-stack-shade" />
          <div className="waitlist-stack-copy">
            <span>{item.tag}</span>
            <h2>{item.title}</h2>
            {item.description && <p>{item.description}</p>}
            <b>
              {item.ctaLabel ?? "Explore"} <ArrowRight size={15} />
            </b>
          </div>
        </Link>
      )}
    />
  );
}
