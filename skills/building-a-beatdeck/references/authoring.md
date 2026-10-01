# Authoring scenes

## File layout

```
deck/
  deck.config.ts     everything that may change 5 minutes before going on (title, speaker, qrUrl, timings)
  scenes.ts          the beat map (SceneDef[])
  timeline.ts        Live type, initialLive, timeline — automatic beats only
  index.tsx          defineDeck + Stage (layer order) + theme import
  deck.css           optional: deck-only styles/keyframes (create it and import it from index.tsx)
  scenes/NN-Name.tsx one file per scene layer
  assets/            images, logos, data (imported, so Vite fingerprints and bundles them)
```

## A scene layer

```tsx
function Name_() {
  const { here, b, entry } = useScene();
  const intro = here && b === 0;             // only beat 0
  const built = here && b >= 2;              // from beat 2 on (stays while the scene lasts)
  return (
    <>
      <Reveal on={intro} out={here && b > 0} x={160} y={300}>…</Reveal>
      <Reveal on={built} x={160} y={600} delay={200}>…</Reveal>
    </>
  );
}
export const Name = () => <Scene index={3}><Name_ /></Scene>;
```

- Derive every visual from `here`, `b`, `live`. No `useState` for story state; no timers outside `timeline.ts`
  except purely cosmetic loops (CSS animations that `.capture` and `.reduced-motion` switch off).
- `entry` restarts local animations (`CountUp`, `Typewriter`, a GSAP tween in `useLayoutEffect`) on each entry.
- Layers that span scenes (a particle field, an architecture diagram that persists from scene 5 to 7, a chart
  that stays on screen while three scenes talk about it) use `usePos()` / `useReached(scene, beat, until)`
  instead of `<Scene>`, and decide per position what to show. Put them first in `Stage`.

## Layout on the stage

- Coordinates are stage pixels on 1920×1080. Use generous margins (≥ 120 px left/right, ≥ 100 px top).
- Huge type is the default voice: statements 150–320 px, numerals 180–260 px, body/meta 22–46 px.
  Nothing smaller than 18 px on stage — it must read from the back of the room.
- `whiteSpace: 'nowrap'` on statements; break lines explicitly. Check widths in screenshots, not by eye.
- One idea per beat on screen. If a beat needs a paragraph, it needs more beats.
- Uppercase roles (`.t-meta`, `.t-eyebrow`, the chrome) apply `text-transform: uppercase`, which turns `µ` into a
  Greek capital Mu (`38 µs` reads `38 ΜS`) and `ß` into `SS`. Wrap such units in `<span className="keep-case">`.
  `npm run verify` fails on it.

## Motion

- The one rule: nothing crossfades on top of anything. What leaves goes first and fast (`OUT_MS`); what arrives
  starts once the space is free (`IN_DELAY`) and settles slowly (`EASE`). `Reveal` and `swap()` do this.
- Stagger with `delay` (100–400 ms), not with extra beats.
- Draw lines with `pathLength={1}` + `strokeDashoffset` transitions; count numbers with `CountUp`.
- Ambient motion (a float, a flow along edges) is CSS keyframes. Nothing switches your own keyframes off for
  you: add `.capture .x, .reduced-motion .x { animation: none; }` for each, or `verify` frames will differ.

### Entry animations — pick the pattern by what should happen when the speaker goes back

| Want | Pattern |
| --- | --- |
| Appears on beat k and stays; going back to k does not replay it (default) | cumulative condition: `on={here && b >= k}` with `Reveal` / CSS transitions |
| Replays every time beat k is entered, from either side | restart on `entry`, gated: `<Typewriter run={here && b === k} entry={entry} …>`, `<CountUp from={0} entry={entry} …>` |
| Animates only when arriving forward; arriving back or by URL shows the end state | `const { dir } = useScene()`; e.g. `<CountUp from={here && b === k && dir === 'forward' ? 0 : undefined} …>` or `transition: dir === 'forward' ? '…' : 'none'` |

A fresh load (`dir === 'load'`, a refresh or `#s.b`) renders the settled frame with no animation: that is what
makes reload safe on stage, and what `verify` compares. To see the motion itself, step into the beat in
`npm run dev`.
- Canvas 2D for many particles; SVG for diagrams; DOM for text. Keep per-frame React re-renders out of loops:
  write to refs/DOM directly or use a canvas.

## Assets

- Import images (`import logo from '../assets/logo.png'`) so they are bundled. No hotlinking.
- Use the real artefact from the source (tweet screenshot, product photo, official logo) over a redraw.
- Keep a credits note for third-party material that is not yours to license.

## Theme

Change tokens in a theme file imported by `deck/index.tsx` (copy `themes/neutral.css` and edit). Brand fonts go
in the deck (`.woff2` + `@font-face`) or come from `@fontsource*` packages — never from a remote URL.
`themes/light.css` is a ready variant for bright rooms.

## Presenter notes

Put speaker cues in `note`, the source wording in `source`, and the source location in `ref`. The presenter
window (P) shows current + next beat, notes, a timer, and drives the stage over BroadcastChannel (same machine,
same browser, no network).
