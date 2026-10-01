/**
 * The persistent architecture world: every component has one stable ID from its first appearance (04.5 burn GPU)
 * to the rebuilt platform (07.5). Positions are v3's; scene 07 is re-gridded so every source component of slide 22
 * fits without wires crossing boxes.
 */

export type Rect = [x: number, y: number, w: number, h: number];

export const NODE_META = {
  nginx: { label: 'Nginx', sub: 'reverse proxy' },
  litellm: { label: 'LiteLLM', sub: 'gateway' },
  vllm1: { label: 'vLLM', sub: 'inference engine' },
  gpu1: { label: 'RTX 6000 PRO', sub: 'qwencito' },
  vllm2: { label: 'vLLM', sub: 'inference engine' },
  gpu2: { label: 'RTX 6000 PRO', sub: 'qwencito' },
  vllm3: { label: 'vLLM', sub: 'inference engine' },
  gpu3: { label: 'RTX 6000 PRO', sub: 'gemma4' },
  // 07 — Cloudflare layer (slide 22)
  dns: { label: 'DNS', sub: 'cloudflare' },
  tunnel: { label: 'Cloudflared', sub: 'tunnel' },
  routes: { label: 'Rutas', sub: 'routing' },
  workers: { label: 'Workers', sub: 'edge' },
  // 07 — Kubernetes layer (slide 22)
  kcfd: { label: 'Cloudflared', sub: 'connector' },
  traefik: { label: 'Traefik', sub: 'ingress' },
  api: { label: 'api.nan.builders', sub: 'api' },
  cnpg: { label: 'CNPG', sub: 'postgres' },
  valkey: { label: 'Valkey', sub: 'cache' },
  grafana: { label: 'Grafana', sub: 'dashboards' },
  vm: { label: 'Victoria Metrics', sub: 'metrics' },
} as const;

export type NodeId = keyof typeof NODE_META;
export const NODE_IDS = Object.keys(NODE_META) as NodeId[];
export const CF_NODES: NodeId[] = ['dns', 'tunnel', 'routes', 'workers'];
export const isGpu = (id: string) => id.startsWith('gpu');

export type BoundaryId = 's01' | 's02' | 's03' | 'cf' | 'k8s';
export const BOUNDARY_IDS: BoundaryId[] = ['s01', 's02', 's03', 'cf', 'k8s'];

/**
 * Edge shapes: S straight · V vertical-then-horizontal · H horizontal-then-vertical · Z vertical elbow ·
 * or explicit orthogonal waypoints computed from the live node rects.
 * `implied`: relationship not drawn in the source (slide 22 has no arrows) — rendered dashed and dim.
 * See docs/CONTENT-AUDIT.md, ambiguity A1.
 */
export type EdgeShape = 'S' | 'V' | 'H' | 'Z' | 'DOWN_RIGHT_UP' | 'UP_LEFT_DOWN';
export interface EdgeDef {
  id: string;
  from: NodeId | 'U';
  to: NodeId;
  shape: EdgeShape;
  implied?: boolean;
  cloudflare?: boolean;
}

export const EDGES: EdgeDef[] = [
  { id: 'users', from: 'U', to: 'nginx', shape: 'S' },
  { id: 'nginx_litellm', from: 'nginx', to: 'litellm', shape: 'S' },
  { id: 'litellm_vllm1', from: 'litellm', to: 'vllm1', shape: 'S' },
  { id: 'vllm1_gpu1', from: 'vllm1', to: 'gpu1', shape: 'S' },
  { id: 'litellm_vllm2', from: 'litellm', to: 'vllm2', shape: 'V' },
  { id: 'vllm2_gpu2', from: 'vllm2', to: 'gpu2', shape: 'S' },
  { id: 'litellm_vllm3', from: 'litellm', to: 'vllm3', shape: 'V' },
  { id: 'vllm3_gpu3', from: 'vllm3', to: 'gpu3', shape: 'S' },
  // 07 request path (clients call https://api.nan.builders/v1, per the NaN docs):
  // DNS → Cloudflared tunnel → cloudflared (cluster) → Traefik → api.nan.builders → LiteLLM (Fork) → vLLM
  { id: 'dns_tunnel', from: 'dns', to: 'tunnel', shape: 'S', cloudflare: true },
  { id: 'tunnel_kcfd', from: 'tunnel', to: 'kcfd', shape: 'S', cloudflare: true },
  { id: 'kcfd_traefik', from: 'kcfd', to: 'traefik', shape: 'S' },
  { id: 'traefik_api', from: 'traefik', to: 'api', shape: 'S' },
  { id: 'api_litellm', from: 'api', to: 'litellm', shape: 'S' },
  { id: 'k_litellm_vllm', from: 'litellm', to: 'vllm1', shape: 'S' },
  // 07 supporting relationships (implied; the source shows components only)
  { id: 'litellm_cnpg', from: 'litellm', to: 'cnpg', shape: 'S', implied: true },
  { id: 'litellm_valkey', from: 'litellm', to: 'valkey', shape: 'UP_LEFT_DOWN', implied: true },
  { id: 'vllm_vm', from: 'vllm1', to: 'vm', shape: 'S', implied: true },
  { id: 'vm_grafana', from: 'vm', to: 'grafana', shape: 'S', implied: true },
];

