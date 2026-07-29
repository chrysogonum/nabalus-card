// Assemble public/timeline.json from poem.json + per-stanza voiceover timing.
// If a stanza's timing JSON is missing, estimate from word count (≈150 wpm) so the
// composition can be developed before the final read exists.
import { readFile, writeFile, access } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";

const FPS = 30;
// Pacing (spacious / breathing), in frames:
const TITLE_HOLD = 240;       // 8.0s opening title on the bloom
const MV_TITLE_HOLD = 105;    // 3.5s movement numeral + title
const STANZA_LEAD = 14;       // ~0.5s breath before a stanza's audio
const STANZA_TRAIL = 33;      // ~1.1s after a stanza's audio
const MV_END_EXTRA = 48;      // +1.6s after a movement's final stanza
const CODA_LEAD = 30;
const CODA_HOLD = 200;        // ~6.7s coda
const OUTRO_DUR = 960;        // 32s wordless deep-time + exponential
const ENDCARD_DUR = 240;      // 8s closing card on the bloom
const XFADE = 30;             // movement backdrop crossfade length

const ROOT = process.cwd();
const VO = path.join(ROOT, "public/voiceover");

const exists = async (p) => { try { await access(p, constants.F_OK); return true; } catch { return false; } };
const wordCount = (s) => s.trim().split(/\s+/).filter(Boolean).length;

async function stanzaTiming(mvId, si, stanza) {
  const id = `${mvId}-s${si + 1}`;
  const jsonPath = path.join(VO, `${id}.json`);
  if (await exists(jsonPath)) {
    const data = JSON.parse(await readFile(jsonPath, "utf8"));
    return { id, real: true, duration: data.duration, lines: data.lines };
  }
  // Estimate: 150 wpm = 2.5 words/sec; minimum 1.1s per line.
  let acc = 0;
  const lines = stanza.lines.map((l) => {
    const secs = Math.max(1.1, wordCount(l.s || l.t) / 2.5);
    const start = acc; acc += secs; const end = acc;
    return { text: l.t, start, end };
  });
  return { id, real: false, duration: acc, lines };
}

const poem = JSON.parse(await readFile(path.join(ROOT, "src/poem.json"), "utf8"));

const segments = [];
let f = 0;
let anyEstimated = false;

// Opening title (on the bloom photo)
segments.push({ type: "title", startFrame: f, durFrames: TITLE_HOLD, warmth: 0.1 });
f += TITLE_HOLD;

for (const mv of poem.movements) {
  // Movement title card
  segments.push({
    type: "movement-title", mvId: mv.id, numeral: mv.numeral, title: mv.title,
    backdrop: mv.backdrop, warmth: mv.warmth, startFrame: f, durFrames: MV_TITLE_HOLD,
  });
  f += MV_TITLE_HOLD;

  for (let si = 0; si < mv.stanzas.length; si++) {
    const stanza = mv.stanzas[si];
    const t = await stanzaTiming(mv.id, si, stanza);
    if (!t.real) anyEstimated = true;
    const audioStart = f + STANZA_LEAD;
    const audioFrames = Math.round(t.duration * FPS);
    const isLast = si === mv.stanzas.length - 1;
    const durFrames = STANZA_LEAD + audioFrames + STANZA_TRAIL + (isLast ? MV_END_EXTRA : 0);
    const lines = t.lines.map((ln) => ({
      text: ln.text,
      startFrame: audioStart + Math.round(ln.start * FPS),
      endFrame: audioStart + Math.round(ln.end * FPS),
    }));
    segments.push({
      type: "stanza", mvId: mv.id, backdrop: mv.backdrop, warmth: mv.warmth,
      audio: t.real ? `voiceover/${t.id}.mp3` : null,
      audioStartFrame: audioStart, startFrame: f, durFrames, lines,
    });
    f += durFrames;
  }
}

// Coda
segments.push({
  type: "coda", lines: poem.coda, backdrop: "mv8-still-the-bowl", warmth: 0.12,
  startFrame: f, durFrames: CODA_LEAD + CODA_HOLD, leadFrames: CODA_LEAD,
});
f += CODA_LEAD + CODA_HOLD;

// Deep-time outro (wordless)
segments.push({ type: "outro", backdrop: "outro-deeptime", warmth: 0.1, startFrame: f, durFrames: OUTRO_DUR });
f += OUTRO_DUR;

// End card (on the bloom)
segments.push({ type: "endcard", startFrame: f, durFrames: ENDCARD_DUR, warmth: 0.12 });
f += ENDCARD_DUR;

const timeline = {
  fps: FPS,
  width: 1920,
  height: 1080,
  xfade: XFADE,
  totalFrames: f,
  estimated: anyEstimated,
  title: poem.title,
  eyebrow: poem.eyebrow,
  subtitle: poem.subtitle,
  segments,
};

await writeFile(path.join(ROOT, "src/timeline.json"), JSON.stringify(timeline, null, 2));
const mins = (f / FPS / 60);
console.log(`timeline.json: ${segments.length} segments, ${f} frames (${mins.toFixed(2)} min)${anyEstimated ? " [ESTIMATED durations]" : " [real audio]"}`);
