/**
 * beatdeck — a fixed 1920×1080 stage where one click is one beat.
 * Everything a deck needs is exported from here; nothing in `src/beatdeck/` imports from the deck.
 */
import type { DeckDefinition } from './types';

export type { Position, BeatDef, SceneDef, DeckState, DeckDefinition, TimelineHost } from './types';
export { mount } from './mount';
export { deck, useDeck, usePos, useHere, useReached, reached, arrivalOf, DeckEngine, type Arrival } from './engine';
export { flags, reducedMotion } from './flags';
export { glitch, rng, type GlitchState } from './fx/glitch';
export { debugStats } from './debugStats';
export { useStageScale, useStagePixelRatio, STAGE_W, STAGE_H } from './app/stage';
export { DefaultChrome } from './app/DefaultChrome';
export { getTimerStart } from './persistence';
export { EASE, OUT_MS, IN_DELAY, swap, layerFade } from './components/motion';
export { CountUp } from './components/CountUp';
export { Typewriter } from './components/Typewriter';
export { QR, qrConfigured } from './components/QR';
export { useGlitch } from './components/useGlitch';

/** Identity helper that types a deck definition (and its `live` state) without a cast. */
export function defineDeck<L = Record<string, never>>(def: DeckDefinition<L>): DeckDefinition<L> {
  return def;
}
export { Scene, Reveal, useScene, useArrival } from './components/Layout';
export { Terminal, type TermLine, type TermMark } from './components/Terminal';
export { NodeBox, Arrow, rectExit, type Rect, type NodeTone } from './components/Diagram';
export { Plot, Zone, Series, Marker, PlotLabel, usePlot, scaleLinear, type Axis, type ChartTone } from './components/Chart';
