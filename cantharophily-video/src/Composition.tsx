import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { timeline, type Line, type Segment } from "./timeline";
import { BackdropLayer } from "./components/BackdropLayer";
import { Atmosphere } from "./components/Atmosphere";
import { TitleCard } from "./components/TitleCard";
import { MovementTitle } from "./components/MovementTitle";
import { Stanza } from "./components/Stanza";
import { Coda } from "./components/Coda";
import { DeepTimeOutro } from "./components/DeepTimeOutro";
import { EndCard } from "./components/EndCard";
import { SoundBed } from "./components/SoundBed";

const renderSegment = (seg: Segment) => {
  switch (seg.type) {
    case "title":
      return <TitleCard durFrames={seg.durFrames} />;
    case "movement-title":
      return <MovementTitle numeral={seg.numeral!} title={seg.title!} durFrames={seg.durFrames} />;
    case "stanza":
      return (
        <>
          <Stanza lines={seg.lines as Line[]} segStartFrame={seg.startFrame} durFrames={seg.durFrames} />
          {seg.audio ? (
            <Sequence from={(seg.audioStartFrame ?? seg.startFrame) - seg.startFrame} layout="none">
              <Audio src={staticFile(seg.audio)} />
            </Sequence>
          ) : null}
        </>
      );
    case "coda":
      return <Coda lines={seg.lines as string[]} leadFrames={seg.leadFrames ?? 0} durFrames={seg.durFrames} />;
    case "outro":
      return <DeepTimeOutro durFrames={seg.durFrames} />;
    case "endcard":
      return <EndCard durFrames={seg.durFrames} />;
    default:
      return null;
  }
};

export const Cantharophily: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#070b09" }}>
      <BackdropLayer />
      <Atmosphere />
      {timeline.segments.map((seg, i) => (
        <Sequence key={i} from={seg.startFrame} durationInFrames={seg.durFrames}>
          {renderSegment(seg)}
        </Sequence>
      ))}
      <SoundBed />
    </AbsoluteFill>
  );
};
