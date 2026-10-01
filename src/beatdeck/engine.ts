import { useRef, useSyncExternalStore } from 'react';
import { gsap } from 'gsap';
import type { DeckDefinition, DeckState, Position, SceneDef } from './types';
import { glitch } from './fx/glitch';
import { flags } from './flags';
import { loadPosition, savePosition, getTimerStart, setTimerStart } from './persistence';

type Listener = () => void;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyDef = DeckDefinition<any>;

/**
 * The single source of truth: { scene, beat } + the beat's automatic `live` sub-state.
 * Entering a beat always resets `live` to the beat's initial value and (re)starts its timeline,
 * so every beat renders the same whether reached forwards, backwards, by jump or after a refresh.
 */
export class DeckEngine<L> {
  private state: DeckState<L>;
  private listeners = new Set<Listener>();
  private tl: gsap.core.Timeline | null = null;
  private exits: (() => void)[] = [];

  constructor(readonly def: DeckDefinition<L>) {
    const p = flags.presenter ? { scene: 0, beat: 0 } : loadPosition(this);
    this.state = { ...p, live: this.initialLive(p), entry: 0, from: null, blackout: false };
  }

  get scenes(): SceneDef[] {
    return this.def.scenes;
  }

  get last(): Position {
    const s = this.scenes.length - 1;
    return { scene: s, beat: this.scenes[s].beats.length - 1 };
  }

  clamp = ({ scene, beat }: Position): Position => {
    const s = Math.max(0, Math.min(this.scenes.length - 1, scene | 0));
    const b = Math.max(0, Math.min(this.scenes[s].beats.length - 1, beat | 0));
    return { scene: s, beat: b };
  };

  nextOf = ({ scene, beat }: Position): Position | null => {
    if (beat < this.scenes[scene].beats.length - 1) return { scene, beat: beat + 1 };
    if (scene < this.scenes.length - 1) return { scene: scene + 1, beat: 0 };
    return null;
  };

  prevOf = (p: Position): Position | null => {
    const o = this.def.prev?.(p);
    if (o !== undefined) return o;
    if (p.beat > 0) return { scene: p.scene, beat: p.beat - 1 };
    if (p.scene > 0) return { scene: p.scene - 1, beat: this.scenes[p.scene - 1].beats.length - 1 };
    return null;
  };

  label = ({ scene, beat }: Position) => `${this.scenes[scene].id}.${beat + 1}`;

  private initialLive(p: Position): L {
    return (this.def.initialLive?.(p) ?? {}) as L;
  }

  getState = () => this.state;

  subscribe = (l: Listener) => {
    this.listeners.add(l);
    return () => {
      this.listeners.delete(l);
    };
  };

  private emit() {
    this.listeners.forEach((l) => l());
  }

  /** Called once by the stage after mount: start the restored beat's timeline. */
  start() {
    this.enter(this.state, null);
  }

  go = (target: Position) => {
    const p = this.clamp(target);
    this.enter(p, { scene: this.state.scene, beat: this.state.beat });
  };

  next = () => {
    const n = this.nextOf(this.state);
    if (n) this.go(n);
  };

  prev = () => {
    const p = this.prevOf(this.state);
    if (p) this.go(p);
  };

  home = () => this.go({ scene: 0, beat: 0 });
  end = () => this.go(this.last);

  toggleBlackout = () => {
    this.state = { ...this.state, blackout: !this.state.blackout };
    this.emit();
  };

  setLive = (p: Partial<L>) => {
    this.state = { ...this.state, live: { ...this.state.live, ...p } };
    this.emit();
  };

  private leave() {
    this.tl?.kill();
    this.tl = null;
    const exits = this.exits;
    this.exits = [];
    exits.forEach((f) => f());
    glitch.stop();
  }

