/**
 * 03 LOCAL ≠ SELF-HOSTED: parallel capacity. Requests fly into a machine; each takes a free slot for 1.5–2.6 s.
 * LOCAL has 5 slots and rejects the overflow (red). SELF-HOSTED grows 10 → 80 slots with demand (5 → 75).
 * Port of v3's mkSide / stepSide.
 */
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

export interface Packet { x: number; y: number; v: number; dx: number; dy: number; cell?: number; rej?: boolean; vx?: number; vy?: number; a?: number }
export interface Side {
  cx: number; cy: number; tx: number; ty: number;
  capS: number; cols: number; gh: number;
  pk: Packet[]; cells: number[]; fx: { x: number; y: number; vx: number; vy: number; a: number }[];
}

export const DEMAND = [5, 15, 30, 50, 75, 75, 75, 75];
export const CAP_R = [10, 20, 40, 60, 80, 80, 80, 80];

export function mkSide(cx: number, cy: number, cap: number, cols: number): Side {
  return { cx, cy, tx: cx, ty: cy, capS: cap, cols, gh: Math.ceil(cap / cols) * 40 - 10, pk: [], cells: new Array(80).fill(0), fx: [] };
}

export const cellXY = (S: Side, i: number) => ({
  x: S.cx - (S.cols * 40 - 10) / 2 + (i % S.cols) * 40,
  y: S.cy - S.gh / 2 + Math.floor(i / S.cols) * 40,
});

/** Where requests pass dimmed: the numbers, the labels and the chrome must always read. */
const QUIET: [number, number, number, number][] = [[0, 0, 1920, 72], [0, 1000, 1920, 1080], [100, 110, 780, 400], [1030, 110, 1880, 400], [100, 840, 1880, 970]];
const quiet = (px: number, py: number) => QUIET.some(([l, t, r, b]) => px > l && px < r && py > t && py < b);

export function stepSide(x: CanvasRenderingContext2D, dt: number, S: Side, D: number, cap: number, x0: number, x1: number, alpha: number, local: boolean, spawn = alpha > 0.05) {
  S.cx += (S.tx - S.cx) * 0.05; S.cy += (S.ty - S.cy) * 0.05;
  S.capS += (cap - S.capS) * 0.03;
  const capN = Math.floor(S.capS + 0.02);
  S.gh += (Math.ceil(Math.max(S.capS - 0.02, 1) / S.cols) * 40 - 10 - S.gh) * 0.08;
  const bw = S.cols * 40 - 10 + 56, bh = S.gh + 56;
  let lit = 0;
  for (let i = 0; i < 80; i++) if (S.cells[i] > 0) lit++;
  let total = S.pk.filter((p) => !p.rej).length + lit;
  let sp = 0;
  if (spawn) {
    while (total < D && sp < 3) {
      const r = Math.random();
      let px: number, py: number;
      if (r < 0.45) { px = local ? x0 : Math.random() < 0.5 ? x0 : x1; py = 220 + Math.random() * 700; }
      else { px = x0 + Math.random() * (x1 - x0); py = r < 0.72 ? 170 : 1000; }
      S.pk.push({ x: px, y: py, v: 0.22 + Math.random() * 0.14, dx: 0, dy: 0 });
      total++; sp++;
    }
  }
  for (let i = 0; i < 80; i++) {
    if (S.cells[i] > 0) {
      S.cells[i] -= dt;
      if (S.cells[i] <= 0) {
        S.cells[i] = 0;
        const c = cellXY(S, i);
        S.fx.push({ x: c.x + 15, y: c.y + 15, vx: 0.2 + Math.random() * 0.2, vy: (Math.random() - 0.5) * 0.25, a: 1 });
      }
    }
  }
  const reserved = new Set(S.pk.filter((p) => p.cell != null).map((p) => p.cell!));
  S.pk = S.pk.filter((p) => {
    if (p.rej) { p.x += p.vx! * dt; p.y += p.vy! * dt; p.a! -= dt / 800; return p.a! > 0; }
    if (p.cell != null) {
      const c = cellXY(S, p.cell);
      const dx = c.x + 15 - p.x, dy = c.y + 15 - p.y, d = Math.hypot(dx, dy);
      if (d < 5) { S.cells[p.cell] = 1500 + Math.random() * 1100; return false; }
      const m = Math.min(d, 0.8 * dt);
      p.x += (dx / d) * m; p.y += (dy / d) * m;
      return true;
    }
    const dx = S.cx - p.x, dy = S.cy - p.y, d = Math.hypot(dx, dy) || 1;
    if (Math.abs(dx) < bw / 2 + 4 && Math.abs(dy) < bh / 2 + 4) {
      let f = -1;
      for (let i = 0; i < capN; i++) if (S.cells[i] <= 0 && !reserved.has(i)) { f = i; break; }
      if (f >= 0) { p.cell = f; reserved.add(f); }
      else { p.rej = true; p.vx = (-dx / d) * 0.4; p.vy = (-dy / d) * 0.4 + (Math.random() - 0.5) * 0.25; p.a = 1; }
      return true;
    }
    p.dx = dx / d; p.dy = dy / d; p.x += p.dx * p.v * dt; p.y += p.dy * p.v * dt;
    return true;
  });

  if (alpha < 0.01) return;
  x.globalAlpha = alpha;
  const sat = local && D > 5;
  x.lineWidth = 1;
  x.strokeStyle = sat ? 'rgba(255,189,46,.85)' : 'rgba(255,255,255,.55)';
  x.strokeRect(Math.round(S.cx - bw / 2) + 0.5, Math.round(S.cy - bh / 2) + 0.5, Math.round(bw), Math.round(bh));
  for (let i = 0; i < 80; i++) {
    const vis = clamp(S.capS - i, 0, 1);
    if (vis <= 0.02) continue;
    const c = cellXY(S, i);
    const sz = 30 * vis, o = (30 - sz) / 2;
    if (S.cells[i] > 0) { x.fillStyle = '#fff'; x.fillRect(c.x + o, c.y + o, sz, sz); }
    else {
      x.strokeStyle = reserved.has(i) ? 'rgba(255,255,255,.7)' : 'rgba(129,140,248,.45)';
      x.strokeRect(c.x + o + 0.5, c.y + o + 0.5, sz - 1, sz - 1);
    }
  }
  for (const p of S.pk) {
    x.globalAlpha = quiet(p.x, p.y) ? alpha * 0.18 : alpha;
    if (p.rej) { x.fillStyle = `rgba(255,95,86,${p.a!.toFixed(3)})`; x.fillRect(p.x - 3, p.y - 3, 6, 6); continue; }
    x.fillStyle = '#fff'; x.fillRect(Math.round(p.x) - 3, Math.round(p.y) - 3, 6, 6);
  }
  x.globalAlpha = alpha;
  S.fx = S.fx.filter((o) => {
    o.x += o.vx * dt; o.y += o.vy * dt; o.a -= dt / 900;
    if (o.a <= 0) return false;
    x.fillStyle = `rgba(129,140,248,${o.a.toFixed(3)})`; x.fillRect(o.x, o.y, 5, 5);
    return true;
  });
  x.globalAlpha = 1;
}
