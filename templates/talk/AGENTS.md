# Agent guide

This is a talk built with [beatdeck](https://github.com/borjaperfra/beatdeck): a fixed 1920×1080 React stage
where one click is one beat. To build or edit the talk, follow `skills/building-a-beatdeck/SKILL.md` (source →
content audit → beat map → scenes → verification). This file is the short version.

## Layout

| Path | What | Edit? |
| --- | --- | --- |
| `deck/` | **the talk**: `deck.config.ts`, `scenes.ts` (beat map), `index.tsx` (layers), `scenes/`, optional `timeline.ts` | yes |
| `reference/` | the source material (script, slides, images) — read-only once collected | add only |
| `docs/` | `CONTENT-AUDIT.md` (source → beats), `RUNBOOK.md` (the day of the talk) | yes |
| `themes/` | `neutral.css` (default), `light.css` — to brand, copy one to a new file and import that | copy |
| `src/beatdeck/` | the engine — replaced by `npm run upgrade` | no |
| `skills/building-a-beatdeck/` | the skill and its references — replaced by `npm run upgrade` | no |
| `scripts/` | `verify`, `shot`, `upgrade`, `check-offline` — replaced by `npm run upgrade` | no |

Decks import everything from `'beatdeck'`.

## Commands

```bash
npm run dev            # http://127.0.0.1:5173/#1.1
npm run shot -- 3 4.2  # quick frames of some beats while designing → artifacts/shot/ (+ contact.png)
npm run build          # typecheck + bundle + offline check → dist/
npm run verify         # every beat forwards/back/from URL, compared, audited → artifacts/verify/contact.png
npm run present        # production build, opened locally (works offline)
npm run upgrade        # newer beatdeck engine; never touches deck/ (then npm install && npm run verify)
```

With a written source, check exact text too: `npm run verify -- --source=reference/<script>.md`.

## Rules

1. `{ scene, beat }` is the whole state. One click = one beat. Every beat renders from `#s.b` alone.
2. Motion that runs by itself only inside beats marked `auto`: self-contained in a component, or driven by
   `initialLive` + `timeline` in `deck/timeline.ts` when other layers depend on it (see the skill).
3. Fixed 1920×1080 stage. Absolute positions. Nothing responsive inside the stage.
4. Offline: no CDN, remote fonts, APIs or analytics. The build fails otherwise.
5. Content fidelity: never invent quotes, numbers, logos or URLs. Unknowns are explicit `TODO`s.
6. Don't call it done before `npm run build` and `npm run verify` pass and you've looked at the contact sheet.
