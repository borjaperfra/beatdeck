import { reducedMotion } from '../flags';

/**
 * Short-lived glitch state (boot glitches and the 06.6 panic). Separate from the deck store so only the few
 * components that jitter re-render at 25 fps.
 */
export interface GlitchState {
  active: boolean;
  panic: boolean;
  /** Violent effects allowed (false under reduced motion: no jitter, no bars, no RGB split). */
  violent: boolean;
  seed: number;
}

let state: GlitchState = { active: false, panic: false, violent: true, seed: 0 };
const listeners = new Set<() => void>();
let interval: ReturnType<typeof setInterval> | undefined;
let stopTimer: ReturnType<typeof setTimeout> | undefined;

const emit = () => listeners.forEach((l) => l());

export const glitch = {
  get: () => state,
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  /** Start a glitch; `ms` = null keeps it running until stop(). */
  start(ms: number | null, panic = false) {
    this.stop(false);
    const violent = !reducedMotion.get();
    state = { active: true, panic, violent, seed: Math.random() };
    if (violent) interval = setInterval(() => { state = { ...state, seed: Math.random() }; emit(); }, 40);
    if (ms != null) stopTimer = setTimeout(() => this.stop(), ms);
    emit();
  },
  stop(notify = true) {
    clearInterval(interval);
    clearTimeout(stopTimer);
    interval = stopTimer = undefined;
    if (state.active) {
      state = { active: false, panic: false, violent: true, seed: 0 };
      if (notify) emit();
    }
  },
};

/** Deterministic pseudo-random in [0,1) from the glitch seed (same as v3's rng). */
export function rng(seed: number, k: number): number {
  let t = ((seed * 1e9) | 0) + k * 2654435761;
  t = Math.imul(t ^ (t >>> 15), 1 | t);
  t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
