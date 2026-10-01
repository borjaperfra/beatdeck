import { createContext, useContext } from 'react';
import { usePos } from '../engine';
import { layerFade, swap } from './motion';

interface SceneCtx {
  here: boolean;
  b: number;
  entry: number;
}

const Ctx = createContext<SceneCtx>({ here: false, b: -1, entry: 0 });

/** The current scene's position, inside a `<Scene>`: `here`, the beat `b` (-1 when elsewhere) and `entry`. */
export const useScene = () => useContext(Ctx);

/**
 * One scene layer. Always mounted; visible only while the deck is in `index` (0-based).
 * Leaves fast, enters after the previous scene has gone (see motion.ts).
 */
export function Scene({ index, children, style }: { index: number; children: React.ReactNode; style?: React.CSSProperties }) {
  const p = usePos();
  const here = p.s === index;
  return (
    <Ctx.Provider value={{ here, b: here ? p.b : -1, entry: p.entry }}>
      <div className="layer" style={{ opacity: here ? 1 : 0, transition: layerFade(here), ...style }}>
        {children}
      </div>
    </Ctx.Provider>
  );
}

/**
 * An element that belongs to some beats. `on` shows it; when it hides, it leaves upwards if `out` (the story
 * moved past it) or downwards otherwise (we went back). Absolutely positioned at x/y on the 1920×1080 stage.
 */
export function Reveal({ on, out = false, x, y, delay = 0, ms = 900, rise = 30, style, className, children }: {
  on: boolean; out?: boolean; x?: number; y?: number; delay?: number; ms?: number; rise?: number;
  style?: React.CSSProperties; className?: string; children: React.ReactNode;
}) {
  const dy = on ? 0 : out ? -rise : rise;
  return (
    <div
      className={className}
      style={{
        position: x != null || y != null ? 'absolute' : undefined, left: x, top: y,
        opacity: on ? 1 : 0, transform: `translateY(${dy}px)`, transition: swap(on, ms, delay), ...style,
      }}
    >
      {children}
    </div>
  );
}
