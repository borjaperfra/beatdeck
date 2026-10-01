---
name: building-a-beatdeck
description: Builds a talk as a beatdeck - a fixed 1920x1080 React stage where one click is one beat, with authored motion, presenter view, overview, and an offline self-contained build. Covers turning source material (PPTX, Keynote/PDF export, Markdown, notes) into a content audit and a scene/beat map, choosing or applying a theme, writing scene layers, automatic beats, and verifying every beat with npm run verify. Use whenever the task is creating, porting, restyling, rehearsing or fixing a presentation, talk, keynote, slide deck or conference session that should feel like a live system rather than slides, or whenever the repo contains src/beatdeck/.
license: MIT
---

# Building a beatdeck

A beatdeck is a talk written as code: **8-ish scenes, each made of beats; one click = one beat**. The stage is a
fixed 1920×1080 canvas scaled into any screen with black letterbox. Everything is bundled, so it runs with Wi-Fi off.

Your job is to turn what the speaker wants to say into beats that feel authored — not to reproduce slides.

**Paths.** `references/…` and `scripts/…` below are relative to the folder of this SKILL.md, wherever the skill
is installed (plugin, `~/.claude/skills/`, or `skills/building-a-beatdeck/` inside a deck project). Everything
else (`deck/`, `src/`, `npm run …`) is relative to the deck project.

## 0 · Get a deck repo

If the working directory has no `src/beatdeck/`, scaffold one, clean it and install:

```bash
npx degit borjaperfra/beatdeck my-talk && cd my-talk
npm run init -- --title "<title>" --author "<speaker>" --lang <en|es|…> [--theme light] [--demo]
npm install
```

`init` strips what belongs to the beatdeck repo, not to a talk (the Kernel Panic showcase and its non-MIT
assets, plugin files, beatdeck's README, changelog and CI), renames the package and writes title/author/lang/
theme into the deck. `deck/` becomes a **blank two-scene starter** (standby + title, questions + QR) to build
on; `--demo` keeps beatdeck's 6-scene demo instead, as a reference to read and replace. It also creates
`reference/` (put the source there), `docs/CONTENT-AUDIT.md` and `docs/RUNBOOK.md` from the templates, the talk's
`AGENTS.md` and a CI workflow that builds and verifies every push.
Use `--theme light` when the room is bright or the talk is streamed. Run it once; it deletes itself.
It also resets the demo's `qrUrl` to `TODO` and clears its tagline: set the real QR target only from the source.

Then read `AGENTS.md`. The demo deck (on GitHub in `deck/`, or locally with `init --demo`) is the reference
implementation of every pattern below. `init` removes the heavier example from your project; read it on GitHub when you need it:
https://github.com/borjaperfra/beatdeck/tree/main/examples/kernel-panic — a 47-beat production talk. Look at
`index.tsx` (custom chrome, `isCut` + `Overlay` for a cut to black), `deck/timeline.ts` (every kind of automatic
beat), `architecture/` (one SVG world spanning several scenes) and `simulation/` (a Canvas 2D particle layer).

The talk lives in `deck/`. Never edit `src/beatdeck/` for one talk; if the engine truly lacks something, add it
generically there and say so (`npm run upgrade` replaces engine files; edits are backed up, not merged).

**Existing talk project?** If `.beatdeck.json` exists, `npm run upgrade -- --dry-run` shows whether a newer engine
is available; upgrade only when the user agrees, then `npm install && npm run verify`, and merge any
`*.beatdeck-new` file it reports.

## 1 · Collect the source

Ask for (or find) the source material and the facts you must not guess: title, speaker, event, date, the QR
target URL, real screenshots/logos/photos. Put originals in `reference/` (read-only from then on).

- **PPTX**: `python <skill folder>/scripts/extract_pptx.py deck.pptx reference/source` → one Markdown file with
  every slide's text, speaker notes and media, plus the media files. (Inside a scaffolded project the skill
  folder is `skills/building-a-beatdeck/`.)