  private enter(p: Position, from: Position | null) {
    this.leave();
    this.state = { scene: p.scene, beat: p.beat, live: this.initialLive(p), entry: this.state.entry + 1, from, blackout: false };
    if (!flags.presenter) {
      savePosition(p);
      if ((p.scene > 0 || p.beat > 0) && getTimerStart(this.def.id) == null) setTimerStart(this.def.id, Date.now());
    }
    this.emit();
    if (flags.presenter || !this.def.timeline) return;
    const tl = gsap.timeline();
    this.tl = tl;
    this.def.timeline(p, {
      tl,
      at: (ms, fn) => {
        tl.call(fn, [], ms / 1000);
      },
      setLive: this.setLive,
      autoGo: (q) => {
        if (!flags.capture) this.go(q);
      },
      onExit: (fn) => {
        this.exits.push(fn);
      },
    });
  }
}

let current: DeckEngine<unknown> | null = null;

export function createEngine(def: AnyDef): DeckEngine<unknown> {
  current = new DeckEngine(def);
  return current;
}

function engine(): DeckEngine<unknown> {
  if (!current) throw new Error('beatdeck: the deck is not mounted yet (call mount(deck) in main.tsx).');
  return current;
}

/** Imperative handle on the running deck (navigation, state, subscription). */
export const deck = {
  getState: () => engine().getState(),
  subscribe: (l: Listener) => engine().subscribe(l),
  go: (p: Position) => engine().go(p),
  next: () => engine().next(),
  prev: () => engine().prev(),
  home: () => engine().home(),
  end: () => engine().end(),
  toggleBlackout: () => engine().toggleBlackout(),
  get scenes() {
    return engine().scenes;
  },
  get def(): AnyDef {
    return engine().def;
  },
  label: (p: Position) => engine().label(p),
  nextOf: (p: Position) => engine().nextOf(p),
  clamp: (p: Position) => engine().clamp(p),
  start: () => engine().start(),
};

function shallowEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || !a || !b) return false;
  const ka = Object.keys(a), kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  return ka.every((k) => Object.is((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]));
}

/** Subscribe to a slice of the deck state (shallow-compared) so components only re-render when it changes. */
export function useDeck<T, L = never>(selector: (s: DeckState<L>) => T): T {
  const cache = useRef<{ v: T } | null>(null);
  const get = () => {
    const v = selector(deck.getState() as DeckState<L>);
    if (cache.current && shallowEqual(cache.current.v, v)) return cache.current.v;
    cache.current = { v };
    return v;
  };
  return useSyncExternalStore(deck.subscribe, get, get);
}

/** How the deck reached the current beat: from an earlier beat, a later one, the same one, or a fresh page load. */
export type Arrival = 'forward' | 'back' | 'same' | 'load';

export function arrivalOf(st: DeckState<unknown>): Arrival {
  const f = st.from;
  if (!f) return 'load';
  if (f.scene === st.scene && f.beat === st.beat) return 'same';
  return f.scene < st.scene || (f.scene === st.scene && f.beat < st.beat) ? 'forward' : 'back';
}

/** True when `pos` is at or after (scene, beat) — 0-based, like everything internal. */
export const reached = (pos: Position, scene: number, beat = 0) => pos.scene > scene || (pos.scene === scene && pos.beat >= beat);

/** Global position for layers that span scenes: scene `s`, beat `b`, `entry`, and `dir` (how it was reached). */
export const usePos = () => useDeck((st: DeckState<unknown>) => ({ s: st.scene, b: st.beat, entry: st.entry, dir: arrivalOf(st) }));

/**
 * For layers that span scenes: true from (scene, beat) on — and, with `until`, only before that position.
 * `useReached(2, 1)` = "from the 2nd beat of the 3rd scene"; `useReached(2, 0, [5, 0])` = "scenes 3–5".
 */
export function useReached(scene: number, beat = 0, until?: [number, number]): boolean {
  return useDeck((st: DeckState<unknown>) => reached(st, scene, beat) && (!until || !reached(st, until[0], until[1])));
}

/** True while the current position is inside `scene` (0-based), optionally within a beat range. */
export function useHere(scene: number) {
  const p = usePos();
  return { here: p.s === scene, b: p.b, entry: p.entry };
}
