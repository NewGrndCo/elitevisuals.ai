"use client";

import { type ReactNode } from "react";

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
  return (
    <div className={`flipping-card ${flipped ? "is-flipped" : ""} ${className}`}>
      <div className="flipping-card-inner">
        <div className="flipping-card-face flipping-card-front">{frontContent}</div>
        <div className="flipping-card-face flipping-card-back">{backContent}</div>
      </div>
    </div>
  );
}
