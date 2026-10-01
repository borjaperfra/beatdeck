# RUNBOOK — Escalando inferencia (KERNEL PANIC)

Five minutes before going on stage: do **1 → 3**, then open the presenter view (§5), and you are live.

## 1. Install (once, needs internet)

```
cd kernel-panic-live
npm install
```

## 2. Build

```
npm run build
```

This typechecks, builds `dist/`, and fails if anything in `dist/` points to a remote host.
It warns if the QR URL is still `TODO` (§8).

## 3. Run offline (the way to present)

```
npm run present
```

This builds, then serves `dist/` on **http://127.0.0.1:4173** and opens it. Everything it needs is local: fonts, images,
JS, QR. It works with Wi-Fi off.
To serve an existing build without rebuilding: `npm run preview`.

> Do not open `dist/index.html` by double-clicking it. Chrome blocks ES modules on `file://`. Always serve it.

Use current Chrome. Set the projector to 16:9 if you can; any other ratio is letterboxed in black.

## 4. Fullscreen

Press **F** on the stage window, or use the browser's own fullscreen. **Esc** exits as usual.
Press F again if the projector was plugged in after going fullscreen.

## 5. Keyboard / clicker

| Key | Action |
|---|---|
| → · PageDown · ↓ · Space (fullscreen only) · mouse click | next beat |
| ← · PageUp · ↑ | previous beat |
| 1 – 8 | first beat of that scene |
| Home / End | beginning / Q&A |
| O | overview (operator only): click a beat to jump; O or Esc closes without changing anything |
| P | open the presenter window |
| B or . | blackout toggle (a clicker's "blank screen" button) |
| F | fullscreen |

Clickers send PageDown/PageUp, which is the primary control. Holding a key does not repeat.

Automatic beats (they run by themselves after one click):

- 01.2 → 01.4: boot, wordmark and title (~9 s)
- 06.1: users 25 → 100
- 06.5: three warnings
- 06.6: 520 ms panic, then absolute black. **It waits for you.** The next click is `> reboot_`.
- 08.5: 50B counter (~4.6 s), then "this is fine"

## 6. Presenter view

Press **P** on the stage, or open **http://127.0.0.1:4173/?view=presenter** in a second window on your laptop screen.
It shows the current and next beat, the source slide text, notes, the timer, and prev/next/blackout buttons.
A clicker or keyboard also works with the presenter window focused: it forwards to the stage.

The timer starts automatically when you leave 01.1. It survives refreshes. **reset timer** restarts it.

## 7. Jump / recover after refresh

- The position is always in the URL: `…/#5.4` = scene 5, beat 4. Edit the hash to jump.
- **Refresh (F5) restores the exact beat.** Every beat is rebuilt from state; nothing depends on what played before.
- A bare URL (no hash) is a fresh run: it starts at 01.1 and clears the timer. To resume after reopening the tab, add the hash back (`#5.4`).
- Use **O** or keys **1–8** to jump to a scene.

## 8. Change the QR URL

In `src/deck/deck.config.ts`:

```ts
speakerQrUrl: 'https://…',
```

Then `npm run build`. The QR is generated as SVG at build time, never online. While it is `'TODO'`, the Q&A shows
no QR (the photo takes its place) and the presenter shows a yellow warning.

## 9. Change the panic duration

`src/deck/deck.config.ts → panicMs` (default **520**). Rebuild.
Other knobs there: `tokenCountMs` (50B counter) and `cursorHideMs`.

## 10. Disable motion

- The OS setting "reduce motion" is honoured automatically.
- Or open the stage as **http://127.0.0.1:4173/?reduced=1**.

Reduced motion removes the jitter, RGB split, corruption bands and the tweet float. The panic becomes a static takeover,
and the cut to black is kept.

## 11. Presenter view lost sync

1. Press **resync** in the presenter window.
2. Still wrong? Refresh the presenter window (F5). It asks the stage for its position on load.
3. Both windows must be on the same address (`127.0.0.1:4173`) in the same Chrome profile.
4. The stage never depends on the presenter. You can always drive the stage directly with the clicker.

## 12. Test with network disabled

1. `npm run build`
2. Turn Wi-Fi off (or unplug).
3. `npm run preview`, open http://127.0.0.1:4173, go to DevTools → Network: every request must be `127.0.0.1`.
4. Walk the deck (End → Home, a few scenes).

Automated equivalents:

```
npm run screenshots     # every beat at 1920×1080 → artifacts/screenshots, fails on console errors or remote requests
node scripts/interaction-test.mjs   # keys, refresh recovery, presenter sync, reduced motion, cursor, letterbox
npm run perf            # frame times of the heavy beats → artifacts/perf.json
node scripts/filmstrip.mjs          # frames at +60…+2400 ms of every transition → artifacts/filmstrips (overlap review)
```

## Debug (rehearsal only)

`http://127.0.0.1:4173/?debug=1` adds a panel: scene/beat, FPS, particle count, live state, architecture JSON, trigger
panic, jump to the finale, grid toggle, and reduced-motion toggle. It never appears without `?debug=1`.
