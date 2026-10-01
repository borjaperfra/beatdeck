# Verification checklist

Run before saying a deck (or a change to it) is done.

## Automated — `npm run verify`

- [ ] `npm run build` passes: typecheck, bundle, offline check (no remote URL in `dist/`).
- [ ] `npm run verify` exits 0. It checks, so you don't have to by hand:
      every beat reached forwards (PageDown), backwards (PageUp, following `prev`) and straight from `#s.b`
      renders the same frame (pixel diff ≤ `--diff`, default 0.1%) · positions match · no console error or
      warning · no request to a non-local host · `?reduced=1` applies · the QR on stage decodes to `qrUrl`
      · the presenter connects and drives the stage · the overview opens · no visible text outside the stage or
      overlapping other text · no µ/ß broken by uppercase.
- [ ] With a written source: `npm run verify -- --source=<script>` — Terminal lines and `data-exact` text appear
      verbatim in it.
- [ ] Random or time-driven layers (particles, clocks) legitimately differ: give those beats a `tolerance` in
      `scenes.ts` (or raise `--diff` for the whole deck) and say why — never to hide a real mismatch. Beats reported as "still animating" need a look.

## Look at the frames

Open `artifacts/verify/contact.png`, then the full-size `walk-SS-BB.png` that matter.

- [ ] No clipped text or awkward collisions the audit cannot see (text over images, lines through labels);
      read the "warnings" list (small text).
- [ ] Auto beats are captured settled, and their start state is sane when entered directly.
- [ ] Each beat shows one idea; the reveal order matches the talk.
- [ ] Standby (1.1) is calm and the first click starts the talk.
- [ ] Terminal text matches the source character for character (keep it in one module, never retyped).

## Content

- [ ] Every source slide is accounted for in `docs/CONTENT-AUDIT.md` (kept / restored / cut + why).
- [ ] No invented quotes, numbers, tweet text, logos or URLs.
- [ ] Real artefacts used where the source had them.
- [ ] Speaker notes (`note`) on beats with automatic motion or tricky timing.

## Live reliability

- [ ] Works from `npm run present` with Wi-Fi off.
- [ ] → / ← / PageDown / PageUp / Space (fullscreen) / 1–9 / Home / End / F / O / P / B all behave.
- [ ] Going back from any beat gives a valid frame; going back over auto beats does not bounce.
- [ ] Reduced motion (`?reduced=1`) keeps the story and the hard cuts.
- [ ] `?debug=1` is the only way the debug panel appears.
