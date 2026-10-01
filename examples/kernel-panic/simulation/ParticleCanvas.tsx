import { useEffect, useRef } from 'react';
import { glitch, reducedMotion } from 'beatdeck';
import { getState, subscribe } from '../deck/state';
import { center, worldRuntime } from '../architecture/geometry';
import { defaultField, drawField } from './field';
import { CAP_R, DEMAND, cellXY, mkSide, stepSide, type Side } from './requestSimulation';
import { drawBurn, drawDrift, mkTok, randomDrift, type Drift, type Tok } from './tokenSimulation';
import { clearPackets, drawArch, packetCount } from './loadSimulation';
import { burnCounter } from './burnCounter';
import { debugStats } from '../components/debugStats';
import { BURN_BEAT, QWENCITO_BEAT, burnQuietZones } from '../deck/scenes/04-burn-tokens/Burn';

/** Stage-level toggles (debug panel). */
export const canvasOptions = { grid: true };

/**
 * One Canvas 2D layer for everything that moves in bulk: dot field, requests, tokens, packets.
 * Particle arrays live here across beats, so material survives compatible scene changes
 * (03 requests → 04 drift → burn tokens; 05 → 06 → panic packets).
 */
export function ParticleCanvas({ pixelRatio }: { pixelRatio: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const prRef = useRef(pixelRatio);
  prRef.current = pixelRatio;

  useEffect(() => {
    const c = ref.current!;
    const x = c.getContext('2d', { alpha: true })!;
    let raf = 0, lastT = 0, fa = 0, blackCleared = false, staticDone = false, lastPublish = 0, simA = 1;
    let sim: { L: Side; R: Side; t0: number } | null = null;
    let fromTweet = false;
    let drift: Drift[] = [];
    let burn: Tok[] = [];
    let beatT = performance.now();
    let driftT0 = performance.now();
    let lastEntry = -1, lastScene = getState().scene;
    let frames = 0, fpsT = performance.now();

    // continuity rules on every beat entry (v3 go())
    const onEnter = () => {
      const st = getState();
      if (st.entry === lastEntry) return;
      lastEntry = st.entry;
      const s = st.scene, ps = lastScene;
      lastScene = s;
      beatT = performance.now();
      staticDone = false;
      if (s === 3 && ps === 2 && sim) {
        drift = [...sim.L.pk, ...sim.R.pk].filter((p) => !p.rej).map((p) => ({ x: p.x, y: p.y, vx: (Math.random() - 0.5) * 0.04, vy: (Math.random() - 0.5) * 0.04 }));
        for (const S of [sim.L, sim.R]) {
          S.cells.forEach((v, i) => { if (v > 0) { const q = cellXY(S, i); drift.push({ x: q.x + 15, y: q.y + 15, vx: (Math.random() - 0.5) * 0.04, vy: (Math.random() - 0.5) * 0.04 }); } });
        }
      }
      if (s === 2 && ps !== 2) { sim = null; fromTweet = ps === 1; }
      if (s !== 2 && s !== 3) sim = null;
      if (s === 3 && !drift.length) drift = randomDrift(140);
      if (s === 3 && ps !== 3) driftT0 = performance.now();
      if (s !== 3) { burn = []; drift = []; }
      if (s === 3 && st.beat === BURN_BEAT) { burnCounter.reset(); burn = drift.map((p) => mkTok(p.x, p.y)); }
      if (s < 3 || s > 6) clearPackets();
    };
    const unsub = subscribe(onEnter);
    onEnter();

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(50, now - (lastT || now));
      lastT = now;
      frames++;
      if (now - fpsT > 500) { debugStats.fps = Math.round((frames * 1000) / (now - fpsT)); frames = 0; fpsT = now; }

      const pr = prRef.current;
      const W = Math.round(1920 * pr), H = Math.round(1080 * pr);
      if (c.width !== W || c.height !== H) { c.width = W; c.height = H; blackCleared = false; staticDone = false; }

      const st = getState();
      const { scene: s, beat: b, live } = st;
      const absBlack = live.black || st.blackout || (s === 6 && b === 0) || (s === 0 && b <= 1);
      if (absBlack) {
        // absolute black: draw nothing, simulate nothing
        if (!blackCleared) { x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, c.width, c.height); blackCleared = true; }
        staticDone = false;
        fa = 0;
        debugStats.particles = 0;
        return;
      }

      const g = glitch.get();
      const fp = defaultField();
      if (s === 2) fp.rb = [0, 0.4, 0.8, 1.2, 1.6, 1.6, 0.4, 0.4][b];
      if (s === 3) {
        if (b >= BURN_BEAT) { const q = center('gpu1'); fp.ax = q.x; fp.ay = q.y; fp.as = b === BURN_BEAT ? Math.min(1, (now - beatT) / 5000) * 1.6 : 0.6; }
      }
      if (s === 4) fp.load = b >= 5 ? 0.15 : 0.04;
      if (s === 5) {
        fp.load = b === 0 ? ((live.users - 25) / 75) * 0.8 : b === 2 ? 0.05 : b >= 4 ? 1 : 0.6;
        if (live.panic) { fp.load = 1.6; fp.red = true; if (g.violent) fp.jit = 90; }
      }
      if (s === 6) { fp.a = 0.8; fp.load = b === 4 ? 0.2 : 0; }
      if (s === 7) fp.a = b >= 6 ? 0 : 0.4;
      if (!canvasOptions.grid) fp.a = 0;
      if (reducedMotion.get()) fp.load = Math.min(fp.load, 0.2);

      // static scenes: once the field has settled, stop redrawing
      const dynamic = s >= 2 && s <= 6;
      blackCleared = false;
      if (!dynamic && staticDone && !g.active) return;
      fa += (fp.a - fa) * 0.05;
      staticDone = !dynamic && Math.abs(fp.a - fa) < 0.002;

      x.setTransform(pr, 0, 0, pr, 0, 0);
      x.clearRect(0, 0, 1920, 1080);
      drawField(x, now, fa, fp);

      let count = 0;
      if (s === 2) {
        const D = DEMAND[b], capR = CAP_R[b];
        if (!sim) { sim = { L: mkSide(fromTweet ? 960 : 480, fromTweet ? 480 : 600, 5, 5), R: mkSide(1440, 600, 10, 10), t0: now }; }
        sim.L.tx = 480; sim.L.ty = 600;
        // the machines leave before the logos arrive (simulation keeps running unseen, for the 04 drift)
        simA += ((b >= 6 ? 0 : 1) - simA) * (b >= 6 ? 0.18 : 0.06);
        const rA = Math.max(0, Math.min(1, (now - sim.t0 - 900) / 900));
        const lA = fromTweet ? Math.max(0, Math.min(1, (now - sim.t0 - 340) / 500)) : 1;
        stepSide(x, dt, sim.L, D, 5, 60, 900, simA * lA, true, lA > 0.05);
        stepSide(x, dt, sim.R, D, capR, 1020, 1860, simA * rA, false, rA > 0.05);
        count = sim.L.pk.length + sim.R.pk.length;
      }
      if (s === 3 && b < BURN_BEAT) {
        const fade = Math.min(1, (now - driftT0) / 1400);
        drawDrift(x, dt, drift, fade);
        count = fade > 0 ? drift.length : 0;
      }
      if (s === 3 && b >= BURN_BEAT) {
        const T = (now - beatT) / 1000;
        const ramp = b === QWENCITO_BEAT ? 0.3 : Math.min(1, T / 6);
        const q = center('gpu1');
        burn = drawBurn(x, dt, burn, ramp, q.x, q.y, b === QWENCITO_BEAT, burnQuietZones(b));
        count = burn.length;
        if (now - lastPublish > 110) { lastPublish = now; burnCounter.publish(); }
      }
      if (s >= 3 && s <= 6 && worldRuntime.scene === s) {
        drawArch(x, dt);
        count += packetCount();
      }
      debugStats.particles = count;
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); unsub(); };
  }, []);

  return <canvas ref={ref} className="particles" width={1920} height={1080} />;
}
