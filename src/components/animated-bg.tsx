export function AnimatedBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-black"
    >
      {/* Large purple orb — top-left */}
      <div
        className="absolute -left-[15%] -top-[15%] h-[60vw] w-[60vw] max-h-[900px] max-w-[900px] rounded-full opacity-70 mix-blend-screen animate-orb-a"
        style={{
          background:
            "radial-gradient(circle at 30% 30%, #7C3AED 0%, rgba(124,58,237,0.35) 40%, transparent 70%)",
          filter: "blur(140px)",
        }}
      />
      {/* Indigo orb — top-right */}
      <div
        className="absolute -right-[10%] -top-[10%] h-[55vw] w-[55vw] max-h-[800px] max-w-[800px] rounded-full opacity-70 mix-blend-screen animate-orb-b"
        style={{
          background:
            "radial-gradient(circle at 60% 40%, #4F46E5 0%, rgba(30,27,75,0.5) 45%, transparent 75%)",
          filter: "blur(160px)",
        }}
      />
      {/* Violet orb — center */}
      <div
        className="absolute left-1/2 top-1/2 h-[70vw] w-[70vw] max-h-[1100px] max-w-[1100px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-60 mix-blend-screen animate-orb-c"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, #A855F7 0%, rgba(168,85,247,0.25) 40%, transparent 70%)",
          filter: "blur(180px)",
        }}
      />
      {/* White glow accent — upper middle */}
      <div
        className="absolute left-1/2 top-[20%] h-[35vw] w-[35vw] max-h-[500px] max-w-[500px] -translate-x-1/2 rounded-full mix-blend-screen animate-orb-d"
        style={{
          background:
            "radial-gradient(circle, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.04) 40%, transparent 70%)",
          filter: "blur(120px)",
        }}
      />
      {/* Dark purple ambient — bottom */}
      <div
        className="absolute -bottom-[20%] left-1/2 h-[80vw] w-[110vw] max-h-[1000px] -translate-x-1/2 rounded-full opacity-80 mix-blend-screen animate-orb-e"
        style={{
          background:
            "radial-gradient(ellipse at 50% 50%, #1E1B4B 0%, rgba(79,70,229,0.3) 35%, transparent 70%)",
          filter: "blur(180px)",
        }}
      />
      {/* Subtle grain / vignette for depth */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.55) 100%)",
        }}
      />
    </div>
  );
}
