# Cantharophily — video production

A ~10:48 video of the poem *Cantharophily* (8 movements): George (ElevenLabs) narrating,
line-by-line synced verse, atmospheric backdrops graded along the poem's warmth arc
(cool → gold at the Movement III fever → cool), an ambient drone that swells at the fever,
and a wordless deep-time → Exponential outro. Opens and closes on the magnolia photo.

## Pipeline (run in order)

```bash
# 1. Backdrops (OpenRouter gemini image). Needs OPENROUTER_API_KEY. Already generated.
npm run backdrops

# 2. Voiceover — ElevenLabs with-timestamps, per stanza. Needs ELEVENLABS_API_KEY.
ELEVEN_VOICE_ID=JBFqnCBsd6RMkjVDRZzb npm run voiceover   # George

# 3. Ambient bed (ffmpeg drone + dusk).
npm run soundbed

# 4. Assemble the frame-accurate timeline from real audio.
node scripts/build-timeline.mjs

# 5. Captions.
npm run srt

# 6. Render.
npm run render            # -> out/cantharophily.mp4
npm run dev               # interactive preview (Remotion Studio)
```

## Key files
- `src/poem.json` — the poem (movements → stanzas → lines; `s` = spoken-pronunciation override).
- `src/timeline.json` — generated; drives the composition and its duration.
- `src/Composition.tsx` + `src/components/` — the Remotion video.
- `public/backdrops/` images, `public/voiceover/` audio+timing, `public/audio/` bed.
- Outputs in `out/`: `cantharophily.mp4` (master), `-web.mp4`, `-share.mp4`, `cantharophily.srt`.

## Notes
- To change pacing, edit the frame constants at the top of `scripts/build-timeline.mjs`, then
  rerun steps 4–6 (no need to regenerate audio).
- To change the voice, rerun step 2 with a different `ELEVEN_VOICE_ID`, then steps 4–6.
- OpenRouter image calls cap `max_tokens` (avoids 402 reserving a huge budget).
- The ElevenLabs key lacks `sound_generation`, so the dusk texture is an ffmpeg fallback.
