<p align="center"><img src="assets/icons/icon-512.png" width="128" alt="Last Track icon"></p>

# Last Track  <small>v0.2.0</small>

**[▶ Play it now: alexander-uspenskiy.github.io/lastrack](https://alexander-uspenskiy.github.io/lastrack/)**

A browser vehicular-combat racer inspired by the 1990s *Deathtrack*: race rival drivers for money (and your life), buy armor, engine, tyres and weapons — machine guns, rockets, caltrops, mines, oil, flamethrowers and terminator missiles — across 10 tracks.

Neon Holo UI, live 3D showroom menus, PBR lighting and a vector HUD — all generated in code, no external assets or fonts.

Built with [three.js](https://threejs.org) (vendored, r170) and vanilla ES modules; no bundler.

## Screenshots

| | |
|---|---|
| ![Main menu](docs/images/menu.jpg) | ![Car select](docs/images/car-select.jpg) |
| ![Garage](docs/images/garage.jpg) | ![Track select](docs/images/track-select.jpg) |
| ![In-race HUD](docs/images/race-hud.jpg) | |

- **Play:** https://alexander-uspenskiy.github.io/lastrack/
- **Hero Slice** (photoreal, futuristic Hammer vs 4 enemy Hammers on the Neon Loop test track): https://alexander-uspenskiy.github.io/lastrack/?slice=1 (`&q=low|med|high` for quality)
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
