import { Audio, staticFile } from "remotion";
import { warmthAt } from "../warmth";
import { timeline } from "../timeline";

// Ambient bed: a warm drone that swells with the poem's warmth (peaking at the
// Movement III fever) plus a steady dusk texture. Both loop across the whole piece.
export const SoundBed: React.FC = () => {
  const total = timeline.totalFrames;
  const fade = 60;

  const droneVol = (f: number) => {
    const edge =
      Math.min(1, f / fade) * Math.min(1, (total - f) / fade); // fade in/out at the ends
    return Math.max(0, edge * (0.07 + warmthAt(f) * 0.14));
  };
  const duskVol = (f: number) => {
    const edge = Math.min(1, f / fade) * Math.min(1, (total - f) / fade);
    return Math.max(0, edge * 0.05);
  };

  return (
    <>
      <Audio src={staticFile("audio/drone.mp3")} loop volume={droneVol} />
      <Audio src={staticFile("audio/dusk.mp3")} loop volume={duskVol} />
    </>
  );
};
