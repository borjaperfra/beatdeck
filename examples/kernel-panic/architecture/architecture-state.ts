import {
  BOUNDARY_IDS, CF_NODES, EDGES, NODE_IDS, NODE_META, isGpu, layout,
  type BoundaryId, type EdgeDef, type NodeId, type Rect, type Route,
} from './architecture-layouts';

export type Status = 'ok' | 'warn' | 'fail';

export interface NodeState {
  id: NodeId;
  on: boolean;
  rect: Rect | null;
  delay: number;
  label: string;
  sub: string;
  /** dynamic sub text source: burned token counter (04.5) */
  subBurn: boolean;
  status: Status;
  gpu: boolean;
  cloudflare: boolean;
  /** GPU cores load 0–1 */
  load: number;
  photo: boolean;
  fontSize: number;
  subSize: number;
  pad: number;
  gap: number;
  coreH: number;
}

export interface EdgeState extends EdgeDef { on: boolean; delay: number }

export interface BoundaryState {
  id: BoundaryId;
  on: boolean;
  rect: Rect | null;
  label: string;
  handles: boolean;
  zone: boolean;
  status: Status;
  delay: number;
  tint: 'none' | 'cloudflare' | 'k8s';
}

export interface ArchitectureState {
  nodes: NodeState[];
  edges: EdgeState[];
  boundaries: BoundaryState[];
  routes: Route[];
  /** users block visible (05.5+ and 06) */
  users: number;
  showUsers: boolean;
  /** request spawn rate (packets / s) */
  rate: number;
  /** whole-world opacity (06.3 reyes magos dims it) */
  worldOpacity: number;
}

/** GPU load shown in the cores grid (v3 values). */
function gpuLoad(s: number, b: number, users: number): number {
  if (s === 3) return 0.62;
  if (s === 4) return b >= 5 ? 0.34 : 0.1;
  if (s === 5) return b === 0 ? 0.3 + ((users - 25) / 75) * 0.67 : b >= 3 ? 0.71 : 0.58;
  return 0.4;
}

/**
 * Pure function of the deck state → the architecture world for this beat.
 * `panic` is passed separately because the panic is a live sub-state of 06.6.
 */
export type WorldLive = { users: number; warnN: number; panic: boolean; black: boolean };

export function getArchitectureState(s: number, b: number, live: WorldLive): ArchitectureState {
  const users = live.users;
  const L = layout(s, b, users);
  const panic = live.panic;
  const warnOn = s === 5 && b === 4;
  const w = live.warnN;
  const load = gpuLoad(s, b, users);

  const nodes: NodeState[] = NODE_IDS.map((id) => {
    const rect = L.P[id] ?? null;
    const on = !!rect && !live.black;
    const h = rect ? rect[3] : 120;
    const gpu = isGpu(id);
    let status: Status = 'ok';
    if (panic && on) status = 'fail';
    else if (warnOn) {
      // 1 single point of failure → the only proxy/gateway · 2 deploy downtime → every inference engine ·
      // 3 server_01 does everything → its GPU
      if (w >= 1 && (id === 'nginx' || id === 'litellm')) status = 'warn';
      if (w >= 2 && id.startsWith('vllm')) status = 'warn';
      if (w >= 3 && id === 'gpu1') status = 'warn';
    }
    let label: string = NODE_META[id].label;
    let sub: string = NODE_META[id].sub;
    if (id === 'litellm' && s === 6) { label = 'LiteLLM (Fork)'; sub = 'gateway · fork'; }
    if (id === 'gpu1' && s === 4 && b === 0) sub = 'nuestra primera gpu';
    else if (id === 'gpu1' && (s === 4 || s === 5)) sub = `qwencito · load ${Math.min(99, Math.round(load * 100))}%`;
    const nodeW = rect ? rect[2] : 300;
    if (id.startsWith('vllm') && nodeW < 260 && sub === 'inference engine') sub = 'inference';
    if (status === 'fail') sub = 'unreachable';
    const photo = L.photo === id;
    return {
      id, on, rect, delay: rect ? L.D[id] ?? 0 : 0, label, sub,
      subBurn: id === 'gpu1' && s === 3 && status !== 'fail',
      status, gpu, cloudflare: CF_NODES.includes(id),
      load: id === 'gpu1' ? load : 0.5,
      photo,
      fontSize: gpu ? (h >= 400 ? 76 : h >= 250 ? 46 : h >= 140 ? 34 : 30) : h >= 270 ? 48 : h >= 200 ? 38 : h >= 140 ? 32 : 30,
      subSize: h >= 400 ? 26 : nodeW < 240 ? 18 : 20,
      pad: h >= 400 ? 48 : 22,
      gap: h >= 400 ? 26 : 10,
      coreH: photo ? 0 : h >= 400 ? 26 : h >= 250 ? 14 : 6,
    };
  });

  const edges: EdgeState[] = EDGES.map((e) => {
    const on = !live.black && L.E.has(e.id) && (e.from === 'U' || !!L.P[e.from as NodeId]) && !!L.P[e.to];
    return { ...e, on, delay: on ? L.ED[e.id] ?? 300 : 0 };
  });

  const boundaries: BoundaryState[] = BOUNDARY_IDS.map((id) => {
    const f = L.F[id];
    const zone = id === 'cf' || id === 'k8s';
    const warn = warnOn && id === 's01' && w >= 3;
    return {
      id, on: !!f && !live.black, rect: f ? [f[0], f[1], f[2], f[3]] : null, label: f ? f[4] : '',
      handles: !!L.H[id], zone,
      status: panic && f ? 'fail' : warn ? 'warn' : 'ok',
      delay: f && s === 5 && ((id === 's02' && b === 1) || (id === 's03' && b === 3)) ? 150 : 0,
      tint: id === 'cf' ? 'cloudflare' : id === 'k8s' ? 'k8s' : 'none',
    };
  });

  const showUsers = !live.black && ((s === 4 && b >= 4) || s === 5);
  const rate = panic || !L.routes.length || live.black ? 0
    : s === 4 ? 2 : s === 5 ? (b === 0 ? users / 7 : 14 + b * 2) : 10;

  return {
    nodes, edges, boundaries, routes: L.routes,
    users: s === 4 ? 25 : users, showUsers, rate,
    worldOpacity: s === 5 && b === 2 ? 0.08 : 1,
  };
}
