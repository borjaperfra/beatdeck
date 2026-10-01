import { Marker, Plot, Reveal, Scene, useScene } from 'beatdeck';

/** Real `npm run verify` timings, measured on one laptop. */
const RUNS: { name: string; beats: number; seconds: number }[] = [
  { name: 'blank starter', beats: 3, seconds: 15 },
  { name: 'this demo', beats: 24, seconds: 144 },
  { name: 'Kernel Panic', beats: 47, seconds: 328 },
];

function Cost_() {
  const { here, b } = useScene();
  return (
    <>
      <Reveal on={here} x={160} y={170}>
        <div className="t-eyebrow" style={{ marginBottom: 32 }}>// the cost of proof</div>
        <div className="t-editorial" style={{ fontSize: 64, width: 640 }}>Proof costs about 5–7 seconds per beat.</div>
      </Reveal>
      <Plot rect={{ x: 1000, y: 230, w: 760, h: 600 }} on={here}
        x={{ domain: [0, 50], ticks: [0, 25, 50], label: 'beats' }}
        y={{ domain: [0, 350], ticks: [0, 100, 200, 300], label: 'seconds' }}>
        {RUNS.map((r, i) => (
          <Marker key={r.name} at={[r.beats, r.seconds]} on={here && b >= 1} tone="accent"
            label={`${r.name} · ${r.seconds} s`} labelSide={i === 2 ? 'left' : 'right'} />
        ))}
      </Plot>
    </>
  );
}

/** 05 COST — a chart built with Plot + Marker. */
export const Cost = () => <Scene index={4}><Cost_ /></Scene>;
