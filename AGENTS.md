# beatdeck — agent guide

This repo is a talk engine plus one talk. If you are building or editing a presentation here, follow the skill
in `skills/building-a-beatdeck/SKILL.md` — it is the full workflow (source → content audit → beat map → scenes →
verification). This file is the short version.

## Layout

| Path | What | Edit? |
| --- | --- | --- |
| `deck/` | **the talk**: `deck.config.ts`, `scenes.ts` (beat map), `timeline.ts`, `index.tsx`, `scenes/` | yes |
| `themes/` | `neutral.css` (default), `light.css` | copy/adjust |
| `src/beatdeck/` | the engine (state, navigation, presenter, overview, debug, stage) | only for generic changes |
| `examples/kernel-panic/` | a full 47-beat production talk, reference only | no |
| `skills/building-a-beatdeck/` | the skill + references + `extract_pptx.py` | — |
| `scripts/` | `check-offline.mjs`, `verify.mjs` | — |

`src/beatdeck/` never imports from `deck/`. Decks import everything from `'beatdeck'`.

## Commands

```bash
npm run init -- --title "…" --author "…"   # once, in a fresh copy: strips the repo down to a talk
npm run dev            # http://127.0.0.1:5173/#1.1
npm run build          # typecheck + bundle + offline check → dist/
npm run present        # build + local production server
npm run shot -- 3 4.2  # quick frames of some beats while designing → artifacts/shot/
npm run verify         # every beat forwards/back/from URL, compared → artifacts/verify/ (contact.png)
npm run example:kernel-panic
```

## Rules

1. `{ scene, beat }` is the whole state. One click = one beat. Every beat renders from `#s.b` alone.
2. Automatic motion only inside beats marked `auto`, written in `deck/timeline.ts`.
3. Fixed 1920×1080 stage. Absolute positions. Nothing responsive inside the stage.
4. Offline: no CDN, remote fonts, APIs or analytics. The build fails otherwise.
5. Content fidelity: never invent quotes, numbers, logos or URLs. Unknowns are explicit `TODO`s.
6. Don't call it done before `npm run build` and `npm run verify` pass and you've looked at `artifacts/verify/contact.png`.
