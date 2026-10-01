import { IN_DELAY, EASE, Scene, useScene } from 'beatdeck';

interface Box { x: number; y: number; w: number; h: number }

const STATE: Box = { x: 690, y: 455, w: 540, h: 170 };
const INPUT: Box = { x: 100, y: 480, w: 420, h: 120 };
const STAGE: Box = { x: 1400, y: 480, w: 420, h: 120 };
const URL_: Box = { x: 760, y: 790, w: 400, h: 110 };
const PRESENTER: Box = { x: 660, y: 170, w: 600, h: 110 };

function Node({ box, on, label, children, strong }: { box: Box; on: boolean; label: string; children: React.ReactNode; strong?: boolean }) {
  return (
    <div style={{
      position: 'absolute', left: box.x, top: box.y, width: box.w, height: box.h,
      border: `1px solid ${strong ? 'var(--accent)' : 'var(--hair-strong)'}`, background: 'var(--bg)',
      display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 28px', whiteSpace: 'nowrap',
      opacity: on ? 1 : 0, transform: `scale(${on ? 1 : 0.96})`,
      transition: on ? `opacity 600ms ${EASE} ${IN_DELAY + 250}ms, transform 900ms ${EASE} ${IN_DELAY + 250}ms` : 'opacity 250ms, transform 250ms',
    }}>
      <div className="t-meta" style={{ position: 'absolute', top: -34, left: 0, fontSize: 16, whiteSpace: 'nowrap', color: strong ? 'var(--accent)' : 'var(--ink-3)' }}>// {label}</div>
      {children}
    </div>
  );
}

/** A connector that draws itself, then carries a slow dashed flow while it is on. */
function Edge({ on, d }: { on: boolean; d: string }) {
  return (
    <g style={{ opacity: on ? 1 : 0, transition: on ? 'opacity 1ms' : 'opacity 250ms' }}>
      <path d={d} pathLength={1} fill="none" stroke="var(--hair-strong)" strokeWidth={2}
        style={{ strokeDasharray: 1, strokeDashoffset: on ? 0 : 1, transition: on ? `stroke-dashoffset 700ms ${EASE} ${IN_DELAY}ms` : 'none' }} />
      <path d={d} fill="none" stroke="var(--accent)" strokeWidth={2} className="flow" style={{ opacity: on ? 1 : 0, transition: `opacity 400ms ease ${IN_DELAY + 900}ms` }} />
    </g>
  );
}

function State_() {
  const { here, b } = useScene();
  const at = (n: number) => here && b >= n;
  const beat = Math.max(0, b) + 1;
  const mono = { fontFamily: 'var(--font-mono)' } as const;
  return (
    <>
      <svg className="layer" width={1920} height={1080} viewBox="0 0 1920 1080">
        <Edge on={at(1)} d={`M${INPUT.x + INPUT.w} 540 H${STATE.x}`} />
        <Edge on={at(2)} d={`M${STATE.x + STATE.w} 540 H${STAGE.x}`} />
        <Edge on={at(3)} d={`M960 ${STATE.y + STATE.h} V${URL_.y}`} />
        <Edge on={at(4)} d={`M960 ${PRESENTER.y + PRESENTER.h} V${STATE.y}`} />
      </svg>

      {/* the state box shows the real position of the deck */}
      <Node box={STATE} on={at(0)} label="state" strong>
        <div style={{ ...mono, fontSize: 40, whiteSpace: 'nowrap' }}>
          {'{ scene: '}<span style={{ color: 'var(--accent)' }}>3</span>{', beat: '}<span style={{ color: 'var(--accent)' }}>{beat}</span>{' }'}
        </div>
      </Node>
      <Node box={INPUT} on={at(1)} label="input">
        <div style={{ ...mono, fontSize: 26 }}>click · → · PageDown</div>
      </Node>
      <Node box={STAGE} on={at(2)} label="stage">
        <div style={{ ...mono, fontSize: 26 }}>1920 × 1080</div>
      </Node>
      <Node box={URL_} on={at(3)} label="url · refresh-safe">
        <div style={{ ...mono, fontSize: 34 }}>#3.{beat}</div>
      </Node>
      <Node box={PRESENTER} on={at(4)} label="presenter · BroadcastChannel">
        <div style={{ ...mono, fontSize: 26 }}>current · next · notes · timer</div>
      </Node>
    </>
  );
}

/** 03 STATE — the whole model in one diagram, built one node per click. */
export const State = () => <Scene index={2}><State_ /></Scene>;
