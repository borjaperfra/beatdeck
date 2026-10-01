import { memo } from 'react';
import type { BoundaryState } from './architecture-state';

/** Server frame (dashed) or platform layer (solid). Geometry is written by ArchitectureWorld. */
export const ArchitectureBoundary = memo(function ArchitectureBoundary({ f, setRef }: { f: BoundaryState; setRef: (el: HTMLDivElement | null) => void }) {
  const bc = f.status === 'fail' ? 'var(--fault)' : f.status === 'warn' ? 'var(--warning)'
    : f.tint === 'cloudflare' ? 'rgba(243,128,32,.6)' : f.zone ? 'rgba(255,255,255,.35)' : 'rgba(255,255,255,.2)';
  const bg = f.tint === 'cloudflare' && !f.handles ? 'rgba(243,128,32,.035)' : f.tint === 'k8s' && !f.handles ? 'rgba(255,255,255,.015)' : 'transparent';
  const handle = (pos: React.CSSProperties) => (
    <div style={{ position: 'absolute', width: 7, height: 7, background: bc, opacity: f.handles ? 1 : 0, transition: 'opacity 300ms', ...pos }} />
  );
  return (
    <div
      ref={setRef}
      style={{
        position: 'absolute', left: 0, top: 0, opacity: 0,
        border: `1px ${f.zone ? 'solid' : 'dashed'} ${bc}`, background: bg,
        transition: 'border-color 300ms, background 600ms',
      }}
    >
      <div className="t-system" style={{ position: 'absolute', left: -1, top: -36, fontSize: 22, color: f.status === 'warn' ? 'var(--warning)' : 'rgba(255,255,255,.55)', whiteSpace: 'nowrap' }}>
        {f.label}
      </div>
      {handle({ left: -4, top: -4 })}
      {handle({ right: -4, top: -4 })}
      {handle({ left: -4, bottom: -4 })}
      {handle({ right: -4, bottom: -4 })}
    </div>
  );
});
