"use client";

import { useEffect, useRef, type ReactNode } from "react";

// Content stays visible without JavaScript or when reduced motion is requested.
export function SectionReveal({ children }: { children: ReactNode }) {
  const element = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = element.current;
    if (
      !node ||
      !window.IntersectionObserver ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        node.classList.add("section-arrived");
        observer.disconnect();
      },
      { threshold: 0, rootMargin: "0px 0px -32px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={element} className="section-reveal">
      {children}
    </div>
  );
}
