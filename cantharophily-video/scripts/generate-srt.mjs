// Emit out/cantharophily.srt from src/timeline.json — one cue per spoken line,
// using the real per-line frame times.
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const timeline = JSON.parse(await readFile(path.join(ROOT, "src/timeline.json"), "utf8"));
const FPS = timeline.fps;

const stamp = (frame) => {
  const ms = Math.max(0, Math.round((frame / FPS) * 1000));
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const z = ms % 1000;
  const p = (n, w = 2) => String(n).padStart(w, "0");
  return `${p(h)}:${p(m)}:${p(s)},${p(z, 3)}`;
};

const cues = [];
for (const seg of timeline.segments) {
  if (seg.type === "stanza" && Array.isArray(seg.lines)) {
    for (const ln of seg.lines) {
      if (typeof ln === "object" && ln.text) {
        cues.push({ start: ln.startFrame, end: ln.endFrame, text: ln.text });
      }
    }
  } else if (seg.type === "coda" && Array.isArray(seg.lines)) {
    const lead = seg.leadFrames ?? 0;
    const per = (seg.durFrames - lead) / seg.lines.length;
    seg.lines.forEach((text, i) => {
      cues.push({
        start: seg.startFrame + lead + Math.round(i * per),
        end: seg.startFrame + lead + Math.round((i + 1) * per),
        text,
      });
    });
  }
}

// Ensure each cue has a minimum visible duration and no overlap.
const MINF = Math.round(0.8 * FPS);
for (let i = 0; i < cues.length; i++) {
  if (cues[i].end - cues[i].start < MINF) cues[i].end = cues[i].start + MINF;
  if (i + 1 < cues.length && cues[i].end > cues[i + 1].start) cues[i].end = cues[i + 1].start - 1;
}

const srt = cues
  .map((c, i) => `${i + 1}\n${stamp(c.start)} --> ${stamp(c.end)}\n${c.text}\n`)
  .join("\n");

await mkdir(path.join(ROOT, "out"), { recursive: true });
await writeFile(path.join(ROOT, "out/cantharophily.srt"), srt);
console.log(`wrote out/cantharophily.srt (${cues.length} cues)`);
