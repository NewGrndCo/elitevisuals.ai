"use client";

import { useEffect, useRef, type ReactNode } from "react";

export function FlippingCard({
  flipped,
  frontContent,
  backContent,
  className = "",
}: {
  flipped: boolean;
  frontContent: ReactNode;
  backContent: ReactNode;
  className?: string;
}) {
  const container = useRef<HTMLDivElement>(null);
  const previousFace = useRef(flipped);
  useEffect(() => {
    if (previousFace.current === flipped) return;
    previousFace.current = flipped;
    const node = container.current;
    node
      ?.querySelector<HTMLElement>(
        flipped ? ".flipping-card-back button" : ".flipping-card-front button",
      )
      ?.focus();
  }, [flipped]);
  return (
    <div ref={container} className={`flipping-card ${flipped ? "is-flipped" : ""} ${className}`}>
      <div className="flipping-card-inner">
        <div
          className="flipping-card-face flipping-card-front"
          aria-hidden={flipped}
          inert={flipped}
        >
          {frontContent}
        </div>
        <div
          className="flipping-card-face flipping-card-back"
          aria-hidden={!flipped}
          inert={!flipped}
        >
          {backContent}
        </div>
      </div>
    </div>
  );
}
