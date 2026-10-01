# beatdeck API

Everything is imported from `'beatdeck'` (an alias of `src/beatdeck/index.ts`).

## Deck definition — `deck/index.tsx`

```tsx
import { defineDeck } from 'beatdeck';
import '../themes/neutral.css';

export default defineDeck<Live>({
  id: 'my-talk',                    // namespace for localStorage + presenter channel
  title: 'My talk',                 // document title, default chrome label
  lang: 'en',
  scenes: SCENES,                   // SceneDef[] from deck/scenes.ts
  Stage,                            // component rendering every layer, back to front
  Chrome: undefined,                // undefined = DefaultChrome · null = none (draw your own inside Stage) · Component
  Overlay: undefined,               // drawn above the cut-to-black cover
  Debug: undefined,                 // extra rows in ?debug=1
  initialLive, timeline,            // automatic beats (see beat-model.md)
  prev: (p) => undefined,           // override "previous"; undefined = default
  isBlack: (s) => false,            // pure black stage, chrome hidden
  isCut: (s) => false,              // black cover over everything but Overlay
  fonts: ['600 100px "Inter Variable"'],  // waited for (≤ 2.5 s) before the first frame
  cursorHideMs: 2000,
  qrUrl: config.qrUrl,              // 'TODO' → presenter warns, <QR> renders nothing
});
```

`src/main.tsx` mounts it: `mount(deck)`. `vite --mode <name>` mounts `examples/<name>/index.tsx` instead.

## Types

```ts
interface SceneDef { id: string; title: string; beats: BeatDef[] }
interface BeatDef  { name: string; auto?: boolean; ref?: string; source?: string; note?: string }
interface Position { scene: number; beat: number }            // 0-based
interface DeckState<L> extends Position { live: L; entry: number; from: Position | null; blackout: boolean }
interface TimelineHost<L> {
  tl: gsap.core.Timeline;              // killed on leaving the beat
  at(ms: number, fn: () => void): void;
  setLive(p: Partial<L>): void;
  autoGo(p: Position): void;           // ignored in ?capture=1
  onExit(fn: () => void): void;        // cleanup for things started outside the timeline
}
```

## Hooks and handles

| Export | Use |
| --- | --- |
| `Scene({ index })` | Scene layer: fades in only while the deck is in scene `index` (0-based). Provides `useScene()`. |
| `useScene()` | `{ here, b, entry }` inside a `<Scene>`. `b` is -1 when the deck is elsewhere. |
| `usePos()` | `{ s, b, entry }` — global position, for layers that span scenes. |
| `useDeck(sel)` | Subscribe to a slice of `DeckState` (shallow-compared). Annotate `sel`'s parameter as `DeckState<Live>` to type `live`, or wrap it once: `export const useLive = <T,>(f: (s: DeckState<Live>) => T) => useDeck<T, Live>(f)`. |
| `deck` | Imperative handle: `go`, `next`, `prev`, `home`, `end`, `getState`, `subscribe`, `scenes`, `label(pos)`. |
| `useStageScale()` / `useStagePixelRatio()` | For canvas layers: backing-store ratio clamped to [1, 2]. |
| `flags` | `{ presenter, debug, capture, reducedParam }` from the URL. |
| `reducedMotion` | `.get()`, `.subscribe()`; the root gets `.reduced-motion` when on. |
| `glitch`, `useGlitch`, `rng` | Short-lived glitch state (`glitch.start(ms, panic?)`), and a deterministic RNG from its seed. Stopped on every beat change. |
| `debugStats` | Write `fps` / `particles` from animation loops; shown in `?debug=1`. |

## Components

| Export | Use |
| --- | --- |
| `Reveal({ on, out?, x?, y?, delay?, ms?, rise? })` | Element that belongs to some beats. Leaves up if `out` (story moved past it), down otherwise. |
| `CountUp({ value, from?, entry?, ms?, delay?, prefix?, suffix? })` | Number that tweens to `value`; with `from` + `entry` it restarts on every beat entry. Tabular figures. |
| `Typewriter({ lines, run, entry?, charMs?, delay? })` | Types text with an accent bar cursor without reflowing anything around it. |
| `QR({ url, size, x?, y? })` | QR computed locally from the URL (white plate, quiet zone). Nothing while `url` is 'TODO'. |
| `DefaultChrome` | Title // scene id top-left, one tick per beat at the bottom. |

## Motion constants

`EASE` (cubic-bezier(.22,1,.36,1)), `OUT_MS` 320, `IN_DELAY` 340,
`swap(on, inMs?, extraDelay?, props?)` → transition string, `layerFade(on)` → scene layer transition.

## CSS

Base classes: `.layer` (absolute, full stage, no pointer events), `.mono`, `.cursor` (blinking).
Theme roles (neutral): `.t-statement`, `.t-editorial`, `.t-numeral`, `.t-meta`, `.t-eyebrow`.
Tokens: `--bg --surface --ink --ink-2 --ink-3 --hair --hair-strong --accent --accent-strong --ok --warning
--fault --font-sans --font-mono --ease`, plus `--op-accent --op-accent-strong` for operator UI.
Root classes: `.capture` (stop ambient loops), `.reduced-motion`, `.cursor-hidden`.
