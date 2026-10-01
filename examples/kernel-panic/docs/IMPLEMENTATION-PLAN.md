# Implementation plan

The goal is v3 made real: same composition, timings and easing (`cubic-bezier(.22,1,.36,1)`, 1000 ms world moves), rebuilt as a
maintainable, deterministic app. Content restorations come from `CONTENT-AUDIT.md`.

## 1. Rendering model

Three layers inside one fixed 1920×1080 stage, scaled with `transform: scale()` and black letterbox:

1. **Canvas 2D** (`simulation/ParticleCanvas.tsx`): a single rAF loop draws the dot field, the local/self-hosted simulation,
   drift, burn tokens and architecture packets. Particle arrays live in a module-level `SimulationStore`, so they survive scene
   changes (03 → 04 drift → burn; 05 → 06 → panic). The cap is 900 tokens. The loop draws nothing on absolute black.
2. **Architecture world** (`architecture/`): `getArchitectureState(scene, beat, live)` is a pure function returning
   `{ nodes, edges, boundaries, routes }` keyed by stable IDs. `ArchitectureWorld` renders every known node, edge and boundary
   once and tweens them with GSAP (x/y as transforms, width/height/font-size on the box) toward the target of the current beat.
   A per-frame geometry cache (`worldGeometry`) holds each node's *animated* rect: SVG edges and canvas packet routes are rebuilt
   from it, so wires and packets follow nodes while they travel.
3. **Scene layers** (`deck/scenes/0x-*`): DOM typography per scene. Every style is a pure function of `(scene, beat, live)`, with
   CSS transitions copied from v3. This is what makes any beat reconstructable: render the state and let the transitions run
   (or skip them on first paint).

## 2. State

- `engine/DeckEngine.ts`: a tiny store (`subscribe / getState / go / next / prev`). State = `{ scene, beat }` plus `live`, the
  automatic sub-state of the current beat (`bootN`, `typed`, `users`, `warnN`, `tokens`, `panic`, `black`, `burned`).
- `deck/scenes.ts`: beat table (names, source-slide refs, presenter notes, `auto` flag).
- `engine/timeline.ts`: entering a beat resets `live` to that beat's initial live, kills the previous beat's GSAP timeline and
  starts the new one. Auto beats: 01.2 boot (→ 01.3), 01.3 wordmark (→ 01.4), 06.1 users, 06.5 warnings, 06.6 panic,
  08.5 counter (+ This is Fine). Nothing else runs on its own.
- `engine/persistence.ts`: position ↔ `location.hash` (`#5.4`, 1-based) and `localStorage`. Boot restores from the hash first,
  then storage.
- `?capture=1` freezes auto-advance and cursor blink so every beat can be screenshotted.

## 3. Input and operator tools

- `engine/navigation.ts`: key map (→ PageDown Space-in-fullscreen / ← PageUp / 1–8 / Home / End / F / O / P / B blackout /
  Esc). All handled keys call `preventDefault`, and the page has no scroll. A click on the stage advances.
- `engine/fullscreen.ts`: Fullscreen API on `documentElement`. The cursor hides after 2 s idle.
- `engine/presenter.ts`: BroadcastChannel `kp-live`. The stage publishes the state; the presenter window sends commands
  (`next / prev / go`) and asks for a resync on load. The timer start is stored in localStorage, so it survives a refresh.
- Overview (O): an operator overlay with the 8 scenes and their beats. Click to jump; O/Esc closes without changing state.
- Debug (`?debug=1` only): scene/beat, FPS, particle count, live, architecture JSON, panic, finale, grid toggle,
  reduced-motion toggle.

## 4. Scenes (v3 values ported; restorations marked ★)

- 01 boot: typed log, `sudo rm -rf /boring_talks`, glitch, per-letter KERNEL PANIC! wordmark with the event meta and sticker,
  title. ✓/✕/cursor drawn as CSS/SVG (the local Roboto subsets lack those glyphs).
- 02 origin: statement → 3D tweet ★ (badge, 🐧, X action icons) → strip UI → isolate → zoom on "con Ollama en 2 minutos".
- 03 local: canvas capacity simulation; labels with ≠ as SVG; localhost-enjoyer sticker; ★ real logos for vLLM/SGLang and
  LiteLLM/Bifrost.
- 04 burn: three questions, void, BURN TOKENS. with tokens into the GPU node, MODEL SELECTED + Qwencito sticker + ★ Qwen release.
- 05 architecture: ★ product photo inside the GPU node at 05.1, then vLLM, LiteLLM, Nginx, users, requests.
- 06 scale: users 25→100, server_02, reyes magos, server_03 + ★ routing table, warnings ★ (Spanish emphasised, exact wording),
  panic 520 ms → black.
- 07 rebuild: reboot_, CLOUDFLARE + KUBERNETES ★ with real marks → layer boundaries → services → live traffic ★
  (implied relations dashed, "// parte de la arquitectura actual").
- 08 finale: metrics, 50B counter, ★ This is Fine punchline, still scaling._, Q&A ★ (X/LinkedIn marks, QR from config).

## 5. Build and offline

- Fonts from `reference/design-v3/fonts` → `src/assets/fonts`, `@font-face` with `font-display: block` + `<link rel=preload>`.
- QR: a Vite plugin (`scripts/qr-plugin.ts`) reads `speakerQrUrl` from `src/deck/deck.config.ts` at build time and exposes the SVG
  through `virtual:speaker-qr` using the `qrcode` package. No runtime generation, no network.
- `npm run build` → `dist/` with relative asset paths (`base: './'`), so it also works from any static server.
  `npm run present` = build + `vite preview` on `127.0.0.1:4173` with `--open`.
- `scripts/check-offline.mjs` scans `dist/` for `http(s)://` references to remote hosts.

## 6. Verification

- `scripts/screenshots.mjs` (Playwright, installed Chrome channel): opens every beat at 1920×1080 with `?capture=1#s.b`, waits
  for it to settle, and writes `artifacts/screenshots/SS-BB.png`. It also records console errors and network requests to non-local
  hosts.
- Manual pass over every screenshot (clipping, overlaps, font loading, QR, safe area).
- `scripts/perf.mjs`: rAF frame timings in the heavy beats (03.5, 04.5, 06.1, 06.5, 07.5, 08.5).
