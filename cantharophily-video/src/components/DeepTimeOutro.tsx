import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "../theme";
import { cormorant, ebGaramond } from "../fonts";

type Item =
  | { kind: "epoch"; when: string; what: string; key?: boolean; now?: boolean }
  | { kind: "divider"; label: string };

const ITEMS: Item[] = [
  { kind: "divider", label: "The order of deep time" },
  { kind: "epoch", when: "~1,000 Ma", what: "First green algae" },
  { kind: "epoch", when: "~390 Ma", what: "First ferns" },
  { kind: "epoch", when: "~310 Ma", what: "First conifers" },
  { kind: "epoch", when: "~300 Ma", what: "First beetles", key: true },
  { kind: "epoch", when: "252 Ma", what: "The end-Permian extinction" },
  { kind: "epoch", when: "~230 Ma", what: "First dinosaurs" },
  { kind: "epoch", when: "~130 Ma", what: "First flowering plants", key: true },
  { kind: "epoch", when: "~100 Ma", what: "The magnolia’s bowl", key: true },
  { kind: "epoch", when: "66 Ma", what: "The K–Pg extinction" },
  { kind: "epoch", when: "0.3 Ma", what: "Homo sapiens" },
  { kind: "epoch", when: "now", what: "A magnolia in a jar of tap water", now: true },
  { kind: "divider", label: "— the last dot, unfolded —" },
  { kind: "epoch", when: "1928", what: "Manufacturing desire" },
  { kind: "epoch", when: "1958", what: "The perceptron" },
  { kind: "epoch", when: "1969", what: "ARPANET" },
  { kind: "epoch", when: "1995", what: "The Web" },
  { kind: "epoch", when: "2007", what: "The smartphone" },
  { kind: "epoch", when: "2017", what: "“Attention Is All You Need”", key: true },
  { kind: "epoch", when: "2022", what: "The feed that models you" },
  { kind: "epoch", when: "2026", what: "now — you are here", now: true },
  { kind: "epoch", when: "soon", what: "It predicts the lean-toward" },
  { kind: "epoch", when: "?", what: "the bowl with no dawn" },
];

const GAP = 165;
const CENTER = 540; // viewport vertical center (1080/2)

export const DeepTimeOutro: React.FC<{ durFrames: number }> = ({ durFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fadeIn = interpolate(frame, [0, 36], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const fadeOut = interpolate(frame, [durFrames - 40, durFrames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const totalScroll = (ITEMS.length - 1) * GAP;
  // Eased scroll: unhurried through deep time, accelerating toward the present.
  const scrollY = interpolate(
    Easing.in(Easing.quad)(frame / durFrames),
    [0, 1],
    [-GAP * 0.5, totalScroll - GAP * 1.5],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <AbsoluteFill style={{ opacity: fadeIn * fadeOut }}>
      {/* the spine */}
      <div
        style={{
          position: "absolute",
          left: 720,
          top: 0,
          bottom: 0,
          width: 2,
          background:
            "linear-gradient(180deg, rgba(216,164,78,0) 0%, rgba(216,164,78,.5) 18%, rgba(233,201,138,.7) 50%, rgba(216,164,78,.5) 82%, rgba(216,164,78,0) 100%)",
        }}
      />
      {ITEMS.map((it, i) => {
        const y = CENTER + (i * GAP - scrollY);
        const dist = Math.abs(y - CENTER);
        const near = interpolate(dist, [0, 360, 620], [1, 0.5, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        if (near <= 0.001) return null;
        const focus = interpolate(dist, [0, 220], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

        if (it.kind === "divider") {
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                top: y,
                left: 0,
                right: 0,
                transform: "translateY(-50%)",
                textAlign: "center",
                opacity: near,
                fontFamily: cormorant,
                fontStyle: "italic",
                letterSpacing: "0.24em",
                textTransform: "uppercase",
                fontSize: 26,
                color: COLORS.gold,
              }}
            >
              {it.label}
            </div>
          );
        }

        const whenColor = it.now ? COLORS.glow : COLORS.gold;
        const whatColor = it.now ? COLORS.glow : it.key ? COLORS.goldSoft : COLORS.ink;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              top: y,
              left: 760,
              transform: "translateY(-50%)",
              opacity: near,
              display: "flex",
              alignItems: "baseline",
              gap: 24,
            }}
          >
            <div style={{ width: 150, textAlign: "right", marginLeft: -190 }}>
              <span
                style={{
                  fontFamily: cormorant,
                  fontStyle: it.now ? "normal" : "italic",
                  fontSize: 28,
                  letterSpacing: it.now ? "0.16em" : "0.02em",
                  textTransform: it.now ? "uppercase" : "none",
                  color: whenColor,
                }}
              >
                {it.when}
              </span>
            </div>
            <div
              style={{
                width: 16,
                height: 16,
                marginLeft: 12,
                marginRight: 12,
                borderRadius: "50%",
                border: `2px solid ${it.now ? COLORS.glow : COLORS.gold}`,
                background: it.key || it.now ? COLORS.gold : COLORS.night2,
                boxShadow: it.now ? "0 0 14px rgba(243,234,208,.6)" : `0 0 ${10 * focus}px rgba(216,164,78,.5)`,
                alignSelf: "center",
              }}
            />
            <div
              style={{
                fontFamily: ebGaramond,
                fontSize: 34,
                color: whatColor,
                textShadow: "0 2px 16px rgba(0,0,0,.7)",
                maxWidth: 560,
              }}
            >
              {it.what}
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