- **PDF / Keynote**: export to PDF and read it page by page; ask for the original images.
- **A written script (Markdown, a doc, notes)**: use as is, and read it by kind of content:
  - **narration** (prose, `>` quotes: what the speaker *says*) → the presenter view (`source` / `note`). On
    stage it becomes a short statement in the speaker's own words — condensed, never reworded into new claims;
  - **facts** (bullets, figures, names) → on stage, exactly as written (same numbers, same rounding, same "~");
  - **code blocks, commands, formulas, output** → on stage character for character (`Terminal`, or a
    `data-exact` element — see step 6), never retyped from memory;
  - **stage directions** ("on screen…", "show how it grows…") → instructions for you, not text to display.

**Nobody to ask?** If you are working without the speaker, decide, record each decision in the audit's
"Decisions taken on the speaker's behalf", and list them in your hand-off. Keep the neutral theme and its
accent unless a brand is given — choosing a palette is an art direction, not a default.

Real artefacts beat redraws: if the source shows a tweet, a logo, a product photo or a meme, use the real file.
Never invent quotes, numbers, tweet text, URLs or logos. Missing facts become explicit `TODO`s and questions.

## 2 · Content audit (before any code)

Write `docs/CONTENT-AUDIT.md` from `references/content-audit-template.md`: every source slide → the beat(s)
that carry it, what is kept, restored or deliberately cut, and open questions. This is what lets you say
"nothing was lost" later. Show it to the user when it changes what the talk says.

## 3 · Beat map

Turn the audit into `deck/scenes.ts` (`SceneDef[]`). Rules (details in `references/beat-model.md`):

- A **scene** is a mode of the talk (a stage world), not a slide title. 5–9 scenes is typical; keys 1–9 jump
  to scenes, so more than 9 leaves the rest reachable only by stepping or the overview (O).
- A **beat** is one idea landing. If two things must appear on separate clicks, they are two beats.
- `auto: true` marks a beat whose motion runs by itself and takes noticeable time (a boot sequence, a counter,
  a cascade of warnings, a typed command). The presenter flags it and `verify` waits for it. Everything else
  waits for the click. Two ways to implement it — pick the lighter:
  - **self-contained** (a `Typewriter`, a `CountUp` that restarts on entry): no `timeline` needed;
  - **state-driven** (other layers react to its progress, a later beat depends on it, or it advances by itself):
    a `Live` field + `initialLive` + `timeline` in `deck/timeline.ts`. See `references/beat-model.md`.
- Fill `ref` (where it comes from), `source` (what the source says) and `note` (speaker cue) — the presenter
  view shows them; the audience never does.
- Keep the first scene's first beat as a calm standby screen: the talk starts on the first click. On a dark
  theme it can be pure black (`isBlack`); on a light theme use the theme background — anything drawn on a
  forced-black standby must not use theme ink colours.

## 4 · Visual direction

Default to the neutral theme (`themes/neutral.css`): near-black stage, off-white type, one accent, hairlines,
huge editorial type, negative space. Bright room, daylight or a stream → `themes/light.css` on top of it
(`init --theme light` does this). If the speaker has a brand, change tokens (`--accent`, fonts, `--bg`) in a
theme file — do not invent a new art direction, decorative labels, stickers, gradients, rounded cards or a
dashboard look. If a design reference exists (Figma, a v3 HTML prototype, a brand book), it decides *how it
looks and moves*; the source decides *what is said*. Record conflicts in the audit.

Fonts must be local: `@fontsource-variable/*` packages or `.woff2` files in the deck, plus their specs in
`fonts` of the deck definition so the first frame never shows a fallback face.

## 5 · Build the scenes

Read `references/authoring.md` and `references/api.md` first. The essentials:

```tsx
// deck/scenes/02-Idea.tsx
import { Reveal, Scene, useScene } from 'beatdeck';

function Idea_() {
  const { here, b } = useScene();                     // b = beat inside this scene (0-based), -1 elsewhere
  return (
    <>
      <Reveal on={here} x={150} y={150}><div className="t-statement" style={{ fontSize: 176 }}>Slides are pages.</div></Reveal>
      <Reveal on={here && b >= 1} x={150} y={360}><div className="t-statement" style={{ fontSize: 176 }}>Talks are beats.</div></Reveal>
    </>
  );
}
export const Idea = () => <Scene index={1}><Idea_ /></Scene>;
```

