# beatdeck

[![ci](https://github.com/borjaperfra/beatdeck/actions/workflows/ci.yml/badge.svg)](https://github.com/borjaperfra/beatdeck/actions/workflows/ci.yml)

**Try it:** [the demo deck](https://borjaperfra.github.io/beatdeck/) · [the Kernel Panic showcase](https://borjaperfra.github.io/beatdeck/kernel-panic/)
— click or → to advance, O for the overview, P for the presenter window.

**Talks as beats, not slides.** A fixed 1920×1080 React stage where one click is one beat. Motion is
authored, the state is `{ scene, beat }`, every beat rebuilds from the URL, and the build runs with Wi-Fi off.
It comes with a presenter window, an overview and a debug panel, plus a Claude Code skill that writes the talk
with you.

![The demo deck: title](docs/media/demo-title.jpg)

```bash
npx degit borjaperfra/beatdeck my-talk && cd my-talk
npm run init -- --title "My talk" --author "Your Name" --lang en   # --theme light for bright rooms, --demo to keep the demo
npm install
npm run dev          # http://127.0.0.1:5173
```

`init` turns the copy into a clean talk project: it removes the showcase, the plugin files, this README and
beatdeck's CI, renames the package, writes title, author, language and theme into the deck, and leaves a blank
two-scene starter (title, questions) plus `reference/`, a content audit, a runbook and a CI workflow for the
talk. `--demo` keeps the demo deck instead.

## Why

Slides are pages: you flip them. A talk that feels like a live system, with a diagram that grows, a counter
that runs or a crash that cuts to black, is a sequence of **beats** inside a few **scenes**. beatdeck makes
that the model:

- **One click = one beat.** Clickers (PageDown/PageUp), arrows, space, number keys and mouse all work.
- **Deterministic.** The whole state is `{ scene, beat }` plus the beat's automatic sub-state. `#3.4` in the
  URL always renders the same frame, whether you got there going forwards, going back, jumping or refreshing.
- **Automatic motion only where you want it.** A beat can run a GSAP timeline (a boot log, a counter, a
  cascade). Everything else waits for the speaker.
- **One stage.** Fixed 1920×1080, scaled with black letterbox. Nothing reflows on the projector.
- **Offline.** Fonts, images and QR codes are all bundled or computed locally. `npm run build` fails if anything
  references the network.
- **Operator tools.** A presenter window (P) with current/next beat, notes and a timer, synced over
  BroadcastChannel. An overview (O) to jump anywhere. Blackout (B). A debug panel with `?debug=1`.

![The demo deck: the state diagram, built one node per click](docs/media/demo-state.jpg)

## How a deck looks

```
deck/
  deck.config.ts     title, speaker, QR target, timings
  scenes.ts          the beat map: scenes → beats (+ source refs and speaker notes)
  timeline.ts        automatic beats: initialLive(pos) + timeline(pos, host)
  index.tsx          defineDeck({...}) + the Stage (layer order) + theme
  scenes/*.tsx       one layer per scene
```

```tsx
import { Reveal, Scene, useScene } from 'beatdeck';

function Idea_() {
  const { here, b } = useScene();
  return (
    <>
      <Reveal on={here} x={150} y={150}><h1 className="t-statement">Slides are pages.</h1></Reveal>
      <Reveal on={here && b >= 1} x={150} y={360}><h1 className="t-statement">Talks are beats.</h1></Reveal>
    </>
  );
}
export const Idea = () => <Scene index={1}><Idea_ /></Scene>;
```

Built in: `Reveal`, `Scene`, `CountUp`, `Typewriter`, `Terminal` (real commands and output, character-exact,
with highlights and labels), `NodeBox` + `Arrow` (diagrams that draw themselves), `Plot` + `Zone` / `Series` /
`Marker` / `PlotLabel` (charts), `QR` (computed locally).

The demo in `deck/` (7 scenes, 24 beats) uses every pattern: an automatic boot, a strike-through, a diagram
built node by node, terminal output with highlights, a chart, a self-counting number, and a locally generated
QR code. A new talk starts from a blank two-scene deck instead (`init --demo` keeps this one).

## Commands

| | |
| --- | --- |
| `npm run dev` | dev server at `http://127.0.0.1:5173/#1.1` |
| `npm run build` | typecheck + bundle + offline check → `dist/` (self-contained, any static server) |
| `npm run present` | build and open the production build locally |
| `npm run shot -- 3 4.2` | quick frames of a few beats (a scene, a beat, a range) from the dev server → `artifacts/shot/`, with the same text/layout audit. |
| `npm run verify` | every beat walked forwards, walked back and reloaded from its URL, frames pixel-compared, reduced motion, QR decoded, presenter + overview, contact sheet → `artifacts/verify/`. Fails on any mismatch, console error or remote request. Uses Chrome or Edge if installed, else Playwright's Chromium (`npx playwright-core install chromium`). |

## Updating a talk

The engine is copied into each talk, so a talk keeps working even if beatdeck changes. To take a newer version:

```bash
npm run upgrade                  # latest; or: npm run upgrade -- --ref v0.4.0   (--dry-run to preview)
npm install && npm run verify
```

`upgrade` replaces the engine (`src/beatdeck/`, the skill, the scripts, the base themes), updates engine
dependencies and adds new scripts. It never touches `deck/`, `index.html` or `docs/`. Engine files you edited
are backed up to `.beatdeck-backup/`; shared config you edited (`vite.config.ts`, `tsconfig.json`, …) is left as
is, with the new version beside it as `*.beatdeck-new`. `.beatdeck.json` records the version.

Talks created before `upgrade` existed (≤ 0.3.0) bootstrap it once (`--clean` also removes what early copies
carried over from this repo: the showcase and its non-MIT assets, the plugin files, beatdeck's CI):

```bash
npx degit borjaperfra/beatdeck/scripts .beatdeck-tmp && node .beatdeck-tmp/upgrade.mjs --clean && rm -rf .beatdeck-tmp
```

## Keys

→ ↓ PageDown, click, Space (fullscreen) next · ← ↑ PageUp previous · 1–9 scene · Home / End ·
F fullscreen · O overview · P presenter window · B blackout. URL flags: `?view=presenter`, `?debug=1`,
`?capture=1` (verification), `?reduced=1` (reduced motion).

## The skill

`skills/building-a-beatdeck/` teaches an agent the whole workflow: collect the source (it ships a PPTX
extractor), write a content audit so nothing is lost or invented, design the beat map, apply a theme, build
the scenes, then run `npm run verify` and look at every frame before calling it done.

**Claude Code** (plugin):

```
/plugin marketplace add borjaperfra/beatdeck
/plugin install beatdeck@beatdeck
```

**Any agent that reads `SKILL.md`**: copy `skills/building-a-beatdeck/` to `~/.claude/skills/` (or your
agent's skills folder). Inside a scaffolded deck it is already there, and `AGENTS.md` points to it.

Then ask for something like *"Turn talk.pptx into a beatdeck"* or *"Add a scene where the architecture grows
to three servers"*.

## Themes

`themes/neutral.css` is the default: near-black stage, off-white Inter + JetBrains Mono, one accent (`--accent`),
hairlines. `themes/light.css` is for bright rooms. To brand a deck, copy the theme and change the tokens. Fonts
must be local (`@fontsource*` packages or `.woff2` files).

## Showcase: Kernel Panic

![Kernel Panic: the current architecture scene](docs/media/kernel-panic-architecture.jpg)

`examples/kernel-panic/` is the production talk beatdeck was extracted from. *Escalando inferencia* by Cristian
Córdova, KERNEL PANIC #01, Madrid. It has 47 beats, a particle field that survives scene changes, an SVG
architecture that grows from one GPU to Cloudflare + Kubernetes, and a 520 ms kernel panic that cuts to
absolute black.

```bash
npm run example:kernel-panic
```

Its assets are not MIT; see [examples/kernel-panic/ASSETS-CREDITS.md](examples/kernel-panic/ASSETS-CREDITS.md).

## Stack

React 18, TypeScript, Vite, GSAP for timelines, SVG for diagrams, Canvas 2D for particles, CSS for type. No
backend, no CDN, no remote fonts. The engine is in `src/beatdeck/` and never imports from the deck.

## License

MIT for the code and docs. Third-party assets in the showcase keep their own terms.
