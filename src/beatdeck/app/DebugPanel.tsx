import { useEffect, useState } from 'react';
import { deck, useDeck } from '../engine';
import { reducedMotion } from '../flags';
import { debugStats } from '../debugStats';

/** `?debug=1` only. Never rendered in normal presentation mode. */
export function DebugPanel() {
  const st = useDeck((s) => s);
  const [, force] = useState(0);
  useEffect(() => {
    const i = setInterval(() => force((n) => n + 1), 250);
    return () => clearInterval(i);
  }, []);
  const stop = (e: React.SyntheticEvent) => e.stopPropagation();
  const sc = deck.scenes[st.scene];
  const Extra = deck.def.Debug;
  return (
    <div className="debug mono" onClick={stop} onMouseDown={stop}>
      <div><b>{deck.label(st)}</b> {sc.title} · {sc.beats[st.beat].name}</div>
      <div>fps {debugStats.fps || '—'}{debugStats.particles ? ` · particles ${debugStats.particles}` : ''} · entry {st.entry}</div>
      <div>live {JSON.stringify(st.live)}</div>
      <div className="debug-row">
        <select value={st.scene} onChange={(e) => deck.go({ scene: +e.target.value, beat: 0 })}>
          {deck.scenes.map((s, i) => <option key={i} value={i}>{s.id} {s.title}</option>)}
        </select>
        <select value={st.beat} onChange={(e) => deck.go({ scene: st.scene, beat: +e.target.value })}>
          {sc.beats.map((b, i) => <option key={i} value={i}>{i + 1} {b.name}</option>)}
        </select>
        <button onClick={() => deck.go(st)}>replay beat</button>
        <button onClick={() => reducedMotion.set(!reducedMotion.get())}>reduced {reducedMotion.get() ? 'on' : 'off'}</button>
      </div>
      {Extra && <Extra />}
    </div>
  );
}
