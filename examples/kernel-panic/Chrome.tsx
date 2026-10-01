import { useEffect, useState } from 'react';
import { useDeck } from './deck/state';
import { getTimerStart, useGlitch } from 'beatdeck';
import { SCENES } from './deck/scenes';
import { DECK_ID } from './deck/deck.config';

const pad = (n: number) => String(n).padStart(2, '0');

function Uptime() {
  const [t0] = useState(() => getTimerStart(DECK_ID) ?? Date.now());
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, []);
  const d = Math.max(0, Math.floor((now - t0) / 1000));
  return <>{`${pad(Math.floor(d / 3600))}:${pad(Math.floor(d / 60) % 60)}:${pad(d % 60)}`}</>;
}

/** v3 system chrome: brand · scene, system status, beat ticks. Hidden on absolute black and on the Q&A. */
export function Chrome({ absBlack }: { absBlack: boolean }) {
  const d = useDeck((st) => ({ s: st.scene, b: st.beat, warnN: st.live.warnN }));
  const g = useGlitch();
  const panic = g.active && g.panic;
  const sc = SCENES[d.s];
  const warnOn = d.s === 5 && d.b === 4;
  const opacity = absBlack || (d.s === 7 && d.b === 6) ? 0 : d.s === 7 ? 0.6 : 1;

  return (
    <div className="layer mono" style={{ opacity, transition: 'opacity 500ms', fontSize: 20, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,.55)' }}>
      <div style={{ position: 'absolute', left: 72, top: 36, display: 'flex', alignItems: 'center', gap: 14, opacity: d.s === 0 ? 0 : 1 }}>
        <span className={panic ? 'event' : 'mono'} style={{ fontWeight: panic ? 400 : 500, fontSize: 22, letterSpacing: 0, textTransform: 'none', color: '#fff', textShadow: panic ? '2px 2px 0 #4934E1' : 'none' }}>
          {panic ? 'KERNEL PANIC!' : 'helmcode_'}
        </span>
        <span style={{ color: 'var(--violet-text)' }}>//</span>
        <span>{sc.id}</span>
      </div>
      <div style={{ position: 'absolute', right: 72, top: 40, display: 'flex', alignItems: 'center', gap: 12, color: panic ? 'var(--fault)' : 'rgba(255,255,255,.55)' }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: panic ? 'var(--fault)' : warnOn ? 'var(--warning)' : 'var(--ok)' }} />
        <span>{panic ? 'kernel panic · fatal' : warnOn ? `degraded · ${d.warnN} warnings` : <>live system · uptime <Uptime /></>}</span>
      </div>
      {/* on the title the talk's own footer takes this row */}
      <div style={{ position: 'absolute', inset: 0, opacity: d.s === 0 ? 0 : 1, transition: 'opacity 400ms' }}>
      <div style={{ position: 'absolute', left: 0, width: 1920, top: 1026, display: 'flex', justifyContent: 'center', gap: 8 }}>
        {sc.beats.map((_, i) => (
          <span key={i} style={{ width: 28, height: 2, background: i === d.b ? 'var(--violet-text)' : i < d.b ? 'rgba(255,255,255,.55)' : 'rgba(255,255,255,.14)', transition: 'background 300ms' }} />
        ))}
      </div>
      </div>
    </div>
  );
}
