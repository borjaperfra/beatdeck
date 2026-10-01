import { EASE, IN_DELAY } from './motion';

/** A rectangle on the 1920×1080 stage. */
export interface Rect { x: number; y: number; w: number; h: number }

export type NodeTone = 'normal' | 'hot' | 'dim' | 'ghost';

/**
 * A diagram node: hairline box, small mono `kind` on top, the value (or children) below.
 * `hot` = accent border (the point of this beat) · `dim` = context · `ghost` = dashed (gone, unnamed, planned).
 * Appears after the space is free (IN_DELAY + delay); leaves fast.
 */
export function NodeBox({ rect, on, kind, value, tone = 'normal', delay = 0, children, style }: {
  rect: Rect; on: boolean; kind?: string; value?: React.ReactNode; tone?: NodeTone; delay?: number;
  children?: React.ReactNode; style?: React.CSSProperties;
}) {
  const d = IN_DELAY + delay;
  return (
    <div
      className={`bd-node ${tone}`}
      style={{
        left: rect.x, top: rect.y, width: rect.w, height: rect.h,
        opacity: on ? 1 : 0, transform: `scale(${on ? 1 : 0.95})`,
        transition: on
          ? `opacity 600ms ${EASE} ${d}ms, transform 900ms ${EASE} ${d}ms, border-color 400ms, color 400ms`
          : 'opacity 250ms, transform 250ms, border-color 400ms, color 400ms',
        ...style,
      }}
    >
      {kind && <div className="bd-node-kind">{kind}</div>}
      {value != null && <div className="bd-node-value">{value}</div>}
      {children}
    </div>
  );
}

/** Point where the segment from the centre of `r` towards (px, py) leaves the rectangle. */
export function rectExit(r: Rect, px: number, py: number) {
  const cx = r.x + r.w / 2, cy = r.y + r.h / 2;
  const dx = px - cx, dy = py - cy;
  const t = Math.min(dx ? r.w / 2 / Math.abs(dx) : Infinity, dy ? r.h / 2 / Math.abs(dy) : Infinity);
  return { x: cx + dx * t, y: cy + dy * t };
}

type Pt = { x: number; y: number };
const centre = (r: Rect): Pt => ({ x: r.x + r.w / 2, y: r.y + r.h / 2 });

/**
 * A connector between two rects (or points), clipped to their borders, drawn on entry.
 * `head`: arrowhead at the `to` end (default true). `flow`: a slow dashed current along it while on
 * (stopped by `.capture` / `.reduced-motion`). `label` sits at the midpoint, offset by (lx, ly).
 * Each Arrow is its own full-stage SVG layer, so arrows compose freely with HTML nodes.
 */
export function Arrow({ from, to, on, tone = 'normal', head = true, flow = false, label, lx = 0, ly = -14,
  labelAnchor = 'middle', delay = 0, gap = 8 }: {
  from: Rect | Pt; to: Rect | Pt; on: boolean; tone?: NodeTone; head?: boolean; flow?: boolean; label?: string;
  lx?: number; ly?: number; labelAnchor?: 'start' | 'middle' | 'end'; delay?: number; gap?: number;
}) {
  const isRect = (v: Rect | Pt): v is Rect => 'w' in v;
  const ca = isRect(from) ? centre(from) : from;
  const cz = isRect(to) ? centre(to) : to;
  const a = isRect(from) ? rectExit(from, cz.x, cz.y) : from;
  const z = isRect(to) ? rectExit(to, ca.x, ca.y) : to;
  const len = Math.hypot(z.x - a.x, z.y - a.y) || 1;
  const ux = (z.x - a.x) / len, uy = (z.y - a.y) / len;
  const s = { x: a.x + ux * gap, y: a.y + uy * gap };
  const e = { x: z.x - ux * gap, y: z.y - uy * gap };
  const hl = head ? 16 : 0, hw = 8;
  const bx = e.x - ux * hl, by = e.y - uy * hl;
  const pts = `${e.x},${e.y} ${bx - uy * hw},${by + ux * hw} ${bx + uy * hw},${by - ux * hw}`;
  const color = tone === 'hot' ? 'var(--accent)' : tone === 'dim' || tone === 'ghost' ? 'var(--ink-3)' : 'var(--ink-2)';
  const ghost = tone === 'ghost';
  const d = IN_DELAY + delay;
  const path = `M${s.x} ${s.y} L${bx} ${by}`;
  return (
    <svg className="layer" width={1920} height={1080} viewBox="0 0 1920 1080" style={{ overflow: 'visible' }}>
      <g style={{ opacity: on ? 1 : 0, transition: on ? `opacity 1ms linear ${d}ms` : 'opacity 250ms' }}>
        <path
          d={path} pathLength={1} fill="none" stroke={color} strokeWidth={tone === 'hot' ? 3 : 2}
          style={{
            strokeDasharray: ghost ? '0.03 0.03' : 1,
            strokeDashoffset: on || ghost ? 0 : 1,
            transition: on ? `stroke-dashoffset 700ms ${EASE} ${d}ms, stroke 400ms` : 'stroke 400ms',
          }}
        />
        {flow && <path d={path} fill="none" stroke="var(--accent)" strokeWidth={2} className="bd-flow" style={{ opacity: on ? 1 : 0, transition: `opacity 400ms ease ${d + 900}ms` }} />}
        {head && <polygon points={pts} fill={color} style={{ opacity: on ? 1 : 0, transition: on ? `opacity 200ms ease ${d + 600}ms, fill 400ms` : 'none' }} />}
        {label && (
          <text
            x={(s.x + e.x) / 2 + lx} y={(s.y + e.y) / 2 + ly} className="bd-arrow-label"
            fill={tone === 'hot' ? 'var(--accent)' : 'var(--ink-2)'} textAnchor={labelAnchor}
            style={{ opacity: on ? 1 : 0, transition: on ? `opacity 400ms ease ${d + 500}ms, fill 400ms` : 'none' }}
          >
            {label}
          </text>
        )}
      </g>
    </svg>
  );
}
