"use client";

import { type ReactNode } from "react";

export function Marquee({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`ui-marquee ${className}`}>
      <div className="ui-marquee-track">
        <div className="ui-marquee-group">{children}</div>
        <div className="ui-marquee-group" aria-hidden="true">
          {children}
        </div>
      </div>
    </div>
  );
}
