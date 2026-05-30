// Lightweight static background — replaced the previous five blurred animated
// orbs (filter: blur(120-180px) + mix-blend-screen) which forced constant
// full-viewport repaints and made the site sluggish. Pure CSS gradients,
// no animation, no filter — composited once.
export function AnimatedBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 bg-black"
      style={{
        backgroundImage: [
          "radial-gradient(ellipse 70% 50% at 18% 12%, rgba(124,58,237,0.45), transparent 65%)",
          "radial-gradient(ellipse 60% 45% at 85% 10%, rgba(79,70,229,0.40), transparent 65%)",
          "radial-gradient(ellipse 80% 60% at 50% 100%, rgba(30,27,75,0.55), transparent 70%)",
          "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%)",
        ].join(","),
      }}
    />
  );
}
