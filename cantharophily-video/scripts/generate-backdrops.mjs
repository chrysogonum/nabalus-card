// Generate atmospheric/textural backdrops for Cantharophily via OpenRouter.
// Model: google/gemini-3.1-flash-image-preview (chat/completions, image modality).
// Usage: node scripts/generate-backdrops.mjs [key ...]   (no args = all)
import { writeFile, mkdir, stat } from "node:fs/promises";
import path from "node:path";

const API_KEY = process.env.OPENROUTER_API_KEY;
if (!API_KEY) {
  console.error("OPENROUTER_API_KEY not set");
  process.exit(1);
}

const URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "google/gemini-3.1-flash-image-preview";
const OUT = path.resolve(process.cwd(), "public/backdrops");

// Shared style spine: keep the center dark and unbusy for text overlay.
const STYLE =
  "Cinematic abstract atmospheric backdrop, painterly and textural, extremely shallow depth of field, " +
  "soft defocused bokeh, fine film grain, drifting fog and floating motes of pollen-like light. " +
  "No people, no text, no watermark, no letters, no recognizable objects in sharp focus. " +
  "Composition keeps the central region deep and shadowed with generous dark negative space for overlaid text; " +
  "any light, detail, and color is pushed toward the edges and corners. Moody, contemplative, museum-quality, 16:9 widescreen.";

// Warmth arc mirrors the poem's data-temp: cool -> fever-gold at III -> cooling to dawn.
const SHOTS = [
  {
    key: "title-dusk",
    prompt:
      "Deep emerald-black botanical dusk: blurred dark magnolia foliage and night air, a single faint pale glow low in the frame like a lamp left on, " +
      "cool teal-green shadow (#0e1512), the faintest warm gold ember far off. Quiet, reverent, almost black.",
  },
  {
    key: "mv1-the-bowl",
    prompt:
      "A pale luminous glow suspended in near-darkness, like a magnolia bloom seen through fogged glass at night; cool sage-green and bone-white light, " +
      "glassy refractions at the edges, a vessel of water implied but not shown. Still, cold, expectant. Cool palette.",
  },
  {
    key: "mv2-before-the-bee",
    prompt:
      "A vast Cretaceous dusk sky as pure atmosphere: deep blue-green gradient, distant haze, the faint silhouette of a winged shape lost in cloud far at the top edge, " +
      "primeval and immense, deep-time melancholy. No dinosaurs in focus. Cool blue-green palette, abstract.",
  },
  {
    key: "mv3-the-fever",
    prompt:
      "Peak warmth: a glowing ember-gold chamber, heat shimmer and radiant amber light blooming from within darkness, molten honey and pollen-gold (#d8a44e), " +
      "a fever with no infection, sauna-warm haze. The warmest, most radiant frame. Rich gold and amber, edges glowing.",
  },
  {
    key: "mv4-the-chemistry",
    prompt:
      "Warm golden perfume made visible: drifting volatile vapor and suspended molecules of light, amber and soft gold motes braiding through dark air, " +
      "a sweet ghost of fragrance, faint green undertone. Warm but beginning to cool. Gold-amber with hints of green.",
  },
  {
    key: "mv5-continuance",
    prompt:
      "Intimate warm gold pollen dust drifting in a shaft of low light through darkness, the quiet mechanics of life continuing, soft and tender, " +
      "honeyed motes settling. Warm but softening toward neutral. Muted gold, intimate, low light.",
  },
  {
    key: "mv6-the-treadmill",
    prompt:
      "Melancholy cooling: a cold bluish screen-glow competing with a dying warm ember in the dark, two lights neither winning, faint repetitive ripples, " +
      "a loop with no rest. Cooling blue-grey with a last fading amber. Subdued, sorrowful.",
  },
  {
    key: "mv7-the-optimizer",
    prompt:
      "Cold machine intelligence as atmosphere: a faint constellation of cool blue-white nodes and threads of light dissolving into black, sterile and precise, " +
      "no dusk warmth, geometric glimmers at the edges. Coldest palette, blue-white on black, clinical and vast.",
  },
  {
    key: "mv8-still-the-bowl",
    prompt:
      "Dawn-cool calm returning: the faintest pale light easing into a dark screened-porch atmosphere, soft bone-white and cool sage, a single quiet pale glow, " +
      "peace after the fever, gentle and resolved. Pale, cool, calm, the lightest frame.",
  },
  {
    key: "outro-deeptime",
    prompt:
      "Deep time as cosmic dark: an almost-black field with a single faint thread of gold light receding into immense distance, scattered dim motes like dust of eons, " +
      "vast, silent, geological. Near-black with one fragile gold line. Minimal, infinite.",
  },
];

const headers = {
  Authorization: `Bearer ${API_KEY}`,
  "Content-Type": "application/json",
  "HTTP-Referer": "https://nabalus.card",
  "X-Title": "Cantharophily",
};

function extractImage(json) {
  const choice = json?.choices?.[0];
  const msg = choice?.message;
  if (!msg) return null;
  // Format 1: message.images[].image_url.url
  if (Array.isArray(msg.images) && msg.images[0]?.image_url?.url) {
    return msg.images[0].image_url.url;
  }
  // Format 2: content array of parts
  if (Array.isArray(msg.content)) {
    for (const part of msg.content) {
      if (part?.type === "image_url" && part.image_url?.url) return part.image_url.url;
      if (part?.image_url?.url) return part.image_url.url;
    }
  }
  return null;
}

async function generate(shot) {
  const outPath = path.join(OUT, `${shot.key}.png`);
  const payload = {
    model: MODEL,
    messages: [{ role: "user", content: `${shot.prompt}\n\n${STYLE}` }],
    modalities: ["image", "text"],
    max_tokens: 4096,
  };
  let lastErr;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(URL, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });
      const text = await res.text();
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0, 400)}`);
      const json = JSON.parse(text);
      const url = extractImage(json);
      if (!url) throw new Error(`no image in response: ${text.slice(0, 400)}`);
      const b64 = url.startsWith("data:") ? url.split(",", 2)[1] : url;
      const bytes = Buffer.from(b64, "base64");
      await writeFile(outPath, bytes);
      console.log(`✓ ${shot.key} (${(bytes.length / 1024).toFixed(0)} KB)`);
      return;
    } catch (e) {
      lastErr = e;
      console.warn(`  ${shot.key} attempt ${attempt} failed: ${e.message}`);
      await new Promise((r) => setTimeout(r, attempt * 2500));
    }
  }
  console.error(`✗ ${shot.key} FAILED: ${lastErr?.message}`);
}

await mkdir(OUT, { recursive: true });
const only = process.argv.slice(2);
const todo = only.length ? SHOTS.filter((s) => only.includes(s.key)) : SHOTS;
console.log(`generating ${todo.length} backdrops with ${MODEL}`);
for (const shot of todo) {
  await generate(shot);
}
console.log("done");
