import { Reveal, Scene, useDeck, useScene, type DeckState } from 'beatdeck';
import { config } from '../deck.config';
import type { Live } from '../timeline';

function Open_() {
  const { here, b } = useScene();
  const typed = useDeck((s: DeckState<Live>) => s.live.typed);
  const prompt = here && b <= 1;
  const title = here && b === 2;
  return (
    <>
      {/* 01.1–01.2 the prompt on black; 01.2 types the scaffold command by itself */}
      <div className="mono" style={{ position: 'absolute', left: 0, width: 1920, top: 510, textAlign: 'center', fontSize: 34, color: 'var(--ink-2)', opacity: prompt ? 1 : 0, transition: 'opacity 300ms' }}>
        <span style={{ color: 'var(--accent)' }}>$</span> {config.scaffold.slice(0, typed)}<span className="cursor">_</span>
      </div>

      {/* 01.3 title */}
      <Reveal on={title} x={168} y={318}>
        <div className="t-eyebrow">// {config.subtitle}</div>
      </Reveal>
      <Reveal on={title} x={150} y={400} delay={120} ms={1100}>
        <div className="t-statement" style={{ fontSize: 320 }}>
          {config.title}<span style={{ color: 'var(--accent)' }}>.</span>
        </div>
      </Reveal>
      <Reveal on={title} x={168} y={880} delay={400}>
        <div className="t-meta" style={{ fontSize: 22 }}>{config.author}</div>
      </Reveal>
    </>
  );
}

/** 01 OPEN — standby prompt, automatic boot, title. */
export const Open = () => <Scene index={0}><Open_ /></Scene>;
