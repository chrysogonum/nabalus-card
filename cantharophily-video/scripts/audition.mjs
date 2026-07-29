// Audition a few ElevenLabs voices on the opening of Cantharophily.
// Usage: node scripts/audition.mjs
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const API_KEY = process.env.ELEVENLABS_API_KEY;
if (!API_KEY) {
  console.error("ELEVENLABS_API_KEY not set");
  process.exit(1);
}

const MODEL_ID = "eleven_multilingual_v2";

const SAMPLE =
  "It sits beside me in its glass of nothing, and it will not stop speaking. " +
  "But not to me. I lean in like a fool at a shrine, " +
  "and find the broadcast was never tuned to my receiver. " +
  "The scent is older than the noses worth the name.";

const VOICES = [
  { id: "JBFqnCBsd6RMkjVDRZzb", name: "george-warm-storyteller" },
  { id: "7S3KNdLDL7aRgBVRQb1z", name: "nathaniel-deep-mature" },
  { id: "pFZP5JQG7iQjIQuC4Bku", name: "lily-velvety-actress" },
];

const SETTINGS = {
  stability: 0.55,
  similarity_boost: 0.8,
  style: 0.15,
  use_speaker_boost: true,
};

const OUT = path.resolve(process.cwd(), "audition");

async function tts(voice) {
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voice.id}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": API_KEY,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text: SAMPLE,
        model_id: MODEL_ID,
        voice_settings: SETTINGS,
      }),
    },
  );
  if (!res.ok) {
    throw new Error(`${voice.name}: ${res.status} ${await res.text()}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  const file = path.join(OUT, `${voice.name}.mp3`);
  await writeFile(file, buf);
  console.log(`wrote ${file} (${(buf.length / 1024).toFixed(0)} KB)`);
}

await mkdir(OUT, { recursive: true });
for (const v of VOICES) {
  await tts(v);
}
console.log("done");
