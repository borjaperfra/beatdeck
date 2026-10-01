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

`src/main.tsx` mounts it: `mount(deck)`. `vite --mode <name>` mounts `examples/<name>/index.tsx` instead (only in the beatdeck repo itself: `init`
removes `examples/` from a talk project).

## Types

```ts
interface SceneDef { id: string; title: string; beats: BeatDef[] }
interface BeatDef  { name: string; auto?: boolean; ref?: string; source?: string; note?: string;
                     tolerance?: number }   // verify: % px allowed to differ (random/live layers only)
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
| `useScene()` | `{ here, b, entry, dir }` inside a `<Scene>`. `b` is -1 when the deck is elsewhere. `dir`: how the beat was reached — `forward` · `back` · `same` · `load` (also `useArrival()` outside a scene). |
| `usePos()` | `{ s, b, entry, dir }` — global position, for layers that span scenes (`dir` as in `useScene`). |
| `useReached(scene, beat?, until?)` | For layers that span scenes: true from (scene, beat) on, 0-based; `until: [scene, beat]` ends it (exclusive). `reached(pos, scene, beat)` is the pure version. |
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
| `Reveal({ on, out?, x?, y?, delay?, ms?, rise?, axis? })` | Element that belongs to some beats. Leaves up if `out` (story moved past it), down otherwise; `axis="x"` slides in from the right and leaves to the left instead. |
| `CountUp({ value, from?, entry?, ms?, delay?, ease?, decimals?, locale?, prefix?, suffix? })` | Number that tweens to `value`; with `from` + `entry` it restarts on every beat entry. Tabular figures. `ease` is a GSAP ease (default `power2.out`). `decimals` fixes fraction digits; `locale` (e.g. `'es-ES'`) formats with its separators (`20.200`, `3,9`) — without it, plain digits. |
| `Typewriter({ lines, run, entry?, charMs?, delay?, cursorAfter?, lineStyle?, cursorColor? })` | Types text with an accent bar cursor without reflowing anything around it. Restarts whenever `run` becomes true or `entry` changes; with `run` false the text is shown complete. `cursorAfter` = ms the cursor stays after typing (default 1400); `lineStyle` styles each line; `cursorColor` defaults to `var(--accent)`. |
| `QR({ url, size, x?, y? })` | QR computed locally from the URL (white plate, quiet zone). Nothing while `url` is 'TODO'. |
| `DefaultChrome` | Title // scene id top-left, one tick per beat at the bottom. |
| `Terminal({ lines, size?, prompt?, x?, y?, framed? })` | Real commands and output, character-exact (`white-space: pre`, tabs kept). A line is a string or `{ t, on?, dim?, marks?, labels? }`; hidden lines keep their height. `marks: [{ text, nth?, on?, label?, row? }]` underline + recolour a substring and hang a label under it without changing the text. Lines starting with `prompt` (default `"$ "`) render as commands. |
| `NodeBox({ rect, on, kind?, value?, tone?, delay?, style? })` | Diagram node: hairline box, small `kind`, value (or children). `tone`: `normal` · `hot` (accent, the point of the beat) · `dim` · `ghost` (dashed). The box is mono, 28 px, `nowrap`: size `rect` for its text, or pass a styled element as `value` (e.g. sans for prose). |
| `Arrow({ from, to, on, tone?, head?, flow?, label?, lx?, ly?, labelAnchor?, delay?, gap? })` | Connector between two `Rect`s (or points), clipped to their borders, drawn on entry; optional arrowhead, label and dashed flow. One SVG layer per arrow, so it composes with HTML nodes. `labelAnchor` (`start` · `middle` · `end`) aligns the label at the midpoint + (`lx`, `ly`); `gap` = px kept free from each border (default 8). `rectExit(rect, x, y)` exposes the clipping maths. |
| `Plot({ rect, x, y, on, delay?, grid? })` | Chart area: `rect` is the plotting box (axes on its left and bottom edges). `x` / `y`: `{ domain: [min, max], ticks?: number[], label?, format? }` — only the given ticks are printed (`format` for locale: `(v) => v.toLocaleString('es-ES')`). Axes draw themselves on `on`. Children below work in data coordinates. `usePlot()` gives `{ x(v), y(v), rect }` for custom marks. |
| `Zone({ x?, y?, on, tone?, outline?, label?, opacity? })` | Shaded band/box in data coords (omit `x` or `y` to span the whole axis). `tone`: `accent` · `warning` · `fault` · `ok` · `ink`. `label` sits inside its top-left corner. |
| `Series({ points, on, tone?, width?, dashed?, ms? })` | Line through `[x, y]` data points; draws itself on `on`. |
| `Marker({ at, on, label?, tone?, labelSide? })` | Dot at `[x, y]`; change `at` between beats and it glides (back and forth). |
| `PlotLabel({ at, on, anchor?, dx?, dy? })` | Text at a data point (`anchor`: `start` · `middle` · `end`). |

## Motion constants

`EASE` (cubic-bezier(.22,1,.36,1)), `OUT_MS` 320, `IN_DELAY` 340,
`swap(on, inMs?, extraDelay?, props?)` → transition string, `layerFade(on)` → scene layer transition.

Chart example — a target box, two zones and a point that moves into the box on a later beat:

```tsx
<Plot rect={{ x: 1000, y: 200, w: 760, h: 620 }} on={here}
  x={{ domain: [14, 26], ticks: [18, 22], label: 'extraction yield (%)' }}
  y={{ domain: [0.9, 1.6], ticks: [1.15, 1.35], label: 'strength (TDS %)' }}>
  <Zone x={[18, 22]} y={[1.15, 1.35]} on={b >= 1} tone="accent" outline />
  <Zone x={[14, 18]} on={b >= 2} tone="warning" label="sour" />
  <Marker at={b >= 4 ? [20, 1.25] : [16, 1.25]} on={b >= 3} label="your cup" />
</Plot>
```

Only plot values the source gives (ticks, zones, data points). A position that merely *illustrates* (a "your cup"
dot) implies numbers; say so in the audit.

Terminal example — show output exactly as the source has it, highlight what the beat is about:

```tsx
<Terminal x={150} y={140} size={30} lines={[
  '$ git hash-object hola.txt',
  { t: '5c1b14949828006ed75a3e8858957f86a2f7e2eb', marks: [{ text: '5c1b149', on: b >= 1, label: 'short hash' }], labels: 1 },
  { t: '$ git add hola.txt', on: b >= 2 },
]} />
```

Keep source text in one module (e.g. `deck/terminal.ts`) copied character for character, and never retype it in scenes.

## CSS

Audit attributes (read by `npm run verify` / `shot`): `data-exact` (text must appear verbatim in `--source`),
`data-audit="off"` (skip this subtree in the layout audit — only for intentional overlaps).

Base classes: `.layer` (absolute, full stage, no pointer events), `.mono`, `.cursor` (blinking), `.keep-case`
(opts out of `text-transform: uppercase`, for `µs`, `ß`).
Theme roles (neutral): `.t-statement`, `.t-editorial`, `.t-numeral`, `.t-meta`, `.t-eyebrow`.
Tokens: `--bg --surface --ink --ink-2 --ink-3 --hair --hair-strong --accent --accent-strong --ok --warning
--fault --font-sans --font-mono --ease`, plus `--op-accent --op-accent-strong` for operator UI.
Root classes: `.capture` (stop ambient loops), `.reduced-motion`, `.cursor-hidden`.
