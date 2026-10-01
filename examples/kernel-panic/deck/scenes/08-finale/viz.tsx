import { useEffect, useRef } from 'react';
import { rng } from 'beatdeck';
import world from '../../../assets/data/world-dots.json';
import dither from '../../../assets/source/cristian-cordova-dither-hd.png';
import photoSrc from '../../../assets/source/cristian-cordova-photo.jpg';

/**
 * Pixel visualisations for the finale (Helmcode dither language). Each one is a pure function of time since the
 * beat started, drawn on its own small canvas; the loop stops as soon as the drawing has settled.
 */
type Draw = (x: CanvasRenderingContext2D, t: number) => void;

const VIOLET = [129, 140, 248];
const rgba = (c: number[], a: number) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const easeOut = (p: number) => 1 - Math.pow(1 - clamp01(p), 3);

export function VizCanvas({ w, h, draw, duration, run, entry, style }: {
  w: number; h: number; draw: Draw; duration: number; run: boolean; entry: number; style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current!;
    const pr = Math.min(2, window.devicePixelRatio || 1);
    c.width = w * pr; c.height = h * pr;
    const x = c.getContext('2d')!;
    const paint = (t: number) => { x.setTransform(pr, 0, 0, pr, 0, 0); x.clearRect(0, 0, w, h); draw(x, t); };
    if (!run) { paint(duration); return; }
    let raf = 0;
    const t0 = performance.now();
    const loop = (now: number) => {
      const t = now - t0;
      paint(Math.min(t, duration));
      if (t < duration) raf = requestAnimationFrame(loop);
    };
    paint(0);
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [run, entry, w, h, draw, duration]);
  return <canvas ref={ref} style={{ width: w, height: h, display: 'block', ...style }} />;
}

/* ~5 meses — a day-by-day activity grid from the tweet (10 abr 2026) to today, filling week by week. */
const WEEKS = 25, DAYS = 7, CELL = 24, GAP = 6, STEP = CELL + GAP;
const MONTHS: [string, number][] = [['abr', 0], ['may', 3], ['jun', 7], ['jul', 12], ['ago', 16], ['sep', 21]];
export const MONTHS_W = WEEKS * STEP - GAP, MONTHS_H = 380;
export const drawMonths: Draw = (x, t) => {
  const top = 60;
  x.font = '18px "Roboto Mono"'; x.textBaseline = 'alphabetic';
  x.fillStyle = 'rgba(255,255,255,.5)';
  MONTHS.forEach(([m, wk]) => x.fillText(m, wk * STEP, 36));
  const sweep = easeOut(t / 2200) * (WEEKS + 2);
  for (let wk = 0; wk < WEEKS; wk++) {
    for (let d = 0; d < DAYS; d++) {
      const px = wk * STEP, py = top + d * STEP;
      const since = sweep - wk - d / DAYS;
      if (since <= 0) { x.fillStyle = 'rgba(255,255,255,.04)'; x.fillRect(px, py, CELL, CELL); continue; }
      // activity grows over the months, with daily noise
      const growth = wk / WEEKS;
      const level = clamp01(0.15 + growth * 0.85 + (rng(0.31, wk * 7 + d) - 0.5) * 0.55);
      const lv = Math.ceil(level * 4);
      const pop = clamp01(since * 2);
      const s = CELL * (0.5 + 0.5 * pop), o = (CELL - s) / 2;
      x.fillStyle = lv <= 1 ? rgba(VIOLET, 0.22) : lv === 2 ? rgba(VIOLET, 0.45) : lv === 3 ? rgba(VIOLET, 0.72) : rgba(VIOLET, 1);
      x.fillRect(px + o, py + o, s, s);
    }
  }
  const ay = top + DAYS * STEP + 30;
  x.fillStyle = 'rgba(255,255,255,.14)'; x.fillRect(0, ay, MONTHS_W, 1);
  x.fillStyle = 'rgba(255,255,255,.5)';
  x.fillText('10 abr · el tweet', 0, ay + 34);
  const hoy = 'hoy'; x.fillText(hoy, MONTHS_W - x.measureText(hoy).width, ay + 34);
};

