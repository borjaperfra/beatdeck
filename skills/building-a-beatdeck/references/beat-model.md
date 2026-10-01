# The beat model

## State

```ts
{ scene, beat }            // 0-based; the URL shows #scene.beat 1-based (#3.2 = scene 2, beat 1)
live                       // automatic sub-state of the current beat (your type, e.g. { users: number })
entry                      // +1 on every beat entry, even re-entering the same beat
from                       // the previous position, for transitions that depend on direction
blackout                   // operator blackout (B). Not part of the talk.
```

Entering a beat (forwards, backwards, by number key, from the overview, the presenter, or a page refresh):

1. kills the previous beat's timeline and runs its `onExit` callbacks, stops the glitch effect;
2. sets `live = initialLive(pos)`;
3. writes `#s.b` to the URL (refresh-safe) and starts the talk timer on first leaving 1.1;
4. runs `timeline(pos, host)` if the deck has one.

So a beat must render correctly from `{ scene, beat, initialLive(pos) }` alone. That is what makes going back,
jumping and refreshing safe on stage.

## Scenes and beats

- **Scene** = a stage world with its own layout and mood (boot, an origin story, a technical diagram, a finale).
  Scenes cross-fade: the old one leaves fast, the new one enters after a short delay.
- **Beat** = one thing landing. Typical beats: a statement appears, a word is struck, a diagram gains a node,
  a number counts to its value, an image replaces another, a layer zooms.
- A scene with one beat is fine. A scene with 12 beats probably hides two scenes.
- Name beats after what happens ("strike pages", "server_02"), not "beat 3".

## `entry`

`entry` is a global counter: +1 on every beat entry anywhere in the deck (also re-entering the same beat).
It is the restart signal for local animations (`CountUp`, `Typewriter`, a GSAP tween in `useLayoutEffect`).
Because every layer stays mounted, an animation keyed only on `entry` also replays while invisible — harmless
but wasteful; gate it with `run={here && b === k}` (Typewriter) or only animate when `here`.

## Automatic beats

Mark a beat `auto: true` when motion happens *by itself* inside it and takes noticeable time. Implement it
the lighter way that works:

- **Self-contained**: the motion lives in one component and restarts on entry (`Typewriter` with
  `run={here && b === k}`, `CountUp` with `from` + `entry`). No `Live`, no timeline.
- **State-driven**: other layers react to its progress, a later beat depends on it, it cuts or advances by
  itself → a `Live` field, `initialLive`, and `timeline`:

- a boot log / typed command, then `host.autoGo` to the title;
- a counter or a simulation that grows (users 25 → 100);
- a cascade (three warnings one second apart);
- a failure that cuts to black after N ms.

Rules:

- `initialLive(pos)` must give the auto beat its *start* state and every other beat the *settled* state.
  (Coming back to beat 4 from beat 5 must not replay beat 4's cascade half-way.)
- `?capture=1` suppresses `autoGo` so `npm run verify` can step through auto beats.
- If a beat auto-advances, stepping back into it would immediately bounce forward again. Override `prev`
  so that "previous" skips it (the demo returns to standby from anywhere in scene 1).

## Black and cuts

- `isBlack(state)` → the stage background becomes pure `#000` and the default chrome hides (standby, reboot).
- `isCut(state)` → a black cover above every layer except `Overlay` (a hard cut that must hide particles, grid,
  chrome — e.g. the moment after a crash). Operator blackout (B) always counts as a cut.
- Reduced motion keeps cuts; it only removes ambient and violent motion.

## Keys (built in)

→ / ↓ / PageDown next · ← / ↑ / PageUp previous · Space next (fullscreen or presenter only) · 1–9 scene ·
Home / End · F fullscreen · O overview · P presenter window · B or . blackout · Esc closes the overview.
Clicking the stage advances. Clickers send PageDown/PageUp, so they work unchanged.

## URL flags

`#s.b` position · `?view=presenter` presenter window · `?debug=1` debug panel · `?capture=1` screenshot mode
(no auto-advance, no blinking, no ambient loops) · `?reduced=1` force reduced motion.
