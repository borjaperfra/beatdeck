import { useEffect, useMemo, useState } from 'react';
import { deck } from '../engine';
import { openChannel, type Msg } from '../presenter';
import { bindKeys, type NavTarget } from '../navigation';
import { getTimerStart, setTimerStart } from '../persistence';
import { qrConfigured } from '../components/QR';
import type { BeatDef, Position } from '../types';

const pad = (n: number) => String(n).padStart(2, '0');
const fmtTime = (ms: number) => {
  const d = Math.max(0, Math.floor(ms / 1000));
  return `${pad(Math.floor(d / 3600))}:${pad(Math.floor(d / 60) % 60)}:${pad(d % 60)}`;
};

function BeatInfo({ bt }: { bt: BeatDef }) {
  return (
    <>
      {(bt.ref || bt.source) && <div className="p-source">{bt.ref && <span className="mono">{bt.ref}</span>} {bt.source}</div>}
      {bt.note && <div className="p-note">{bt.note}</div>}
    </>
  );
}

/** Separate window (P). Mirrors the stage over BroadcastChannel and sends it commands. Never shown to the audience. */
export function PresenterView() {
  const ch = useMemo(() => openChannel(), []);
  const id = deck.def.id;
  const [pos, setPos] = useState<Position | null>(null);
  const [lastSeen, setLastSeen] = useState(0);
  const [fs, setFs] = useState(false);
  const [blackout, setBlackout] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [t0, setT0] = useState<number | null>(getTimerStart(id));

  useEffect(() => {
    if (!ch) return;
    ch.onmessage = (e: MessageEvent<Msg>) => {
      const m = e.data;
      if (m.type === 'state') {
        setPos({ scene: m.scene, beat: m.beat });
        setFs(m.fullscreen);
        setBlackout(m.blackout);
        setLastSeen(Date.now());
      }
    };
    ch.postMessage({ type: 'hello' } satisfies Msg);
    return () => ch.close();
  }, [ch]);

  useEffect(() => {
    const i = setInterval(() => { setNow(Date.now()); setT0(getTimerStart(id)); }, 500);
    return () => clearInterval(i);
  }, [id]);

  const target: NavTarget = useMemo(() => {
    const send = (m: Msg) => ch?.postMessage(m);
    return {
      next: () => send({ type: 'cmd', cmd: 'next' }),
      prev: () => send({ type: 'cmd', cmd: 'prev' }),
      home: () => send({ type: 'cmd', cmd: 'home' }),
      end: () => send({ type: 'cmd', cmd: 'end' }),
      blackout: () => send({ type: 'cmd', cmd: 'blackout' }),
      go: (scene, beat) => send({ type: 'go', scene, beat }),
    };
  }, [ch]);

  useEffect(() => bindKeys(target, null, { presenter: true }), [target]);

  const connected = now - lastSeen < 2500;
  const scenes = deck.scenes;
  const sc = pos ? scenes[pos.scene] : null;
  const bt = pos ? scenes[pos.scene].beats[pos.beat] : null;
  const nx = pos ? deck.nextOf(pos) : null;
  const nbt = nx ? scenes[nx.scene].beats[nx.beat] : null;

  return (
    <div className="presenter">
      <header className="p-head mono">
        <span>{deck.def.title} // presenter</span>
        <span className={connected ? 'p-ok' : 'p-bad'}>● {connected ? 'stage connected' : 'no connection to the stage'}</span>
        <span>{fs ? 'fullscreen' : 'windowed (press F on the stage)'}{blackout ? ' · BLACKOUT' : ''}</span>
      </header>

      {deck.def.qrUrl !== undefined && !qrConfigured(deck.def.qrUrl) && (
        <div className="p-warn mono">QR not configured: deck.config.ts → qrUrl is "TODO". The closing screen shows no QR.</div>
      )}

      <main className="p-main">
        <section>
          <div className="p-label mono">CURRENT</div>
          {pos && sc && bt ? (
            <>
              <div className="p-pos mono">{deck.label(pos)} · {sc.title}</div>
              <div className="p-beat">{bt.name}{bt.auto ? <span className="p-auto mono"> auto</span> : null}</div>
              <BeatInfo bt={bt} />
            </>
          ) : <div className="p-beat">waiting for the stage…</div>}
        </section>
        <section>
          <div className="p-label mono">NEXT</div>
          {nx && nbt ? (
            <>
              <div className="p-pos mono">{deck.label(nx)} · {scenes[nx.scene].title}</div>
              <div className="p-nbeat">{nbt.name}</div>
              {(nbt.ref || nbt.source) && <div className="p-source">{nbt.ref && <span className="mono">{nbt.ref}</span>} {nbt.source}</div>}
            </>
          ) : <div className="p-nbeat">— end —</div>}
        </section>
        <section>
          <div className="p-label mono">TIMER</div>
          <div className="p-clock mono">{t0 ? fmtTime(now - t0) : '00:00:00'}</div>
          <div className="p-row">
            <button className="mono" onClick={() => { setTimerStart(id, Date.now()); setT0(Date.now()); }}>reset timer</button>
            <span className="mono p-dim">starts on leaving 1.1</span>
          </div>
        </section>
      </main>

      <div className="p-controls">
        <button className="mono" onClick={target.prev}>← prev</button>
        <button className="mono p-primary" onClick={target.next}>next →</button>
        <button className="mono" onClick={target.blackout}>blackout (B)</button>
        <button className="mono" onClick={() => ch?.postMessage({ type: 'hello' } satisfies Msg)}>resync</button>
      </div>

      <nav className="p-scenes">
        {scenes.map((s, i) => (
          <div key={i} className={`p-scene${pos && pos.scene === i ? ' here' : ''}`}>
            <button className="mono p-sn" onClick={() => target.go(i, 0)}>{s.id} {s.title}</button>
            <div className="p-dots">
              {s.beats.map((b, j) => (
                <button key={j} title={`${s.id}.${j + 1} ${b.name}`} className={`p-dot${pos && pos.scene === i && pos.beat === j ? ' here' : pos && (i < pos.scene || (i === pos.scene && j < pos.beat)) ? ' done' : ''}`} onClick={() => target.go(i, j)} />
              ))}
            </div>
          </div>
        ))}
      </nav>
      <footer className="p-foot mono">→ / PageDown / Space next · ← / PageUp prev · 1–{Math.min(9, scenes.length)} scene · B blackout · Home / End</footer>
    </div>
  );
}