/** A route is the list of edges a packet travels, from its source. `top` = enters from above (internet). */
export type Route = { from: 'users' | 'top'; edges: string[]; tint?: 'violet' };

export interface Layout {
  P: Partial<Record<NodeId, Rect>>;
  E: Set<string>;
  F: Partial<Record<BoundaryId, [...Rect, string]>>;
  /** node entry delays (ms) */
  D: Partial<Record<NodeId, number>>;
  /** edge draw delays (ms) */
  ED: Record<string, number>;
  routes: Route[];
  /** boundaries showing their corner handles (selection-box look of 07.2) */
  H: Partial<Record<BoundaryId, 1>>;
  /** node showing the real product photo (05.1) */
  photo?: NodeId;
}

/** Users block geometry (dots drawn on the canvas). */
export function userCols(_s?: number, _b?: number, _users?: number) {
  return 10;
}
export const USER_GAP = 26;
export const userDot = (i: number, cols: number, cy = 540, n = 25) => {
  const rows = Math.ceil(n / cols);
  return { x: 120 + (i % cols) * USER_GAP, y: cy - ((rows - 1) * USER_GAP) / 2 + Math.floor(i / cols) * USER_GAP };
};

const R1 = ['users', 'nginx_litellm', 'litellm_vllm1', 'vllm1_gpu1'];
const R2 = ['users', 'nginx_litellm', 'litellm_vllm2', 'vllm2_gpu2'];
const R3 = ['users', 'nginx_litellm', 'litellm_vllm3', 'vllm3_gpu3'];

