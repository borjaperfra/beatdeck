# Changelog

Talk projects update with `npm run upgrade` (see README → Updating a talk).

## 0.5.1
- Fix: `upgrade` refused talks copied before `init` existed (they still had `.claude-plugin/`); it now refuses
  only the beatdeck repo itself (package named `beatdeck`), or pass `--force`.
- `upgrade` reports beatdeck-repo leftovers in old talks (showcase, plugin files, old CI, changelog) and removes
  them with `--clean`.

## 0.5.0
- `init` starts from a **blank two-scene deck** (`--demo` keeps the demo), creates `reference/`,
  `docs/CONTENT-AUDIT.md`, `docs/RUNBOOK.md`, the talk's own `AGENTS.md` and a verify workflow, and no longer
  leaves beatdeck's changelog, CI or templates behind. `upgrade` manages the talk workflow, not `AGENTS.md`.
- Charts: `Plot`, `Zone`, `Series`, `Marker`, `PlotLabel`, `usePlot`, `scaleLinear`. The demo charts real timings.
- Exact text: `data-exact` compared as prose (Markdown markers and line breaks ignored), Terminal lines verbatim;
  `shot --source`.
- `shot` writes a contact sheet; `usePos().dir`; `useReached(scene, beat, until)`; `Reveal axis="x"`.
- Fix: copies no longer use `fs.cpSync` (fails on Windows paths with non-ASCII characters in Node 24).

## 0.4.0
- `npm run upgrade`: update a talk's engine without touching `deck/`; `.beatdeck.json` manifest written by `init`.
- `verify` / `shot` find a browser: `$BEATDECK_BROWSER`, Chrome, Edge, or Playwright's Chromium.
- CI on Linux (demo, showcase, scaffold → init → build → upgrade) and the demo published to GitHub Pages.

## 0.3.0
- `init` resets the demo's QR target to `TODO`.
- `verify` fails on text outside the stage, overlapping text and uppercase-broken `µ`/`ß`; `--source` checks
  Terminal lines and `data-exact` text verbatim; warns on text under 18 px.
- `npm run shot` for a few beats from the dev server; `verify` loads beats in parallel.
- `CountUp` `decimals` + `locale`; `useScene().dir` / `useArrival()`; `.keep-case`; per-beat `tolerance`.
- Skill: how to read a written script, entry-animation patterns, complete API reference.

## 0.2.0
- `npm run init`, `Terminal`, `NodeBox`, `Arrow`, `npm run verify` (replaces `screenshots`), light theme fixes.

## 0.1.0
- Engine extracted from the Kernel Panic #01 talk, neutral demo deck, showcase, `building-a-beatdeck` skill.
