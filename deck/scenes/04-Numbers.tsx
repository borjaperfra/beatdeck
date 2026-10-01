import { CountUp, IN_DELAY, Reveal, Scene, useDeck, useScene, type DeckState } from 'beatdeck';
import { TOTAL_BEATS } from '../scenes';
import type { Live } from '../timeline';

const ROW_Y = [150, 430, 710];
const ROW_H = 220;

function Row({ i, on, numeral, caption, children }: { i: number; on: boolean; numeral: React.ReactNode; caption: string; children?: React.ReactNode }) {
  return (
    <>
      {i < 2 && <div style={{ position: 'absolute', left: 160, top: ROW_Y[i] + ROW_H + 30, width: 1600, height: 1, background: 'var(--hair)', opacity: on ? 1 : 0, transition: 'opacity 600ms' }} />}
      <Reveal on={on} x={150} y={ROW_Y[i] + 20}>
        <div className="t-numeral" style={{ fontSize: 180 }}>{numeral}</div>
      </Reveal>
      <Reveal on={on} x={1340} y={ROW_Y[i] + 62} delay={180}>
        <div className="t-meta" style={{ fontSize: 24 }}>{caption}</div>
        {children}
      </Reveal>
    </>
  );
}

function Numbers_() {
  const { here, b, entry } = useScene();
  const counted = useDeck((s: DeckState<Live>) => s.live.counted);
  return (
    <>
      <Row i={0} on={here && b >= 0} numeral="0" caption="network requests at runtime" />
      <Row i={1} on={here && b >= 1} numeral={<>1920<span style={{ color: 'var(--ink-3)' }}>×</span>1080</>} caption="one stage, letterboxed" />
      <Row i={2} on={here && b >= 2} numeral={<CountUp value={TOTAL_BEATS} from={0} entry={entry} ms={1800} delay={IN_DELAY} ease="power3.out" />} caption="beats in this deck">
        <div className="mono" style={{ fontSize: 22, marginTop: 18, color: 'var(--accent)', opacity: counted ? 1 : 0, transition: 'opacity 500ms' }}>
          each one reachable as #scene.beat
        </div>
      </Row>
    </>
  );
}

/** 04 NUMBERS — three facts, the last one counts itself. */
export const Numbers = () => <Scene index={3}><Numbers_ /></Scene>;
