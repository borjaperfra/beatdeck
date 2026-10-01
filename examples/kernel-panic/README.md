# Kernel Panic — showcase

**"Escalando inferencia · de 0 a cientos de usuarios"** — Cristian Córdova, KERNEL PANIC #01, Madrid.

The talk beatdeck was extracted from: 8 scenes, 47 beats, in Spanish. It shows what the engine carries in a real
production talk:

- a Canvas 2D particle field that keeps its particles across scenes (requests → tokens → packets);
- one SVG architecture world that grows from a single GPU server to Cloudflare + Kubernetes;
- automatic beats (boot log, user counter, warning cascade, a 50B-token odometer);
- a 520 ms kernel panic, then **absolute** black until the next click (`isCut` + `Overlay`);
- its own chrome (`Chrome: null`, drawn inside the shaking stage), its own theme and fonts.

```bash
npm run example:kernel-panic      # dev server
npm run present:kernel-panic      # production build → dist-kernel-panic/, opened in the browser
npm run verify:kernel-panic       # every beat forwards, back and from the URL (3% tolerance: random particles)
```

## Where things are

| | |
| --- | --- |
| `index.tsx` | the deck definition: layer order, black/cut rules, debug rows |
| `deck/scenes.ts` | 47 beats with source-slide refs and speaker notes (presenter view) |
| `deck/timeline.ts` | every automatic beat |
| `deck/scenes/` | scene layers |
| `architecture/`, `simulation/` | the SVG world and the particle canvas, both spanning scenes |
| `docs/` | the production brief, the content audit against the 24 source slides, the plan and the runbook |

The docs were written while building the talk; paths in them refer to the original standalone project
(`src/engine/…` is now `src/beatdeck/`, `src/deck/…` is `examples/kernel-panic/deck/…`). The source PPTX and the
design prototype they cite are not published.

Assets are **not** MIT — see [ASSETS-CREDITS.md](ASSETS-CREDITS.md).
