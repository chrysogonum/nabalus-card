import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { warmthAt } from "../warmth";

// Deterministic PRNG so motes are identical across parallel render workers.
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const MOTES = (() => {
  const rnd = mulberry32(20260624);
  return Array.from({ length: 30 }, () => ({
    x: rnd() * 100,
    size: 2 + rnd() * 5,
    speed: 0.12 + rnd() * 0.22, // % of height per second
    phase: rnd() * 1000,
    drift: (rnd() - 0.5) * 6,
    twPhase: rnd() * Math.PI * 2,
  }));
})();

export const Atmosphere: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const warmth = warmthAt(frame);

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {/* Ember — emerges only as the poem warms */}
      <AbsoluteFill
        style={{
          mixBlendMode: "screen",
          opacity: warmth * warmth * 0.85,
          background:
            "radial-gradient(72% 58% at 50% 46%, rgba(226,150,58,.55), rgba(226,150,58,0) 70%)",
        }}
      />
      {/* Cool ghost — present when cold */}
      <AbsoluteFill
        style={{
          mixBlendMode: "screen",
          opacity: (1 - warmth) * 0.1,
          background:
            "radial-gradient(80% 70% at 50% 50%, rgba(120,160,140,.4), rgba(120,160,140,0) 72%)",
        }}
      />
      {/* Drifting pollen motes */}
      {MOTES.map((m, i) => {
        const periodS = 100 / m.speed; // seconds to cross the screen
        const prog = (((t + m.phase) % periodS) / periodS); // 0..1 upward
        const yPct = 105 - prog * 120; // bottom -> above top
        const xPct = m.x + Math.sin((t + m.phase) * 0.4) * m.drift;
        const tw = 0.35 + 0.4 * (0.5 + 0.5 * Math.sin(t * 1.6 + m.twPhase));
        const edgeFade = Math.sin(prog * Math.PI); // fade in/out at ends
        const tint = warmth > 0.4 ? "233,201,138" : "150,180,160";
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${xPct}%`,
              top: `${yPct}%`,
              width: m.size,
              height: m.size,
              borderRadius: "50%",
              opacity: tw * edgeFade * (0.4 + warmth * 0.5),
              background: `radial-gradient(circle, rgba(${tint},.95), rgba(${tint},0) 70%)`,
            }}
          />
        );
      })}
      {/* Vignette to seat the verse */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(120% 90% at 50% 50%, rgba(0,0,0,0) 42%, rgba(0,0,0,.55) 100%)",
        }}
      />
      {/* Faint grain */}
      <AbsoluteFill
        style={{
          opacity: 0.05,
          mixBlendMode: "screen",
          backgroundImage:
            "radial-gradient(rgba(255,255,255,.6) .5px, transparent .6px)",
          backgroundSize: "3px 3px",
        }}
      />
    </AbsoluteFill>
  );
};
