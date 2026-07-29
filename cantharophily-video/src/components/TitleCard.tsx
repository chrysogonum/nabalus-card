import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { COLORS } from "../theme";
import { cormorant } from "../fonts";
import { timeline } from "../timeline";

export const TitleCard: React.FC<{ durFrames: number }> = ({ durFrames }) => {
  const frame = useCurrentFrame();
  const photoIn = interpolate(frame, [0, 50], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const eyebrowIn = interpolate(frame, [40, 70], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const titleIn = interpolate(frame, [55, 95], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const subIn = interpolate(frame, [85, 120], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const out = interpolate(frame, [durFrames - 24, durFrames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const breathe = 0.9 + 0.1 * Math.sin(frame / 26);

  return (
    <AbsoluteFill style={{ opacity: out, alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
      <div style={{ position: "relative", width: 420, marginBottom: 40, opacity: photoIn, transform: `scale(${0.96 + photoIn * 0.04})` }}>
        <div
          style={{
            position: "absolute",
            inset: "-22% -26%",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(243,234,208,.42), rgba(243,234,208,0) 68%)",
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
            boxShadow: "0 40px 90px -30px rgba(0,0,0,.85), 0 0 70px -10px rgba(243,234,208,.2)",
            filter: "saturate(1.02) contrast(1.04) brightness(1.03)",
          }}
        />
      </div>
      <div
        style={{
          fontFamily: cormorant,
          textTransform: "uppercase",
          letterSpacing: "0.4em",
          fontSize: 22,
          color: COLORS.gold,
          opacity: eyebrowIn,
          paddingLeft: "0.4em",
          marginBottom: 18,
        }}
      >
        {timeline.eyebrow}
      </div>
      <div
        style={{
          fontFamily: cormorant,
          fontStyle: "italic",
          fontWeight: 300,
          fontSize: 132,
          lineHeight: 0.9,
          color: COLORS.glow,
          opacity: titleIn,
          transform: `translateY(${(1 - titleIn) * 16}px)`,
          textShadow: "0 0 48px rgba(243,234,208,.28)",
        }}
      >
        {timeline.title}
      </div>
      <div
        style={{
          fontFamily: cormorant,
          fontStyle: "italic",
          fontSize: 40,
          color: COLORS.inkSoft,
          opacity: subIn,
          marginTop: 22,
        }}
      >
        {timeline.subtitle}
      </div>
    </AbsoluteFill>
  );
};
