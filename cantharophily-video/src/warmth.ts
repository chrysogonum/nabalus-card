import { interpolate } from "remotion";
import { timeline } from "./timeline";

// Control points: each segment's midpoint carries its warmth value.
const pts = timeline.segments.map((s) => ({
  f: s.startFrame + s.durFrames / 2,
  w: s.warmth ?? 0.1,
}));
// Guarantee strictly increasing inputs for interpolate.
const inputs: number[] = [];
const values: number[] = [];
let last = -1;
for (const p of pts) {
  const f = p.f <= last ? last + 1 : p.f;
  inputs.push(f);
  values.push(p.w);
  last = f;
}

export function warmthAt(frame: number): number {
  return interpolate(frame, inputs, values, {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
}
