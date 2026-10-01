import { memo, useSyncExternalStore } from 'react';
import type { NodeState } from './architecture-state';
import { burnCounter } from '../simulation/burnCounter';
import { rng } from 'beatdeck';
import { GpuDrawing } from './GpuDrawing';

const CORES = 48;

function border(n: NodeState) {
  if (n.status === 'fail') return 'var(--fault)';
  if (n.status === 'warn') return 'var(--warning)';
  if (n.cloudflare) return 'rgba(243,128,32,.85)';
  if (n.gpu) return 'rgba(73,52,225,.75)';
  return 'rgba(255,255,255,.16)';
}

const statusColor = (n: NodeState) =>
  n.status === 'fail' ? 'var(--fault)' : n.status === 'warn' ? 'var(--warning)' : 'rgba(255,255,255,.6)';
const dotColor = (n: NodeState) =>
  n.status === 'fail' ? 'var(--fault)' : n.status === 'warn' ? 'var(--warning)' : 'var(--ok)';

function BurnSub() {
  const v = useSyncExternalStore(burnCounter.subscribe, burnCounter.get);
  return <>{v.toLocaleString('es-ES')} tokens</>;
}

function Cores({ n }: { n: NodeState }) {
  // during the burn the cores flicker with the token intake; elsewhere a stable load pattern
  const tick = useSyncExternalStore(burnCounter.subscribe, burnCounter.tick);
  const f = n.load;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(16,1fr)', gap: 3, opacity: n.photo ? 0 : 1, transition: 'opacity 600ms' }}>
      {Array.from({ length: CORES }, (_, c) => {
        const on = n.subBurn ? rng(tick * 0.001 + 0.5, c) < f : (c * 0.618034) % 1 < f;
        const bg = n.status === 'fail' ? (c % 3 ? '#2a1010' : 'var(--fault)') : on ? (f > 0.9 ? 'var(--warning)' : 'var(--violet-text)') : 'rgba(129,140,248,.14)';
        return <span key={c} style={{ height: n.coreH, background: bg, transition: 'background 250ms, height 1000ms var(--ease)' }} />;
      })}
    </div>
  );
}

/** One architecture component. Position/size are written imperatively by ArchitectureWorld (GSAP); this renders content only. */
export const ArchitectureNode = memo(function ArchitectureNode({ n, lag, setRef }: { n: NodeState; lag: number; setRef: (el: HTMLDivElement | null) => void }) {
  // content resizes together with the box (the box may start late: node delay + scene wait)
  const L = `${lag}ms`;
  return (
    <div
      ref={setRef}
      className="arch-node"
      style={{
        position: 'absolute', left: 0, top: 0, opacity: 0,
        background: 'var(--surface)', border: `1px solid ${border(n)}`,
        padding: `0 ${n.pad}px`, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: n.gap,
        overflow: 'hidden', transition: `border-color 300ms, padding 1000ms var(--ease) ${L}, gap 1000ms var(--ease) ${L}`,
        willChange: 'transform',
      }}
    >
      <div style={{ fontWeight: 500, fontSize: n.fontSize, letterSpacing: '-0.02em', lineHeight: 1, color: '#fff', whiteSpace: 'nowrap', transition: `font-size 1000ms var(--ease) ${L}` }}>
        {n.label}
      </div>
      {n.gpu && n.id === 'gpu1' && (
        <div
          style={{
            height: n.photo ? 380 : 0, opacity: n.photo ? 1 : 0, margin: n.photo ? '10px 0' : 0,
            transition: `height 1000ms var(--ease) ${L}, opacity ${n.photo ? 500 : 300}ms ${n.photo ? L : '0ms'}, margin 1000ms var(--ease) ${L}`,
          }}
        >
          <GpuDrawing on={n.photo} />
        </div>
      )}
      {n.gpu && <Cores n={n} />}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'var(--font-mono)', fontSize: n.subSize, color: statusColor(n), whiteSpace: 'nowrap', transition: 'color 300ms' }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: dotColor(n), flex: 'none' }} />
        <span>{n.subBurn ? <BurnSub /> : n.sub}</span>
      </div>
    </div>
  );
});
