import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { COLORS } from "../theme";
import { cormorant } from "../fonts";

export const MovementTitle: React.FC<{ numeral: string; title: string; durFrames: number }> = ({
  numeral,
  title,
  durFrames,
}) => {
  const frame = useCurrentFrame();
  const inP = interpolate(frame, [0, 28], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const out = interpolate(frame, [durFrames - 22, durFrames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const rise = (1 - inP) * 14;

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "column", opacity: inP * out }}>
      <div
        style={{
          fontFamily: cormorant,
          fontStyle: "italic",
          color: COLORS.gold,
          fontSize: 34,
          letterSpacing: "0.3em",
          transform: `translateY(${rise}px)`,
        }}
      >
        {numeral}
      </div>
      <div
        style={{
          fontFamily: cormorant,
          fontStyle: "italic",
          fontWeight: 300,
          color: COLORS.glow,
          fontSize: 70,
          lineHeight: 1.1,
          textAlign: "center",
          maxWidth: 1300,
          marginTop: 10,
          transform: `translateY(${rise}px)`,
          textShadow: "0 0 34px rgba(243,234,208,.16)",
        }}
      >
        {title}
      </div>
    </AbsoluteFill>
  );
};
