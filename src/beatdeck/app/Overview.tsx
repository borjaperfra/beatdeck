import { deck, useDeck } from '../engine';

/** Operator tool (O): every scene and its beats. Click to jump. Does not touch the stage until you pick. */
export function Overview({ onClose }: { onClose: () => void }) {
  const d = useDeck((st) => ({ s: st.scene, b: st.beat }));
  const jump = (scene: number, beat: number) => (e: React.MouseEvent) => {
    e.stopPropagation();
    deck.go({ scene, beat });
    onClose();
  };
  return (
    <div className="overview" onClick={(e) => { e.stopPropagation(); onClose(); }}>
      <div className="overview-head mono">overview · click to jump · o / esc to close</div>
      <div className="overview-grid" onClick={(e) => e.stopPropagation()}>
        {deck.scenes.map((sc, i) => {
          const state = i < d.s ? 'done' : i === d.s ? 'current' : 'next';
          return (
            <div key={i} className={`ov-scene ${state}`}>
              <button className="ov-title mono" onClick={jump(i, 0)}>
                <span className="ov-n">{sc.id}</span>
                <span>{sc.title}</span>
              </button>
              <div className="ov-beats">
                {sc.beats.map((bt, j) => (
                  <button key={j} className={`ov-beat mono${i === d.s && j === d.b ? ' here' : ''}`} onClick={jump(i, j)}>
                    <span className="ov-bn">{sc.id}.{j + 1}</span> {bt.name}{bt.auto ? ' · auto' : ''}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