/* 900+ usuarios — 900 cells joining in growth order (slow first, then everyone at once). */
const UC = 36, UR = 25, US = 20, UCELL = 11;
export const USERS_W = UC * US - (US - UCELL), USERS_H = UR * US - (US - UCELL);
const USER_ORDER = (() => {
  const idx = Array.from({ length: UC * UR }, (_, i) => i);
  for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(rng(0.77, i) * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
  const rank = new Array(idx.length);
  idx.forEach((cell, k) => { rank[cell] = k; });
  return rank as number[];
})();
export const USERS_MS = 2600;
export const drawUsers: Draw = (x, t) => {
  const p = clamp01(t / USERS_MS);
  const joined = Math.pow(p, 2.2) * UC * UR; // growth curve
  for (let i = 0; i < UC * UR; i++) {
    const cx = (i % UC) * US, cy = Math.floor(i / UC) * US;
    const k = USER_ORDER[i];
    if (k >= joined) { x.fillStyle = 'rgba(255,255,255,.05)'; x.fillRect(cx, cy, UCELL, UCELL); continue; }
    const age = joined - k;
    x.fillStyle = age < 30 ? '#ffffff' : rgba(VIOLET, 0.85);
    x.fillRect(cx, cy, UCELL, UCELL);
  }
};

/* 80+ países — dithered world map scanning in, then 80 points lighting up. */
const WC = (world as { cols: number }).cols, WR = (world as { rows: number }).rows;
const LAND = (world as { land: number[][] }).land, PINS = (world as { pins: number[][] }).pins;
const WSTEP = 8.4, WDOT = 5.4;
export const MAP_W = Math.ceil(WC * WSTEP), MAP_H = Math.ceil(WR * WSTEP);
export const MAP_SCAN_MS = 1300, PINS_MS = 2000;
export const drawMap: Draw = (x, t) => {
  const scan = t / MAP_SCAN_MS;
  for (const [c, r] of LAND) {
    const th = c / WC * 0.8 + rng(0.5, c * 131 + r) * 0.2; // scan left→right with dither noise
    if (scan < th) continue;
    x.fillStyle = 'rgba(255,255,255,.2)';
    x.fillRect(c * WSTEP, r * WSTEP, WDOT, WDOT);
  }
  const lit = ((t - MAP_SCAN_MS) / PINS_MS) * PINS.length;
  PINS.forEach(([c, r], i) => {
    if (i >= lit) return;
    const age = (lit - i) / PINS.length * PINS_MS; // ms since this pin lit
    const px = c * WSTEP, py = r * WSTEP;
    x.fillStyle = rgba(VIOLET, 1);
    x.fillRect(px - 1.5, py - 1.5, WDOT + 3, WDOT + 3);
    if (age < 500) {
      const k = age / 500, sz = WDOT + 6 + k * 18;
      x.strokeStyle = rgba(VIOLET, 0.8 * (1 - k)); x.lineWidth = 1;
      x.strokeRect(px + WDOT / 2 - sz / 2, py + WDOT / 2 - sz / 2, sz, sz);
    }
  });
};

/* 10+ modelos — ten model blocks assembling from pixels, one after another. */
const MB = 132, MG = 24, MPX = 11;
export const MODELS_W = 5 * MB + 4 * MG, MODELS_H = 2 * MB + MG + 40;
export const MODELS_MS = 2200;
const PIX_ORDER = Array.from({ length: MPX * MPX }, (_, i) => rng(0.13, i));
const R = (MPX - 1) / 2;
const SHAPES: ((dx: number, dy: number) => boolean)[] = [
  (dx, dy) => Math.hypot(dx, dy) <= R * 0.75,                                   // disc
  (dx, dy) => Math.abs(dx) + Math.abs(dy) <= R * 0.9,                           // diamond
  (dx, dy) => Math.max(Math.abs(dx), Math.abs(dy)) <= R * 0.7 && Math.max(Math.abs(dx), Math.abs(dy)) >= R * 0.35, // frame
  (dx, dy) => Math.abs(dx) <= 1 || Math.abs(dy) <= 1,                           // cross
  (dx, dy) => dy >= -R * 0.7 && Math.abs(dx) <= (dy + R * 0.7) * 0.6,           // triangle
  (dx, dy) => Math.abs(Math.hypot(dx, dy) - R * 0.6) <= 0.9,                    // ring
  (_dx, dy) => Math.abs(dy) <= R * 0.7 && Math.round(dy) % 2 === 0,             // lines
  (dx, dy) => Math.abs(dx - dy) <= 1 || Math.abs(dx + dy) <= 1,                 // x
  (dx, dy) => Math.abs(dx) <= R * 0.7 && Math.abs(dy) <= R * 0.7 && (Math.round(dx) + Math.round(dy)) % 3 === 0, // grid
  (dx, dy) => dy >= 0 ? Math.hypot(dx, dy) <= R * 0.75 : Math.abs(dx) <= R * 0.25, // key
];
export const drawModels: Draw = (x, t) => {
  const cell = MB / MPX;
  for (let m = 0; m < 10; m++) {
    const bx = (m % 5) * (MB + MG), by = Math.floor(m / 5) * (MB + MG + 20);
    const p = clamp01((t - m * 180) / 520);
    x.strokeStyle = p >= 1 ? 'rgba(255,255,255,.35)' : 'rgba(255,255,255,.08)'; x.lineWidth = 1;
    x.strokeRect(bx + 0.5, by + 0.5, MB - 1, MB - 1);
    for (let i = 0; i < MPX * MPX; i++) {
      if (PIX_ORDER[(i + m * 17) % PIX_ORDER.length] > p) continue;
      const cx = i % MPX, cy = Math.floor(i / MPX);
      // each model has its own pixel glyph over a dithered ground — ten different things, not ten copies
      const solid = SHAPES[m](cx - (MPX - 1) / 2, cy - (MPX - 1) / 2);
      if (solid || (cx + cy) % 2 === 0) {
        x.fillStyle = solid ? rgba(VIOLET, 0.95) : rgba(VIOLET, 0.16);
        x.fillRect(bx + cx * cell + 1, by + cy * cell + 1, cell - 2, cell - 2);
      }
    }
    if (p >= 1) {
      x.font = '16px "Roboto Mono"'; x.fillStyle = 'rgba(255,255,255,.5)';
      x.fillText(String(m + 1).padStart(2, '0'), bx, by + MB + 22);
    }
  }
};

/* Q&A portrait — Cristian's photo from helmcode.com/about turns, dot by dot, into its 1-bit Helmcode dither. */
type Portrait = { w: number; h: number; px: Uint8ClampedArray; order: Float32Array; photo: HTMLImageElement };
let portrait: Portrait | null = null;
const loadImg = (src: string) => { const i = new Image(); i.src = src; return i.decode().then(() => i); };
Promise.all([loadImg(dither), loadImg(photoSrc)]).then(([d, photo]) => {
  const c = document.createElement('canvas');
  c.width = d.naturalWidth; c.height = d.naturalHeight;
  const x = c.getContext('2d')!;
  x.drawImage(d, 0, 0);
  const data = x.getImageData(0, 0, c.width, c.height).data;
  const order = new Float32Array(c.width * c.height);
  for (let i = 0; i < order.length; i++) {
    const cy = Math.floor(i / c.width);
    order[i] = cy / c.height * 0.6 + rng(0.9, i) * 0.4; // a slow top→bottom scan with dither noise
  }
  portrait = { w: c.width, h: c.height, px: data, order, photo };
}).catch(() => { /* images missing: the frame stays empty */ });

/** photo alone first, then the dither takes over */
export const PHOTO_HOLD_MS = 1100, DITHER_MS = 2200;
export const PORTRAIT_MS = PHOTO_HOLD_MS + DITHER_MS;
export const drawPortrait = (size: number): Draw => (x, t) => {
  if (!portrait) return;
  const { w, h, px, order, photo } = portrait;
  const p = clamp01((t - PHOTO_HOLD_MS) / DITHER_MS);
  if (p < 1) {
    x.globalAlpha = clamp01(t / 500);
    x.drawImage(photo, 0, 0, size, size);
    x.globalAlpha = 1;
  }
  const cell = size / w; // 400 / 100 = 4 px, crisp
  for (let i = 0; i < w * h; i++) {
    if (order[i] > p) continue;
    x.fillStyle = `rgb(${px[i * 4]},${px[i * 4 + 1]},${px[i * 4 + 2]})`;
    x.fillRect((i % w) * cell, Math.floor(i / w) * cell, cell, cell);
  }
};
