"use client";
import { useRef, useState } from "react";
export function MotionControl({ children }: { children: React.ReactNode }) {
  const [paused, setPaused] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  return (
    <div ref={container} className="visual-stage" data-paused={paused}>
      <div aria-label="Featured visual prompts">{children}</div>
      <button className="motion-toggle" aria-pressed={paused} onClick={() => setPaused((v) => !v)}>
        {paused ? "Resume motion" : "Pause motion"}
      </button>
    </div>
  );
}
