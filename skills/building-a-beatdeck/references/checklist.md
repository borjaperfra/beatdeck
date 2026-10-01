# Verification checklist

Run before saying a deck (or a change to it) is done.

## Automated

- [ ] `npm run build` passes: typecheck, bundle, offline check (no remote URL in `dist/`).
- [ ] `npm run screenshots` exits 0: every beat walked with PageDown and reloaded from `#s.b`, no console
      errors or warnings, no request to a non-local host, presenter connects and drives the stage.

## Look at the screenshots

Build a contact sheet (all `SS-BB.png` in a grid) and open the full-size frames that matter.

- [ ] No overlapping or clipped text; nothing touches the stage edge; nothing smaller than 18 px.
- [ ] Walk frame `SS-BB.png` and direct frame `direct-SS-BB.png` match for every beat (reconstructable).
- [ ] Auto beats are captured in their settled state, and their start state is sane when entered directly.
- [ ] Each beat shows one idea; the reveal order matches the talk.
- [ ] Standby (1.1) is calm and the first click starts the talk.
- [ ] The closing QR is present and scans (or the URL is an explicit, reported `TODO`).

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