/** Pure: (scene, beat, users) → target layout. 0-based scene/beat. */
export function layout(s: number, b: number, _users: number): Layout {
  const P: Layout['P'] = {}, E = new Set<string>(), F: Layout['F'] = {}, D: Layout['D'] = {}, ED: Layout['ED'] = {};
  const routes: Route[] = [], H: Layout['H'] = {};
  let photo: NodeId | undefined;
  const A = (id: NodeId, x: number, y: number, w: number, h: number) => { P[id] = [x, y, w, h]; };
  const route = (edges: string[], tint?: 'violet') => routes.push({ from: 'users', edges: edges.slice(1), tint });

  // 04.5–04.6 the burn GPU
  if (s === 3 && b >= 3) {
    if (b === 3) A('gpu1', 1480, 660, 340, 250);
    else A('gpu1', 1400, 520, 400, 320);
  }

  // 05 the first machine, assembled live
  if (s === 4) {
    if (b === 0) { A('gpu1', 560, 200, 800, 620); photo = 'gpu1'; }
    if (b === 1) { A('gpu1', 1000, 280, 780, 480); A('vllm1', 400, 380, 440, 280); E.add('vllm1_gpu1'); }
    if (b === 2) {
      A('gpu1', 1180, 320, 600, 400); A('vllm1', 790, 380, 300, 280); A('litellm', 400, 380, 300, 280);
      ['vllm1_gpu1', 'litellm_vllm1'].forEach((e) => E.add(e));
    }
    if (b === 3) {
      A('gpu1', 1340, 360, 440, 320); A('vllm1', 1000, 400, 260, 240); A('litellm', 660, 400, 260, 240); A('nginx', 320, 400, 260, 240);
      ['vllm1_gpu1', 'litellm_vllm1', 'nginx_litellm'].forEach((e) => E.add(e));
    }
    if (b >= 4) {
      // 40px lower than 05.4: the machine makes room for the users counter
      A('gpu1', 1440, 420, 360, 280); A('vllm1', 1170, 440, 220, 240); A('litellm', 900, 440, 220, 240); A('nginx', 630, 440, 220, 240);
      F.s01 = [590, 370, 1250, 380, 'server_01'];
      ['vllm1_gpu1', 'litellm_vllm1', 'nginx_litellm'].forEach((e) => E.add(e));
      if (b === 5) { E.add('users'); route(R1); }
    }
    if (b >= 1) ED.vllm1_gpu1 = 500;
    if (b >= 2) ED.litellm_vllm1 = 500;
    if (b >= 3) ED.nginx_litellm = 500;
  }

  // 06 scale
  if (s === 5) {
    ['vllm1_gpu1', 'litellm_vllm1', 'nginx_litellm', 'users'].forEach((e) => E.add(e));
    route(R1);
    if (b === 0) {
      // the machine keeps its size: the pressure shows as load (GPU cores, traffic), not as a shrinking server
      A('gpu1', 1440, 420, 360, 280); A('vllm1', 1170, 440, 220, 240); A('litellm', 900, 440, 220, 240); A('nginx', 630, 440, 220, 240);
      F.s01 = [590, 370, 1250, 380, 'server_01'];
    } else {
      const three = b >= 3;
      const y1 = three ? 450 : 400, h = three ? 150 : 170;
      A('nginx', 620, y1, 230, h); A('litellm', 880, y1, 230, h); A('vllm1', 1140, y1, 230, h); A('gpu1', 1400, y1, 400, h);
      F.s01 = [580, y1 - 40, 1260, h + 80, 'server_01'];
      const y2 = three ? 730 : 740;
      A('vllm2', 1140, y2, 230, h); A('gpu2', 1400, y2, 400, h);
      F.s02 = [1100, y2 - 40, 740, h + 80, 'server_02'];
      E.add('litellm_vllm2'); E.add('vllm2_gpu2'); route(R2);
      if (b === 1) { D.vllm2 = 300; D.gpu2 = 420; ED.litellm_vllm2 = 700; ED.vllm2_gpu2 = 900; }
      if (three) {
        A('vllm3', 1140, 170, 230, h); A('gpu3', 1400, 170, 400, h);
        F.s03 = [1100, 130, 740, h + 80, 'server_03'];
        E.add('litellm_vllm3'); E.add('vllm3_gpu3'); route(R3, 'violet');
        if (b === 3) { D.vllm3 = 300; D.gpu3 = 420; ED.litellm_vllm3 = 700; ED.vllm3_gpu3 = 900; }
      }
    }
  }

  // 07 rebuild: the words become the layers, services land inside
  if (s === 6 && b >= 1) {
    // labels stay empty: the CLOUDFLARE / KUBERNETES words themselves shrink into the layer labels (07 layer)
    F.cf = b === 1 ? [130, 270, 1000, 180, ''] : [160, 130, 1600, 190, ''];
    F.k8s = b <= 2 ? [130, 590, 1000, 180, ''] : [160, 400, 1600, 600, ''];
    if (b === 1) { H.cf = 1; H.k8s = 1; }
    if (b === 2) H.k8s = 1;
  }
  const W = 320, NH = 100, COL = [220, 613, 1006, 1400];
  if (s === 6 && b >= 2) {
    (['dns', 'tunnel', 'routes', 'workers'] as NodeId[]).forEach((id, i) => { A(id, COL[i], 175, W, NH); D[id] = 450 + i * 110; });
    E.add('dns_tunnel'); ED.dns_tunnel = 1000;
  }
  if (s === 6 && b >= 3) {
    // a staircase that reads as the request's path: in from the tunnel, right along the ingress, down the API column
    const k: [NodeId, number, number][] = [
      ['kcfd', COL[1], 450], ['traefik', COL[2], 450], ['api', COL[3], 450],
      ['litellm', COL[3], 620], ['cnpg', COL[2], 620], ['valkey', COL[1], 620],
      ['vllm1', COL[3], 790], ['vm', COL[2], 790], ['grafana', COL[1], 790],
    ];
    k.forEach(([id, x, y], i) => { A(id, x, y, W, NH); D[id] = 450 + i * 90; });
    ['tunnel_kcfd', 'kcfd_traefik', 'traefik_api', 'api_litellm', 'k_litellm_vllm', 'litellm_cnpg', 'litellm_valkey', 'vllm_vm', 'vm_grafana']
      .forEach((id, i) => { E.add(id); ED[id] = 1300 + i * 90; });
  }
  if (s === 6 && b >= 4) {
    const main = ['dns_tunnel', 'tunnel_kcfd', 'kcfd_traefik', 'traefik_api', 'api_litellm', 'k_litellm_vllm'];
    routes.push({ from: 'top', edges: main }, { from: 'top', edges: main }, { from: 'top', edges: main });
  }

  return { P, E, F, D, ED, routes, H, photo };
}
