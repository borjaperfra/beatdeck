import { memo } from 'react';
import type { EdgeState } from './architecture-state';

/** A wire. Its path `d` and draw-in dash are written every frame by ArchitectureWorld from the animated node rects. */
export const ArchitectureEdge = memo(function ArchitectureEdge({ e, panic, setRef }: { e: EdgeState; panic: boolean; setRef: (el: SVGPathElement | null) => void }) {
  const stroke = panic ? 'var(--fault)' : e.cloudflare ? 'rgba(243,128,32,.7)' : e.implied ? 'rgba(255,255,255,.3)' : 'rgba(255,255,255,.38)';
  return <path ref={setRef} fill="none" stroke={stroke} strokeWidth={e.implied ? 1.25 : 1.5} data-implied={e.implied ? 1 : 0} />;
});
