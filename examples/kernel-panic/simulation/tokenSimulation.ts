import { burnCounter } from './burnCounter';

/**
 * 04 BURN TOKENS. The live requests of 03 survive as a slow drift (04.1–04.3), fade in the void (04.4) and come
 * back as tokens pulled into the GPU (04.5). Cap 900 tokens. Glyphs limited to what the local Roboto Mono subset has.
 */
export const TOK = ['tok', 'def', '{', '}', '=>', '0x3f', 'the', 'qwen', 'fn', 'await', '<|im_start|>', '42', 'git', 'npm', '[]', '//', 'ok', 'json', 'yield', 'return', 'const', '::', 'ctx', 'diff', 'PR', '</s>', '#!'];
export const TOKEN_CAP = 900;

export interface Drift { x: number; y: number; vx: number; vy: number }
export interface Tok { x: number; y: number; vx: number; vy: number; v: number; t: string; s: number; c: boolean }

export const mkTok = (x: number, y: number): Tok => ({
  x, y, vx: 0, vy: 0, v: 0.03 + Math.random() * 0.06,
  t: TOK[(Math.random() * TOK.length) | 0], s: [16, 20, 26][(Math.random() * 3) | 0], c: Math.random() < 0.18,
});

export const randomDrift = (n: number): Drift[] =>
  Array.from({ length: n }, () => ({ x: Math.random() * 1920, y: 120 + Math.random() * 840, vx: (Math.random() - 0.5) * 0.04, vy: (Math.random() - 0.5) * 0.04 }));

export function drawDrift(x: CanvasRenderingContext2D, dt: number, drift: Drift[], fade: number) {
  if (fade <= 0) return;
  x.fillStyle = `rgba(255,255,255,${(0.45 * fade).toFixed(3)})`;
  for (const p of drift) {
    p.x += p.vx * dt; p.y += p.vy * dt;
    if (p.x < 0) p.x += 1920;
    if (p.x > 1920) p.x -= 1920;
    if (p.y < 80) p.y = 1000;
    if (p.y > 1000) p.y = 80;
    x.fillRect(p.x - 2, p.y - 2, 4, 4);
  }
}

/** Returns the new token array. `ramp` 0–1 controls spawn and pull. */
export function drawBurn(x: CanvasRenderingContext2D, dt: number, burn: Tok[], ramp: number, tx: number, ty: number, trickle = false, quiet: [number, number, number, number][] = []): Tok[] {
  // trickle (04.6): a thin steady intake so the GPU keeps working while the model card is read
  const n = trickle ? (Math.random() < 0.2 ? 1 : 0) : Math.floor(1 + ramp * 6 + Math.random() * 1.5);
  for (let i = 0; i < n && burn.length < TOKEN_CAP; i++) {
    const e = Math.random();
    const px = e < 0.6 ? -80 + Math.random() * 300 : Math.random() * 1300;
    const py = e < 0.6 ? Math.random() * 1080 : Math.random() < 0.5 ? -30 : 1110;
    burn.push(mkTok(px, py));
  }
  const acc = trickle ? 0.006 : 0.0004 + ramp * 0.0022;
  x.textBaseline = 'middle';
  let font = '';
  const out: Tok[] = [];
  for (const p of burn) {
    const dx = tx - p.x, dy = ty - p.y, d = Math.hypot(dx, dy) || 1;
    if (d < 60) { burnCounter.add(40 + ((Math.random() * 600) | 0)); continue; }
    p.v += acc * dt;
    p.vx += ((dx / d) * p.v - p.vx) * 0.08;
    p.vy += ((dy / d) * p.v - p.vy) * 0.08;
    p.x += p.vx * dt; p.y += p.vy * dt;
    const sp = Math.hypot(p.vx, p.vy);
    // tokens crossing text pass dimmed underneath it
    let q = 1;
    for (const [l, t, r, bt] of quiet) if (p.x > l && p.x < r && p.y > t && p.y < bt) { q = 0.16; break; }
    x.globalAlpha = q;
    x.fillStyle = p.c ? '#818CF8' : `rgba(255,255,255,${Math.min(trickle ? 0.5 : 1, 0.35 + sp * 0.5).toFixed(2)})`;
    const f = `${p.s}px "Roboto Mono"`;
    if (f !== font) { x.font = f; font = f; }
    x.fillText(p.t, p.x, p.y);
    out.push(p);
  }
  x.globalAlpha = 1;
  return out;
}
