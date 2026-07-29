// Generate per-stanza voiceover for Cantharophily using ElevenLabs with-timestamps,
// so each on-screen line can be revealed exactly when it is spoken.
//
// Usage:
//   ELEVEN_VOICE_ID=<id> node scripts/generate-voiceover.mjs [mvId ...]
// Writes:
//   public/voiceover/<mvId>-s<n>.mp3
//   public/voiceover/<mvId>-s<n>.json   { duration, lines:[{text,start,end}] }
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const API_KEY = process.env.ELEVENLABS_API_KEY;
if (!API_KEY) { console.error("ELEVENLABS_API_KEY not set"); process.exit(1); }

// Default to George (warm, captivating storyteller). Override with ELEVEN_VOICE_ID.
const VOICE_ID = process.env.ELEVEN_VOICE_ID || "JBFqnCBsd6RMkjVDRZzb";
const MODEL_ID = process.env.ELEVEN_MODEL_ID || "eleven_multilingual_v2";
const OUTPUT_FORMAT = "mp3_44100_128";
const SETTINGS = {
  stability: 0.5,
  similarity_boost: 0.8,
  style: 0.18,
  use_speaker_boost: true,
};

const ROOT = process.cwd();
const VO = path.join(ROOT, "public/voiceover");

const spoken = (line) => (line.s || line.t);

// Map each line to its [start,end] seconds inside the stanza audio using the
// character-level alignment. Robust fallback: proportional by character count.
function lineTimings(spokenLines, alignment, duration) {
  const chars = alignment?.characters || [];
  const starts = alignment?.character_start_times_seconds || [];
  const ends = alignment?.character_end_times_seconds || [];
  const alignStr = chars.join("");
  const out = [];
  let cursor = 0;
  let ok = chars.length > 0 && starts.length === chars.length && ends.length === chars.length;
  if (ok) {
    for (const sl of spokenLines) {
      const trimmed = sl.trim();
      const idx = trimmed.length ? alignStr.indexOf(trimmed, cursor) : -1;
      if (idx < 0) { ok = false; break; }
      const startIdx = idx;
      const endIdx = idx + trimmed.length - 1;
      out.push({ start: starts[startIdx], end: ends[endIdx] });
      cursor = endIdx + 1;
    }
  }
  if (ok && out.length === spokenLines.length) return out;
  // Fallback: distribute by cumulative character length.
  const lens = spokenLines.map((s) => Math.max(1, s.trim().length));
  const total = lens.reduce((a, b) => a + b, 0);
  let acc = 0;
  return spokenLines.map((s, i) => {
    const start = (acc / total) * duration;
    acc += lens[i];
    const end = (acc / total) * duration;
    return { start, end };
  });
}

async function tts(text) {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}/with-timestamps?output_format=${OUTPUT_FORMAT}`;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "xi-api-key": API_KEY, "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ text, model_id: MODEL_ID, voice_settings: SETTINGS }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
      return await res.json();
    } catch (e) {
      if (attempt === 3) throw e;
      console.warn(`   retry ${attempt}: ${e.message}`);
      await new Promise((r) => setTimeout(r, attempt * 2000));
    }
  }
}

const poem = JSON.parse(await readFile(path.join(ROOT, "src/poem.json"), "utf8"));
await mkdir(VO, { recursive: true });

const only = process.argv.slice(2);
const movements = only.length ? poem.movements.filter((m) => only.includes(m.id)) : poem.movements;

console.log(`voice=${VOICE_ID} model=${MODEL_ID}`);
for (const mv of movements) {
  for (let si = 0; si < mv.stanzas.length; si++) {
    const stanza = mv.stanzas[si];
    const id = `${mv.id}-s${si + 1}`;
    const spokenLines = stanza.lines.map(spoken);
    const text = spokenLines.join("\n");
    process.stdout.write(`${id} … `);
    const json = await tts(text);
    const audio = Buffer.from(json.audio_base64, "base64");
    await writeFile(path.join(VO, `${id}.mp3`), audio);
    const align = json.alignment || json.normalized_alignment;
    const ends = align?.character_end_times_seconds || [];
    const duration = ends.length ? ends[ends.length - 1] : 0;
    const times = lineTimings(spokenLines, align, duration);
    const lines = stanza.lines.map((l, i) => ({ text: l.t, start: times[i].start, end: times[i].end }));
    await writeFile(
      path.join(VO, `${id}.json`),
      JSON.stringify({ id, duration, lines }, null, 2),
    );
    console.log(`${duration.toFixed(1)}s, ${lines.length} lines`);
  }
}
console.log("voiceover done");
