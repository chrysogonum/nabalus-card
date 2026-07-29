import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { COLORS } from "../theme";
import { cormorant } from "../fonts";
import { timeline } from "../timeline";

export const EndCard: React.FC<{ durFrames: number }> = ({ durFrames }) => {
  const frame = useCurrentFrame();
  const photoIn = interpolate(frame, [10, 55], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const titleIn = interpolate(frame, [40, 80], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const crIn = interpolate(frame, [70, 110], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const toBlack = interpolate(frame, [durFrames - 50, durFrames], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const breathe = 0.9 + 0.1 * Math.sin(frame / 26);

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
      <div style={{ position: "relative", width: 300, marginBottom: 34, opacity: photoIn }}>
        <div
          style={{
            position: "absolute",
            inset: "-20% -24%",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(243,234,208,.36), rgba(243,234,208,0) 68%)",
            filter: "blur(8px)",
            opacity: breathe,
          }}
        />
        <Img
          src={staticFile("bloom-web.jpg")}
          style={{
            width: "100%",
            borderRadius: 4,
            display: "block",
            boxShadow: "0 30px 70px -30px rgba(0,0,0,.85), 0 0 60px -10px rgba(243,234,208,.18)",
          }}
        />
      </div>
      <div
        style={{
          fontFamily: cormorant,
          fontStyle: "italic",
          fontWeight: 300,
          fontSize: 64,
          color: COLORS.glow,
          opacity: titleIn,
          textShadow: "0 0 36px rgba(243,234,208,.22)",
        }}
      >
        {timeline.title}
      </div>
      <div
        style={{
          fontFamily: cormorant,
          textTransform: "uppercase",
          letterSpacing: "0.22em",
          fontSize: 18,
          color: COLORS.inkFaint,
          opacity: crIn,
          marginTop: 22,
        }}
      >
        © 2026 chrysogonum · All rights reserved
      </div>
      <AbsoluteFill style={{ backgroundColor: "#000", opacity: toBlack, pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};
