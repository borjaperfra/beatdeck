import { deck, useDeck } from '../engine';

/**
 * Quiet system chrome: deck title // scene id top-left, one tick per beat at the bottom.
 * Hidden on black and on the first scene (the title owns the screen there).
 */
export function DefaultChrome({ black }: { black: boolean }) {
  const d = useDeck((st) => ({ s: st.scene, b: st.beat }));
  const sc = deck.scenes[d.s];
  const hidden = black || d.s === 0;
  return (
    <div className="layer chrome" style={{ opacity: hidden ? 0 : 1 }}>
      <div className="chrome-id">
        <span className="chrome-title">{deck.def.title}</span>
        <span className="chrome-sep">//</span>
        <span>{sc.id}</span>
      </div>
      <div className="chrome-ticks">
        {sc.beats.map((_, i) => (
          <span key={i} className={i === d.b ? 'here' : i < d.b ? 'done' : ''} />
        ))}
      </div>
    </div>
  );
}
