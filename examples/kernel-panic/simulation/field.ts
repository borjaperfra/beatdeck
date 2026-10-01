/** Background dot field (7 %), reacting to load / attraction / panic. Same maths as v3. */
export interface FieldParams {
  /** target alpha multiplier */
  a: number;
  load: number;
  /** attraction strength toward (ax, ay) */
  as: number;
  ax: number;
  ay: number;
  /** right-half boost (03: self-hosted side) */
  rb: number;
  jit: number;
  red: boolean;
}

export const defaultField = (): FieldParams => ({ a: 1, load: 0, as: 0, ax: 0, ay: 0, rb: 0, jit: 0, red: false });

// precomputed grid + vignette mask
const GRID: { x: number; y: number; m: number }[] = [];
for (let gx = 20; gx < 1920; gx += 40) {
  for (let gy = 20; gy < 1080; gy += 40) {
    const nx = (gx - 960) / 960, ny = (gy - 540) / 540;
    const m = 1 - (nx * nx * 0.55 + ny * ny * 0.75);
    if (m > 0) GRID.push({ x: gx, y: gy, m });
  }
}

export function drawField(x: CanvasRenderingContext2D, now: number, fa: number, P: FieldParams) {
  if (fa < 0.01) return;
  const rgb = P.red ? '255,95,86' : '129,140,248';
  let lastA = -1;
  for (let i = 0; i < GRID.length; i++) {
    const { x: gx, y: gy, m } = GRID[i];
    let px = gx, py = gy;
    if (P.as) {
      const dx = P.ax - gx, dy = P.ay - gy, d = Math.hypot(dx, dy) + 1;
      const f = Math.min(d * 0.8, P.as * Math.exp(-d / 420) * 60);
      px += (dx / d) * f; py += (dy / d) * f;
    }
    if (P.load) {
      px += Math.sin(gy * 0.02 + now * 0.004) * P.load * 3;
      py += Math.cos(gx * 0.017 + now * 0.005) * P.load * 2;
    }
    if (P.jit) {
      px += (Math.random() - 0.5) * P.jit;
      py += (Math.random() - 0.5) * P.jit * 0.3;
    }
    let al = fa * m * (0.07 + P.load * 0.09);
    if (P.rb && gx > 960) al *= 1 + P.rb;
    if (P.red) al = Math.min(1, al * 3);
    // quantise alpha so fillStyle strings are reused
    const qa = Math.round(al * 200) / 200;
    if (qa !== lastA) { x.fillStyle = `rgba(${rgb},${qa})`; lastA = qa; }
    x.fillRect(px - 1, py - 1, 2, 2);
  }
}
