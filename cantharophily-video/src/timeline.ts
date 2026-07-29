import data from "./timeline.json";

export type Line = { text: string; startFrame: number; endFrame: number };

export type Segment = {
  type: "title" | "movement-title" | "stanza" | "coda" | "outro" | "endcard";
  startFrame: number;
  durFrames: number;
  warmth?: number;
  mvId?: string;
  numeral?: string;
  title?: string;
  backdrop?: string;
  audio?: string | null;
  audioStartFrame?: number;
  lines?: Line[] | string[];
  leadFrames?: number;
};

export type Timeline = {
  fps: number;
  width: number;
  height: number;
  xfade: number;
  totalFrames: number;
  estimated: boolean;
  title: string;
  eyebrow: string;
  subtitle: string;
  segments: Segment[];
};

export const timeline = data as Timeline;
