import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { COLORS, MAX_TEXT_WIDTH } from "../theme";
import { ebGaramond } from "../fonts";
import type { Line } from "../timeline";

const REVEAL = 30; // frames for a line to ease in

export const Stanza: React.FC<{ lines: Line[]; segStartFrame: number; durFrames: number }> = ({
  lines,
  segStartFrame,
  durFrames,
}) => {
  const frame = useCurrentFrame();
  const out = interpolate(frame, [durFrames - 16, durFrames], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: out }}>
      <div
        style={{
          maxWidth: MAX_TEXT_WIDTH,
          padding: "0 80px",
          textAlign: "center",
          fontFamily: ebGaramond,
          fontSize: 41,
          lineHeight: 1.62,
          color: COLORS.inkSoft,
          textShadow: "0 2px 18px rgba(0,0,0,.75)",
        }}
      >
        {lines.map((ln, i) => {
          const rel = ln.startFrame - segStartFrame;
          const p = interpolate(frame, [rel, rel + REVEAL], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          return (
            <div
              key={i}
              style={{
                opacity: p,
                transform: `translateY(${(1 - p) * 18}px)`,
                filter: `blur(${(1 - p) * 3}px)`,
                marginBottom: "0.18em",
              }}
            >
              {ln.text}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
