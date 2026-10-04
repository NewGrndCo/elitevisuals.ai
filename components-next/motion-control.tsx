"use client";
export function MotionControl({ children }: { children: React.ReactNode }) {
  return (
    <div className="visual-stage">
      <div aria-label="Featured prompts and creative skills">{children}</div>
    </div>
  );
}
