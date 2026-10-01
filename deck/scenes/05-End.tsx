import { QR, Reveal, Scene, useScene } from 'beatdeck';
import { config } from '../deck.config';

function End_() {
  const { here, b } = useScene();
  const make = here && b === 0;
  const qa = here && b === 1;
  return (
    <>
      <Reveal on={make} out={qa} x={160} y={250}>
        <div className="t-eyebrow" style={{ marginBottom: 40 }}>// make your own</div>
        <div className="t-statement" style={{ fontSize: 150 }}>Your talk,<br />in beats.</div>
      </Reveal>
      <Reveal on={make} out={qa} x={160} y={700} delay={250}>
        <div className="mono" style={{ fontSize: 30, padding: '22px 30px', border: '1px solid var(--hair-strong)', whiteSpace: 'nowrap' }}>
          <span style={{ color: 'var(--accent)' }}>$</span> {config.scaffold}
        </div>
      </Reveal>

      <Reveal on={qa} x={160} y={380}>
        <div className="t-statement" style={{ fontSize: 220 }}>Questions<span style={{ color: 'var(--accent)' }}>?</span></div>
      </Reveal>
      <Reveal on={qa} x={170} y={680} delay={200}>
        <div className="t-meta" style={{ fontSize: 24 }}>{config.author}</div>
      </Reveal>

      <Reveal on={here} x={1440} y={330} delay={300}>
        <QR url={config.qrUrl} size={320} />
        <div className="t-meta" style={{ fontSize: 18, marginTop: 24, width: 320, textAlign: 'center', textTransform: 'none', letterSpacing: '0.02em' }}>{config.qrLabel}</div>
      </Reveal>
    </>
  );
}

/** 05 END — how to start, then questions. The QR is computed locally from deck.config.ts → qrUrl. */
export const End = () => <Scene index={4}><End_ /></Scene>;
