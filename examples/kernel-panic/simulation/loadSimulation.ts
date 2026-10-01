import { center, edgeGeo, worldRuntime, type Pt } from '../architecture/geometry';
import { userDot, type Route } from '../architecture/architecture-layouts';

/**
 * Requests travelling through the architecture world (05.6 → 07.5). Each packet follows the *current* wire
 * geometry of its route, so traffic stays glued to nodes while they move. On panic every packet falls (red).
 */
interface Pkt {
  pts: Pt[]; seg: number[]; len: number; d: number; v: number; tint?: 'violet';
  fall?: boolean; fp?: Pt; fvx?: number; fvy?: number;
}

export const PACKET_CAP = 600;
let packets: Pkt[] = [];
let spawnAcc = 0;
let shownAlpha = 1;
/** user dot → time it last sent a request (it flashes, the request starts on the wire) */
const userFlash = new Map<number, number>();

export const packetCount = () => packets.length;
export const clearPackets = () => { packets = []; spawnAcc = 0; };

function buildRoute(r: Route): Pkt | null {
  const pts: Pt[] = [];
  if (r.from === 'users') userFlash.set((Math.random() * worldRuntime.users) | 0, performance.now());
  // internet traffic drops in above DNS, clear of the chrome and the layer labels
  else pts.push({ x: 430 + Math.random() * 280, y: -10 });
  for (const id of r.edges) {
    const e = edgeGeo[id];
    if (!e || !e.on || e.pts.length < 2) return null;
    e.pts.forEach((p, j) => { if (j === 0 && pts.length > 1) return; pts.push(p); });
  }
  const seg: number[] = [];
  let len = 0;
  for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y); seg.push(l); len += l; }
  if (len < 10) return null;
  return { pts, seg, len, d: 0, v: 0, tint: r.tint };
}

function posAt(p: Pkt, d: number): Pt {
  let acc = 0;
  for (let i = 0; i < p.seg.length; i++) {
    if (acc + p.seg[i] >= d) {
      const t = (d - acc) / (p.seg[i] || 1), a = p.pts[i], b = p.pts[i + 1];
      return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
    }
    acc += p.seg[i];
  }
  return p.pts[p.pts.length - 1];
}

/** length of a packet pulse along its wire (px) */
const PULSE = 18;

/** Stroke the part of a packet's polyline between distances d0 and d1 (follows corners). */
function strokeAlong(x: CanvasRenderingContext2D, p: Pkt, d0: number, d1: number) {
  let acc = 0;
  x.beginPath();
  let started = false;
  for (let i = 0; i < p.seg.length; i++) {
    const a = p.pts[i], b = p.pts[i + 1], l = p.seg[i];
    const s0 = Math.max(d0, acc), s1 = Math.min(d1, acc + l);
    if (s1 > s0 && l > 0) {
      const t0 = (s0 - acc) / l, t1 = (s1 - acc) / l;
      if (!started) { x.moveTo(a.x + (b.x - a.x) * t0, a.y + (b.y - a.y) * t0); started = true; }
      x.lineTo(a.x + (b.x - a.x) * t1, a.y + (b.y - a.y) * t1);
    }
    acc += l;
    if (acc >= d1) break;
  }
  if (started) x.stroke();
}

export function drawArch(x: CanvasRenderingContext2D, dt: number) {
  const W = worldRuntime;
  const s = W.scene, b = W.beat;
  // follow the DOM world: dim quickly, come back only after the overlaid statement has left
  const target = W.worldOpacity;
  if (target < shownAlpha) shownAlpha = Math.max(target, shownAlpha - dt / 300);
  else if (performance.now() - W.changedAt > 320) shownAlpha = Math.min(target, shownAlpha + dt / 700);
  x.globalAlpha = shownAlpha;

  if (W.showUsers) {
    for (let i = 0; i < W.users; i++) {
      const d = userDot(i, W.cols, center('nginx').y, W.users);
      const fresh = s === 5 && i >= 25 && b === 0;
      const sent = performance.now() - (userFlash.get(i) ?? -1e9);
      x.fillStyle = W.panic ? '#ff5f56' : sent < 260 ? '#ffffff' : fresh ? '#818CF8' : 'rgba(255,255,255,.55)';
      x.fillRect(d.x - 3, d.y - 3, 6, 6);
    }
  }

  spawnAcc += (W.rate * dt) / 1000;
  while (spawnAcc >= 1 && W.routes.length) {
    spawnAcc--;
    if (packets.length >= PACKET_CAP) continue;
    const p = buildRoute(W.routes[(Math.random() * W.routes.length) | 0]);
    if (!p) continue;
    p.v = 0.34 + Math.random() * 0.1 - (s === 5 && b === 0 ? W.users / 1000 : 0);
    packets.push(p);
  }
  if (!W.routes.length) spawnAcc = 0;

  const next: Pkt[] = [];
  for (const p of packets) {
    if (W.panic) p.fall = true;
    if (p.fall) {
      if (!p.fp) { p.fp = posAt(p, p.d); p.fvy = -0.1 - Math.random() * 0.25; p.fvx = (Math.random() - 0.5) * 0.5; }
      p.fvy! += 0.003 * dt; p.fp.x += p.fvx! * dt; p.fp.y += p.fvy! * dt;
      x.fillStyle = '#ff5f56'; x.fillRect(p.fp.x - 3, p.fp.y - 3, 6, 6);
      if (p.fp.y < 1100) next.push(p);
      continue;
    }
    p.d += p.v * dt;
    if (p.d >= p.len) continue;
    // a packet is a short pulse of light travelling *on* the wire (no head, no tail)
    const q = posAt(p, p.d);
    const orange = s === 6 && q.y < 330;
    x.strokeStyle = orange ? '#F38020' : p.tint === 'violet' ? '#818CF8' : '#ffffff';
    x.lineWidth = 2.5;
    x.lineCap = 'butt';
    strokeAlong(x, p, Math.max(0, p.d - PULSE), p.d);
    next.push(p);
  }
  packets = next;
  x.globalAlpha = 1;
}