- Every scene layer stays mounted; visibility is a pure function of `{ scene, beat }` (+ `live`).
- Positions are absolute stage pixels. Nothing inside the stage is responsive.
- What leaves goes first and fast; what arrives starts once the space is free (`swap`, `Reveal`, `layerFade`).
- Automatic motion goes in `deck/timeline.ts`: `initialLive(pos)` gives every beat a complete start state,
  `timeline(pos, host)` schedules changes with `host.at(ms, …)`, `host.setLive`, `host.autoGo`.
- `entry` increments on **every** beat change anywhere in the deck. Use it to restart a local animation, and
  gate the animation with `here && b === k` so always-mounted components do not replay invisibly.
- Built-ins before custom code: `Terminal` for commands and output (character-exact, with marks and labels),
  `NodeBox` + `Arrow` for diagrams, `Plot` + `Zone` / `Series` / `Marker` / `PlotLabel` for charts, `CountUp`,
  `Typewriter`, `QR`. Build your own only when these cannot do it,
  and if it is generic, propose it for the engine.
- Text that must be exact (terminal output, quotes, code) lives in one module (e.g. `deck/terminal.ts`) copied
  character for character from the source; scenes import it, never retype it.
- Register every layer in `Stage` in `deck/index.tsx`, back to front.

Work scene by scene: write it, `npm run dev`, open `http://127.0.0.1:5173/#3.1`, step through with →/←.
To look at frames without a browser, `npm run shot -- 3 4.2 5.1-5.3` writes `artifacts/shot/SS-BB.png` (dev
server, no build, a few seconds per beat) and runs the same text/layout audit as `verify`. Use it while
iterating; keep `npm run verify` for the full proof.

## 6 · Verify (do not report done before this)

```bash
npm run build          # typecheck + bundle + offline check (fails on any remote URL)
npm run verify         # forwards, backwards and from the URL; frames compared; QR decoded; presenter
npm run verify -- --source=reference/<script>.md   # + every Terminal line / data-exact text verbatim in the script
```

Besides comparing frames, `verify` audits the visible text of every beat and **fails** on text outside the
1920×1080 stage, text overlapping other text, and `µ`/`ß` broken by uppercase; it **warns** on text under
18 px. When the source has exact text (code, commands, formulas, quotes), pass `--source`: Terminal lines are
checked automatically, and any other element that must match the script verbatim gets a `data-exact`
attribute (`<div data-exact>distancia = c × (t_llegada − t_envío)</div>`). `data-exact` text is compared with the
source as prose (Markdown markers like `**`, `>`, bullets and line breaks don't count, so a sentence may span
quote lines); Terminal lines are compared character for character. `npm run shot -- … --source=…` checks the
same while iterating. The check is one-way: it proves stage text is in the script, not that every script fact
reached the stage — that is the content audit's job. If an overlap is intentional
(a glitch layer, text over its own shadow), mark that element `data-audit="off"` and say why.

If a beat has an intentionally random or live layer (particles, dithering, a clock), give that beat a
`tolerance` (% of pixels) in `scenes.ts` and say why. Never raise tolerances to silence a real mismatch.

`verify` writes `artifacts/verify/contact.png` (every beat) plus `walk-`, `back-` and `direct-SS-BB.png`. Open
the contact sheet and the frames that matter, and check against `references/checklist.md`: no overlaps or
clipped text, every beat identical whether reached forwards, backwards or straight from `#s.b`, auto beats
settle, the closing QR scans, no placeholder left except an explicit, reported `TODO`.

## 7 · Hand-off

Write `docs/RUNBOOK.md` from `references/runbook-template.md` (how to run it on the day, keys, presenter
window, failure recovery). Tell the user what is still `TODO` and what you decided on their behalf.

## Hard rules

1. Content fidelity first: nothing from the source is lost silently; nothing is invented.
2. One click = one beat. Every beat reconstructable from `#scene.beat` alone; going back is always valid.
3. Offline: no CDN, no remote fonts, no APIs, no analytics. `npm run build` must pass the offline check.
4. `?debug=1` panels never appear otherwise; operator UI (overview, presenter) is never part of the story.
5. Honour reduced motion: keep the narrative and hard cuts, drop ambient and violent motion.
6. The QR target comes from `deck.config.ts`; never guess a URL.
