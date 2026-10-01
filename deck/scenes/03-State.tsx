import { Arrow, NodeBox, Scene, useScene, type Rect } from 'beatdeck';

const STATE: Rect = { x: 690, y: 450, w: 540, h: 180 };
const INPUT: Rect = { x: 100, y: 480, w: 420, h: 120 };
const STAGE: Rect = { x: 1400, y: 480, w: 420, h: 120 };
const URL_: Rect = { x: 760, y: 790, w: 400, h: 120 };
const PRESENTER: Rect = { x: 660, y: 170, w: 600, h: 120 };

function State_() {
  const { here, b } = useScene();
  const at = (n: number) => here && b >= n;
  const beat = Math.max(0, b) + 1;
  return (
    <>
      <Arrow from={INPUT} to={STATE} on={at(1)} flow />
      <Arrow from={STATE} to={STAGE} on={at(2)} flow />
      <Arrow from={STATE} to={URL_} on={at(3)} head={false} flow label="refresh-safe" lx={14} labelAnchor="start" />
      <Arrow from={PRESENTER} to={STATE} on={at(4)} flow label="BroadcastChannel" lx={14} labelAnchor="start" />

      {/* the state box shows the real position of the deck */}
      <NodeBox rect={STATE} on={at(0)} tone="hot" kind="state"
        value={<span style={{ fontSize: 40 }}>{'{ scene: '}<span style={{ color: 'var(--accent)' }}>3</span>{', beat: '}<span style={{ color: 'var(--accent)' }}>{beat}</span>{' }'}</span>} />
      <NodeBox rect={INPUT} on={at(1)} kind="input" value="click · → · PageDown" />
      <NodeBox rect={STAGE} on={at(2)} kind="stage" value="1920 × 1080" />
      <NodeBox rect={URL_} on={at(3)} kind="url" value={<span style={{ fontSize: 34 }}>#3.{beat}</span>} />
      <NodeBox rect={PRESENTER} on={at(4)} kind="presenter" value="current · next · notes · timer" />
    </>
  );
}

/** 03 STATE — the whole model in one diagram, built one node per click. */
export const State = () => <Scene index={2}><State_ /></Scene>;
