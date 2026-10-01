import { USER_GAP, type EdgeShape, type Route } from './architecture-layouts';

export interface Pt { x: number; y: number }

/** Animated geometry of the architecture world. GSAP tweens these objects; one ticker writes them to the DOM. */
export interface NodeGeo { x: number; y: number; w: number; h: number; o: number; placed: boolean }
export interface EdgeGeo { pts: Pt[]; len: number; draw: number; on: boolean }

export const nodeGeo: Record<string, NodeGeo> = {};
export const boundaryGeo: Record<string, NodeGeo> = {};
export const edgeGeo: Record<string, EdgeGeo> = {};

export const getNodeGeo = (id: string) => (nodeGeo[id] ??= { x: 960, y: 540, w: 260, h: 120, o: 0, placed: false });
export const getBoundaryGeo = (id: string) => (boundaryGeo[id] ??= { x: 0, y: 0, w: 0, h: 0, o: 0, placed: false });

/** Runtime values the canvas needs from the world (set by ArchitectureWorld on every beat/live change). */
export const worldRuntime = {
  scene: -1,
  beat: -1,
  routes: [] as Route[],
  rate: 0,
  users: 25,
  cols: 10,
  showUsers: false,
  panic: false,
  worldOpacity: 1,
  /** performance.now() of the last beat change (canvas uses it to follow the DOM world's fades) */
  changedAt: 0,
};

export function center(id: string): Pt {
  if (id === 'U') {
    const n = center('nginx');
    return { x: 120 + (worldRuntime.cols - 1) * USER_GAP + 24, y: n.y };
  }
  const g = nodeGeo[id];
  if (!g) return { x: 960, y: 540 };
  return { x: g.x + g.w / 2, y: g.y + g.h / 2 };
}

export function edgePoints(from: string, to: string, shape: EdgeShape): Pt[] {
  const A = center(from), B = center(to);
  switch (shape) {
    case 'V': return [A, { x: A.x, y: B.y }, B];
    case 'H': return [A, { x: B.x, y: A.y }, B];
    case 'Z': { const my = (A.y + B.y) / 2; return [A, { x: A.x, y: my }, { x: B.x, y: my }, B]; }
    case 'DOWN_RIGHT_UP': {
      // leave the source from its lower half, run in the gutter under its row, rise into the target
      const g = nodeGeo[from], t = nodeGeo[to];
      const x0 = A.x + (g ? g.w * 0.25 : 60);
      const gy = (g ? g.y + g.h : A.y) + 35;
      const ty = t ? t.y + t.h : B.y;
      return [{ x: x0, y: A.y }, { x: x0, y: gy }, { x: B.x, y: gy }, { x: B.x, y: Math.min(B.y, ty) }];
    }
    case 'UP_LEFT_DOWN': {
      // leave the source through its top edge, run in the gutter above its row, drop into the target
      const g = nodeGeo[from], t = nodeGeo[to];
      const x0 = g ? g.x + g.w * 0.2 : A.x;
      const gy = (g ? g.y : A.y) - 35;
      const ty = t ? t.y : B.y;
      return [{ x: x0, y: g ? g.y : A.y }, { x: x0, y: gy }, { x: B.x, y: gy }, { x: B.x, y: ty }];
    }
    default: return [A, B];
  }
}

export function polyLen(pts: Pt[]): number {
  let l = 0;
  for (let i = 1; i < pts.length; i++) l += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
  return l;
}

export const pathD = (pts: Pt[]) => (pts.length ? 'M' + pts.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' L') : '');
