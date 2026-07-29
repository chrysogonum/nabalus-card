import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { COLORS, MAX_TEXT_WIDTH } from "../theme";
import { cormorant } from "../fonts";

export const Coda: React.FC<{ lines: string[]; leadFrames: number; durFrames: number }> = ({
  lines,
  leadFrames,
  durFrames,
}) => {
  const frame = useCurrentFrame();
  const inP = interpolate(frame, [leadFrames, leadFrames + 40], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const out = interpolate(frame, [durFrames - 40, durFrames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: inP * out }}>
      <div
        style={{
          maxWidth: MAX_TEXT_WIDTH,
          textAlign: "center",
          fontFamily: cormorant,
          fontStyle: "italic",
          fontSize: 54,
          lineHeight: 1.4,
          color: COLORS.inkSoft,
          transform: `translateY(${(1 - inP) * 16}px)`,
          textShadow: "0 0 30px rgba(243,234,208,.14)",
        }}
      >
        {lines.map((l, i) => (
          <div key={i}>{l}</div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
