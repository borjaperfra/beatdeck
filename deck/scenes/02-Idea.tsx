import { EASE, IN_DELAY, Reveal, Scene, useScene } from 'beatdeck';

const RULES = ['One click is one beat.', 'Every beat rebuilds from the URL.', 'Motion lives inside a beat.'];

function Idea_() {
  const { here, b } = useScene();
  const struck = here && b >= 2;
  return (
    <>
      <Reveal on={here} x={150} y={150}>
        <div className="t-statement" style={{ fontSize: 176, color: struck ? 'var(--ink-3)' : 'var(--ink)', transition: 'color 600ms' }}>
          Slides are{' '}
          <span style={{ position: 'relative', display: 'inline-block' }}>
            pages.
            <span style={{
              position: 'absolute', left: '-0.04em', top: '52%', height: '0.07em', background: 'var(--accent)',
              width: struck ? '108%' : '0%', transition: struck ? `width 700ms ${EASE} ${IN_DELAY}ms` : 'width 200ms',
            }} />
          </span>
        </div>
      </Reveal>
      <Reveal on={here && b >= 1} x={150} y={360}>
        <div className="t-statement" style={{ fontSize: 176 }}>
          Talks are <span style={{ color: 'var(--accent)' }}>beats.</span>
        </div>
      </Reveal>

      {/* 02.4–02.6 the three rules, one per click */}
      <div style={{ position: 'absolute', left: 160, top: 690, width: 1600, height: 1, background: 'var(--hair)', opacity: here && b >= 3 ? 1 : 0, transition: 'opacity 600ms' }} />
      {RULES.map((r, i) => (
        <Reveal key={r} on={here && b >= 3 + i} x={160 + i * 540} y={730}>
          <div className="t-eyebrow" style={{ fontSize: 20, marginBottom: 22 }}>{String(i + 1).padStart(2, '0')}</div>
          <div className="t-editorial" style={{ fontSize: 46, width: 460 }}>{r}</div>
        </Reveal>
      ))}
    </>
  );
}

/** 02 IDEA — slides are pages, talks are beats, and the three rules. */
export const Idea = () => <Scene index={1}><Idea_ /></Scene>;
