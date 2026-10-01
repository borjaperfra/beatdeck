import { createContext, useContext } from 'react';
import { EASE, IN_DELAY } from './motion';
import type { Rect } from './Diagram';

/** Linear map from a data domain to stage pixels. */
export function scaleLinear([d0, d1]: [number, number], [r0, r1]: [number, number]) {
  return (v: number) => r0 + ((v - d0) / (d1 - d0)) * (r1 - r0);
}

export interface Axis {
  /** Data range shown on this axis. */
  domain: [number, number];
  /** Values that get a tick and a label. Only these numbers appear on stage. */
  ticks?: number[];
  /** Axis title (stage text, e.g. "extraction yield (%)"). */
  label?: string;
  /** Tick label text. Default: the number as written (`String(v)`). Pass e.g. `(v) => v.toLocaleString('es-ES')`. */
  format?: (v: number) => string;
}

export type ChartTone = 'accent' | 'warning' | 'fault' | 'ok' | 'ink';
const color = (t: ChartTone) => (t === 'ink' ? 'var(--ink-2)' : `var(--${t})`);

interface PlotCtx { rect: Rect; x: (v: number) => number; y: (v: number) => number; xd: [number, number]; yd: [number, number]; on: boolean }
const Ctx = createContext<PlotCtx | null>(null);

/** Scales and plot area of the enclosing `<Plot>`: `x(value)` / `y(value)` → stage px. */
export function usePlot(): PlotCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error('usePlot / Zone / Series / Marker / PlotLabel must be inside a <Plot>');
  return c;
}

const fade = (on: boolean, delay: number, ms = 500) => (on ? `opacity ${ms}ms ${EASE} ${IN_DELAY + delay}ms` : 'opacity 250ms');

/**
 * A chart area on the stage: `rect` is the plotting area (axes sit on its left and bottom edges).
 * The axes draw themselves when `on` turns true; ticks and labels follow. Children (Zone, Series, Marker,
 * PlotLabel) place things in data coordinates.
 *
 * ```tsx
 * <Plot rect={{ x: 1000, y: 200, w: 760, h: 620 }} on={here}
 *   x={{ domain: [14, 26], ticks: [18, 22], label: 'extraction yield (%)' }}
 *   y={{ domain: [0.9, 1.6], ticks: [1.15, 1.35], label: 'strength (TDS %)' }}>
 *   <Zone x={[18, 22]} y={[1.15, 1.35]} on={b >= 1} tone="accent" outline />
 *   <Zone x={[14, 18]} on={b >= 2} tone="warning" label="sour" />
 *   <Marker at={b >= 5 ? [20, 1.25] : [16, 1.25]} on={b >= 3} label="your cup" />
 * </Plot>
 * ```
 */
export function Plot({ rect, x, y, on, delay = 0, grid = false, children }: {
  rect: Rect; x: Axis; y: Axis; on: boolean; delay?: number; grid?: boolean; children?: React.ReactNode;
}) {
  const sx = scaleLinear(x.domain, [rect.x, rect.x + rect.w]);
  const sy = scaleLinear(y.domain, [rect.y + rect.h, rect.y]);
  const fx = x.format ?? String, fy = y.format ?? String;
  const d = IN_DELAY + delay;
  const draw = (on2: boolean, extra = 0) => ({
    strokeDasharray: 1, strokeDashoffset: on2 ? 0 : 1,
    transition: on2 ? `stroke-dashoffset 900ms ${EASE} ${d + extra}ms` : 'none',
  });
  const bottom = rect.y + rect.h;
  return (
    <Ctx.Provider value={{ rect, x: sx, y: sy, xd: x.domain, yd: y.domain, on }}>
      <svg className="layer" width={1920} height={1080} viewBox="0 0 1920 1080">
        <g style={{ opacity: on ? 1 : 0, transition: on ? 'opacity 1ms' : 'opacity 250ms' }}>
          {grid && [...(x.ticks ?? []).map((v) => `M${sx(v)} ${rect.y} V${bottom}`), ...(y.ticks ?? []).map((v) => `M${rect.x} ${sy(v)} H${rect.x + rect.w}`)].map((p) => (
            <path key={p} d={p} stroke="var(--hair)" strokeWidth={1} fill="none" style={{ opacity: on ? 1 : 0, transition: fade(on, delay + 600) }} />
          ))}
          <path d={`M${rect.x} ${rect.y} V${bottom}`} pathLength={1} stroke="var(--ink-2)" strokeWidth={2} fill="none" style={draw(on)} />
          <path d={`M${rect.x} ${bottom} H${rect.x + rect.w}`} pathLength={1} stroke="var(--ink-2)" strokeWidth={2} fill="none" style={draw(on, 150)} />
          {(x.ticks ?? []).map((v) => <path key={`xt${v}`} d={`M${sx(v)} ${bottom} v10`} stroke="var(--ink-2)" strokeWidth={2} style={{ opacity: on ? 1 : 0, transition: fade(on, delay + 500) }} />)}
          {(y.ticks ?? []).map((v) => <path key={`yt${v}`} d={`M${rect.x} ${sy(v)} h-10`} stroke="var(--ink-2)" strokeWidth={2} style={{ opacity: on ? 1 : 0, transition: fade(on, delay + 500) }} />)}
        </g>
      </svg>
      <div className="layer">
        {(x.ticks ?? []).map((v) => (
          <div key={`xl${v}`} className="bd-tick" style={{ left: sx(v), top: bottom + 18, transform: 'translateX(-50%)', opacity: on ? 1 : 0, transition: fade(on, delay + 600) }}>{fx(v)}</div>
        ))}
        {(y.ticks ?? []).map((v) => (
          <div key={`yl${v}`} className="bd-tick" style={{ left: rect.x - 18, top: sy(v), transform: 'translate(-100%, -50%)', opacity: on ? 1 : 0, transition: fade(on, delay + 600) }}>{fy(v)}</div>
        ))}
        {x.label && <div className="bd-axis-label" style={{ left: rect.x + rect.w, top: bottom + 56, transform: 'translateX(-100%)', opacity: on ? 1 : 0, transition: fade(on, delay + 700) }}>{x.label}</div>}
        {y.label && <div className="bd-axis-label" style={{ left: rect.x, top: rect.y - 44, opacity: on ? 1 : 0, transition: fade(on, delay + 700) }}>{y.label}</div>}
      </div>
      {children}
    </Ctx.Provider>
  );
}

