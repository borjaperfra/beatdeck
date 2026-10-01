import type { Position } from './types';

interface Clamp {
  clamp(p: Position): Position;
  def: { id: string };
}

/** `#5.4` → { scene: 4, beat: 3 }. Returns null if the hash is not a position. */
export function parseHash(hash: string): Position | null {
  const m = /^#?(\d+)(?:\.(\d+))?$/.exec(hash.trim());
  if (!m) return null;
  return { scene: +m[1] - 1, beat: (m[2] ? +m[2] : 1) - 1 };
}

export const toHash = (p: Position) => `#${p.scene + 1}.${p.beat + 1}`;

/**
 * The URL decides: `#5.4` resumes there (a refresh keeps it), a bare URL is a fresh run from 1.1,
 * so it also clears the timer, which otherwise only starts when it is empty.
 */
export function loadPosition(e: Clamp): Position {
  const fromHash = parseHash(location.hash);
  if (fromHash) return e.clamp(fromHash);
  setTimerStart(e.def.id, null);
  return { scene: 0, beat: 0 };
}

export function savePosition(p: Position): void {
  const h = toHash(p);
  if (location.hash !== h) history.replaceState(null, '', h);
}

const timerKey = (id: string) => `beatdeck:${id}:timer-start`;

/** Presentation timer start (ms epoch). Survives refresh; shared with the presenter window via storage. */
export function getTimerStart(id: string): number | null {
  try {
    const v = localStorage.getItem(timerKey(id));
    return v ? +v : null;
  } catch {
    return null;
  }
}

export function setTimerStart(id: string, t: number | null): void {
  try {
    if (t == null) localStorage.removeItem(timerKey(id));
    else localStorage.setItem(timerKey(id), String(t));
  } catch {
    /* storage unavailable: the timer simply restarts */
  }
}
