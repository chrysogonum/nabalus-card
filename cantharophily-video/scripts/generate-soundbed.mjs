// Build the ambient bed: public/audio/drone.mp3 (synth pad) + public/audio/dusk.mp3
// (ElevenLabs night ambience, ffmpeg-noise fallback).
import { writeFile, mkdir } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";

const pexec = promisify(execFile);
const ROOT = process.cwd();
const AUDIO = path.join(ROOT, "public/audio");
await mkdir(AUDIO, { recursive: true });

// ---- 1) Warm evolving drone (C minor-ish pad), 32s, loopable ----
const drone = path.join(AUDIO, "drone.mp3");
const dronArgs = [
  "-y",
  "-f", "lavfi", "-i", "sine=frequency=65.41:duration=32",
  "-f", "lavfi", "-i", "sine=frequency=98.00:duration=32",
  "-f", "lavfi", "-i", "sine=frequency=130.81:duration=32",
  "-f", "lavfi", "-i", "sine=frequency=155.56:duration=32",
  "-f", "lavfi", "-i", "sine=frequency=196.00:duration=32",
  "-filter_complex",
  "[0][1][2][3][4]amix=inputs=5:normalize=1,tremolo=f=0.10:d=0.45,vibrato=f=0.10:d=0.3,lowpass=f=520,aecho=0.8:0.7:55|110:0.4|0.25,volume=2.2",
  "-ac", "2", "-ar", "44100",
  drone,
];
console.log("drone …");
await pexec("ffmpeg", dronArgs);
console.log("✓ drone.mp3");

// ---- 2) Dusk ambience via ElevenLabs sound-generation ----
const dusk = path.join(AUDIO, "dusk.mp3");
const KEY = process.env.ELEVENLABS_API_KEY;
let duskOk = false;
if (KEY) {
  try {
    console.log("dusk (ElevenLabs) …");
    const res = await fetch("https://api.elevenlabs.io/v1/sound-generation", {
      method: "POST",
      headers: { "xi-api-key": KEY, "Content-Type": "application/json", Accept: "audio/mpeg" },
      body: JSON.stringify({
        text: "Gentle warm summer night on a screened porch: soft continuous night air, faint distant crickets and katydids, no music, no voices, calm ambient field recording",
        duration_seconds: 22,
        prompt_influence: 0.3,
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const buf = Buffer.from(await res.arrayBuffer());
    await writeFile(dusk, buf);
    console.log(`✓ dusk.mp3 (${(buf.length / 1024).toFixed(0)} KB)`);
    duskOk = true;
  } catch (e) {
    console.warn(`  ElevenLabs dusk failed: ${e.message}; using ffmpeg fallback`);
  }
}
if (!duskOk) {
  // Fallback: filtered noise suggesting warm night air.
  await pexec("ffmpeg", [
    "-y",
    "-f", "lavfi", "-i", "anoisesrc=color=brown:duration=22:amplitude=0.5",
    "-filter_complex", "lowpass=f=1800,highpass=f=200,tremolo=f=0.3:d=0.2,volume=0.8",
    "-ac", "2", "-ar", "44100",
    dusk,
  ]);
  console.log("✓ dusk.mp3 (ffmpeg fallback)");
}
console.log("soundbed done");
