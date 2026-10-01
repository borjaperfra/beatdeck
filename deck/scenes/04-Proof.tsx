import { Reveal, Scene, Terminal, useScene } from 'beatdeck';
import { TERM } from '../terminal';

function Proof_() {
  const { here, b } = useScene();
  const marks = here && b >= 2;
  return (
    <>
      <Reveal on={here} x={160} y={170}>
        <div className="t-eyebrow">// done means verified</div>
      </Reveal>
      <Terminal x={160} y={300} size={34} lines={[
        { t: TERM.build[0], on: here },
        { t: TERM.build[1], on: here, dim: b >= 1, labels: 1 },
        { t: TERM.verify[0], on: here && b >= 1 },
        {
          t: TERM.verify[1], on: here && b >= 1, labels: 1,
          marks: [
            { text: 'walked back', on: marks, label: 'through prev()' },
            { text: 'reloaded from the URL', on: marks, label: 'from #scene.beat alone' },
          ],
        },
      ]} />
      <Reveal on={marks} x={160} y={760} delay={500}>
        <div className="t-editorial" style={{ fontSize: 56, width: 1500 }}>
          Every frame must match, whichever way you got there.
        </div>
      </Reveal>
    </>
  );
}

/** 04 PROOF — the deck's own build and verify output, real. */
export const Proof = () => <Scene index={3}><Proof_ /></Scene>;
