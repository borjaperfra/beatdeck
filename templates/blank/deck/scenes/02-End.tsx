import { QR, Reveal, Scene, qrConfigured, useScene } from 'beatdeck';
import { config } from '../deck.config';

function End_() {
  const { here } = useScene();
  const qr = qrConfigured(config.qrUrl);
  return (
    <>
      <Reveal on={here} x={160} y={380}>
        <div className="t-statement" style={{ fontSize: 220 }}>Questions<span style={{ color: 'var(--accent)' }}>?</span></div>
      </Reveal>
      {config.author && (
        <Reveal on={here} x={170} y={680} delay={200}>
          <div className="t-meta" style={{ fontSize: 24 }}>{config.author}</div>
        </Reveal>
      )}
      {qr && (
        <Reveal on={here} x={1440} y={330} delay={300}>
          <QR url={config.qrUrl} size={320} />
          {config.qrLabel && (
            <div className="t-meta" style={{ fontSize: 18, marginTop: 24, width: 320, textAlign: 'center', textTransform: 'none', letterSpacing: '0.02em' }}>{config.qrLabel}</div>
          )}
        </Reveal>
      )}
    </>
  );
}

/** 02 END — questions, with the QR from deck.config.ts → qrUrl once it is set. */
export const End = () => <Scene index={1}><End_ /></Scene>;