/**
 * A shaded band or box in data coordinates. Omit `x` or `y` to span that axis's whole domain.
 * `outline` draws its border in the tone; `label` sits inside its top-left corner.
 */
export function Zone({ x, y, on, tone = 'accent', outline = false, label, delay = 0, opacity = 0.14 }: {
  x?: [number, number]; y?: [number, number]; on: boolean; tone?: ChartTone; outline?: boolean; label?: string;
  delay?: number; opacity?: number;
}) {
  const p = usePlot();
  const [x0, x1] = x ?? p.xd, [y0, y1] = y ?? p.yd;
  const left = p.x(x0), right = p.x(x1), top = p.y(y1), bot = p.y(y0);
  const vis = on && p.on;
  return (
    <>
      <svg className="layer" width={1920} height={1080} viewBox="0 0 1920 1080">
        <rect x={left} y={top} width={right - left} height={bot - top} fill={color(tone)} fillOpacity={opacity}
          stroke={outline ? color(tone) : 'none'} strokeWidth={2}
          style={{ opacity: vis ? 1 : 0, transition: fade(vis, delay, 700) }} />
      </svg>
      {label && (
        <div className="layer">
          <div className="bd-zone-label" style={{ left: left + 16, top: top + 14, color: color(tone), opacity: vis ? 1 : 0, transition: fade(vis, delay + 200) }}>{label}</div>
        </div>
      )}
    </>
  );
}

/** A line through data points that draws itself when `on` turns true. */
export function Series({ points, on, tone = 'accent', width = 3, delay = 0, ms = 1400, dashed = false }: {
  points: [number, number][]; on: boolean; tone?: ChartTone; width?: number; delay?: number; ms?: number; dashed?: boolean;
}) {
  const p = usePlot();
  const vis = on && p.on;
  const d = points.map(([a, b], i) => `${i ? 'L' : 'M'}${p.x(a)} ${p.y(b)}`).join(' ');
  return (
    <svg className="layer" width={1920} height={1080} viewBox="0 0 1920 1080">
      <path d={d} pathLength={1} fill="none" stroke={color(tone)} strokeWidth={width} strokeLinejoin="round"
        style={{
          strokeDasharray: dashed ? '0.012 0.012' : 1, strokeDashoffset: vis || dashed ? 0 : 1,
          opacity: vis ? 1 : 0,
          transition: vis ? `stroke-dashoffset ${ms}ms ${EASE} ${IN_DELAY + delay}ms, opacity 1ms ${IN_DELAY + delay}ms` : 'opacity 250ms',
        }} />
    </svg>
  );
}

/**
 * A dot at a data position. Change `at` from one beat to the next and it glides there (going back glides back).
 * `label` sits to its right (or left with `labelSide="left"`).
 */
export function Marker({ at, on, label, tone = 'ink', size = 18, labelSide = 'right', ms = 1000 }: {
  at: [number, number]; on: boolean; label?: string; tone?: ChartTone; size?: number; labelSide?: 'left' | 'right'; ms?: number;
}) {
  const p = usePlot();
  const vis = on && p.on;
  const c = tone === 'ink' ? 'var(--ink)' : color(tone);
  return (
    <div className="layer">
      <div style={{
        position: 'absolute', left: 0, top: 0, transform: `translate(${p.x(at[0])}px, ${p.y(at[1])}px)`,
        transition: `transform ${ms}ms ${EASE} ${IN_DELAY}ms, opacity 400ms`, opacity: vis ? 1 : 0,
      }}>
        <div style={{ position: 'absolute', left: -size / 2, top: -size / 2, width: size, height: size, borderRadius: '50%', background: c }} />
        {label && (
          <div className="bd-marker-label" style={labelSide === 'right' ? { left: size, top: 0 } : { right: size, top: 0 }}>{label}</div>
        )}
      </div>
    </div>
  );
}

/** Text at a data position. `anchor` aligns it horizontally on the point; `dx`/`dy` nudge it in px. */
export function PlotLabel({ at, on, anchor = 'start', dx = 0, dy = 0, delay = 0, className = 'bd-zone-label', style, children }: {
  at: [number, number]; on: boolean; anchor?: 'start' | 'middle' | 'end'; dx?: number; dy?: number; delay?: number;
  className?: string; style?: React.CSSProperties; children: React.ReactNode;
}) {
  const p = usePlot();
  const vis = on && p.on;
  const tx = anchor === 'middle' ? '-50%' : anchor === 'end' ? '-100%' : '0';
  return (
    <div className="layer">
      <div className={className} style={{
        left: p.x(at[0]) + dx, top: p.y(at[1]) + dy, transform: `translate(${tx}, -50%)`,
        opacity: vis ? 1 : 0, transition: fade(vis, delay), ...style,
      }}>{children}</div>
    </div>
  );
}
