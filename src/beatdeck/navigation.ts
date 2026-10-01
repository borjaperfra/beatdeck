import { deck } from './engine';
import { flags } from './flags';
import { openPresenterWindow } from './presenter';

export interface NavUi {
  toggleOverview(): void;
  closeOverview(): boolean;
}

/** Remote/clicker commands, also used by the presenter window (which forwards instead of acting locally). */
export interface NavTarget {
  next(): void;
  prev(): void;
  go(scene: number, beat: number): void;
  home(): void;
  end(): void;
  blackout(): void;
}

export const localTarget: NavTarget = {
  next: () => deck.next(),
  prev: () => deck.prev(),
  go: (scene, beat) => deck.go({ scene, beat }),
  home: () => deck.home(),
  end: () => deck.end(),
  blackout: () => deck.toggleBlackout(),
};

export function toggleFullscreen() {
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  else document.documentElement.requestFullscreen({ navigationUI: 'hide' }).catch(() => {});
}

export const isFullscreen = () => !!document.fullscreenElement;

/** Hide the cursor after inactivity; any mouse movement brings it back. */
export function startCursorAutoHide(ms: number): () => void {
  if (flags.capture) return () => {};
  const root = document.documentElement;
  let t: ReturnType<typeof setTimeout> | undefined;
  const wake = () => {
    root.classList.remove('cursor-hidden');
    clearTimeout(t);
    t = setTimeout(() => root.classList.add('cursor-hidden'), ms);
  };
  window.addEventListener('mousemove', wake, { passive: true });
  window.addEventListener('mousedown', wake, { passive: true });
  wake();
  return () => {
    clearTimeout(t);
    window.removeEventListener('mousemove', wake);
    window.removeEventListener('mousedown', wake);
  };
}

/**
 * Keyboard / clicker map. Clickers send PageDown/PageUp (some send arrows, "b" or "." for blank screen).
 * Space advances only in fullscreen (or in the presenter) so a stray press while setting up does nothing.
 * Every handled key prevents the browser default (no scrolling, no find-as-you-type).
 */
export function bindKeys(target: NavTarget, ui: NavUi | null, opts: { presenter?: boolean } = {}): () => void {
  const onKey = (e: KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const el = e.target as HTMLElement | null;
    if (el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return;
    const k = e.key;
    const nav = (fn: () => void) => {
      e.preventDefault();
      if (!e.repeat) fn();
    };
    switch (k) {
      case 'ArrowRight': case 'ArrowDown': case 'PageDown':
        return nav(target.next);
      case 'ArrowLeft': case 'ArrowUp': case 'PageUp':
        return nav(target.prev);
      case ' ':
        e.preventDefault();
        if (!e.repeat && (isFullscreen() || opts.presenter)) target.next();
        return;
      case 'Home': return nav(target.home);
      case 'End': return nav(target.end);
      case 'f': case 'F':
        if (opts.presenter) return;
        return nav(toggleFullscreen);
      case 'o': case 'O':
        return ui ? nav(ui.toggleOverview) : undefined;
      case 'p': case 'P':
        if (opts.presenter) return;
        return nav(openPresenterWindow);
      case 'b': case 'B': case '.':
        return nav(target.blackout);
      case 'Escape':
        if (ui?.closeOverview()) e.preventDefault();
        return;
      default:
        if (/^[1-9]$/.test(k) && +k <= deck.scenes.length) {
          nav(() => {
            ui?.closeOverview();
            target.go(+k - 1, 0);
          });
        }
    }
  };
  window.addEventListener('keydown', onKey);
  return () => window.removeEventListener('keydown', onKey);
}
