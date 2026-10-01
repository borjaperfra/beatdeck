/** Tokens swallowed by the GPU during 04.5 (updated by the canvas at ~9 Hz; only the GPU node listens). */
let burned = 0;
let tick = 0;
const listeners = new Set<() => void>();

export const burnCounter = {
  get: () => burned,
  tick: () => tick,
  add(n: number) {
    burned += n;
  },
  reset() {
    burned = 0;
    listeners.forEach((l) => l());
  },
  publish() {
    tick++;
    listeners.forEach((l) => l());
  },
  subscribe(l: () => void) {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
};
