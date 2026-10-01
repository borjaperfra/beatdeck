/** URL flags, read once at startup. */
const q = new URLSearchParams(location.search);

export const flags = {
  /** `?view=presenter` → presenter window. */
  presenter: q.get('view') === 'presenter',
  /** `?debug=1` → operator debug panel. Never shown otherwise. */
  debug: q.get('debug') === '1',
  /** `?capture=1` → screenshot mode: no auto-advance, no cursor blink, no hidden cursor. */
  capture: q.get('capture') === '1',
  /** `?reduced=1` forces reduced motion (in addition to the OS setting). */
  reducedParam: q.get('reduced') === '1',
};

const mq = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null;

let reducedOverride: boolean | null = flags.reducedParam ? true : null;
const listeners = new Set<() => void>();

export const reducedMotion = {
  get(): boolean {
    return reducedOverride ?? !!mq?.matches;
  },
  set(v: boolean | null) {
    reducedOverride = v;
    document.documentElement.classList.toggle('reduced-motion', this.get());
    listeners.forEach((l) => l());
  },
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};

mq?.addEventListener?.('change', () => reducedMotion.set(reducedOverride));
