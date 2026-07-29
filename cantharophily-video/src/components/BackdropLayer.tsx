import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { timeline } from "../timeline";

// Map a segment to its full-bleed backdrop image key.
function backdropOf(segType: string, backdrop?: string): string {
  switch (segType) {
    case "title":
      return "title-dusk";
    case "movement-title":
    case "stanza":
      return backdrop || "title-dusk";
    case "coda":
      return "mv8-still-the-bowl";
    case "outro":
      return "outro-deeptime";
    case "endcard":
      return "title-dusk";
    default:
      return "title-dusk";
  }
}

// Build contiguous scenes that share a backdrop image.
type Scene = { img: string; start: number; end: number; idx: number };
const scenes: Scene[] = [];
for (const s of timeline.segments) {
  const img = backdropOf(s.type, s.backdrop);
  const segEnd = s.startFrame + s.durFrames;
  const last = scenes[scenes.length - 1];
  if (last && last.img === img) last.end = segEnd;
  else scenes.push({ img, start: s.startFrame, end: segEnd, idx: scenes.length });
}

const XFADE = timeline.xfade;

const SceneImg: React.FC<{ scene: Scene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const local = frame - scene.start;
  const span = scene.end - scene.start;

  // Crossfade: fade in over the first XFADE frames; the next scene (drawn on top)
  // covers this one as it fades in, so no explicit fade-out is needed.
  const opacity =
    scene.idx === 0
      ? interpolate(local, [0, XFADE * 1.5], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
      : interpolate(local, [0, XFADE], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Slow Ken Burns: gentle zoom + drift, direction alternates per scene.
  const dir = scene.idx % 2 === 0 ? 1 : -1;
  const scale = interpolate(local, [0, span], [1.06, 1.15], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const tx = interpolate(local, [0, span], [-2 * dir, 2 * dir], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const ty = interpolate(local, [0, span], [1.5 * dir, -1.5 * dir], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ opacity }}>
      <Img
        src={staticFile(`backdrops/${scene.img}.png`)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${scale}) translate(${tx}%, ${ty}%)`,
        }}
      />
    </AbsoluteFill>
  );
};

export const BackdropLayer: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: "#070b09" }}>
      {scenes.map((sc) =>
        // Only mount scenes that are near the current time (perf), with overlap for the crossfade.
        frame >= sc.start - 2 && frame <= sc.end + 2 ? <SceneImg key={sc.idx} scene={sc} /> : null,
      )}
    </AbsoluteFill>
  );
};
