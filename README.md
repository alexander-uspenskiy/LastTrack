# Last Track

A browser vehicular-combat racer inspired by the 1990s *Deathtrack*: race rival drivers for money (and your life), buy armor, engine, tyres and weapons — machine guns, rockets, caltrops, mines, oil, flamethrowers and terminator missiles — across 10 tracks.

Built with [three.js](https://threejs.org) (vendored, r170) and vanilla ES modules; no bundler.

- **Play:** https://alexanderuspenskiy.online/lastrack/
- **Hero Slice** (photoreal, futuristic Hammer vs 4 enemy Hammers on the Neon Loop test track): https://alexanderuspenskiy.online/lastrack/?slice=1 (`&q=low|med|high` for quality)
- **Trailer:** `trailer/out/last-track-trailer-web.mp4` (built with HyperFrames; the score is synthesized procedurally by `tools/music/`)

## Run locally
```bash
npm install
npm run serve   # http://localhost:8000
npm test
```

## Controls
WASD/arrows drive · Space fire · E/Tab cycle weapon · 1–9 select · Shift handbrake · C camera · P pause · M mute

## Layout
`src/core` `src/data` `src/sim` (pure, deterministic) · `src/render` `src/audio` · `src/ui` `src/game` — see `docs/ARCHITECTURE.md`.
`tools/playtest.mjs` runs headless AI races for balance.
