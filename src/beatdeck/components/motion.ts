/**
 * Motion rules shared by every scene layer.
 *
 * The one rule: nothing crossfades on top of anything. What leaves goes first and fast (OUT_MS);
 * what arrives starts once the space is free (IN_DELAY) and settles slowly (v3 easing).
 */
export const EASE = 'cubic-bezier(.22,1,.36,1)';
export const OUT_MS = 320;
export const IN_DELAY = 340;

type Prop = 'opacity' | 'transform' | 'filter' | 'color' | 'left' | 'top';

/** Transition string for an element that swaps in/out with the beat. */
export function swap(on: boolean, inMs = 900, extraDelay = 0, props: Prop[] = ['opacity', 'transform', 'filter']): string {
  return on
    ? props.map((p) => `${p} ${inMs}ms ${EASE} ${IN_DELAY + extraDelay}ms`).join(', ')
    : props.map((p) => `${p} ${OUT_MS}ms cubic-bezier(.4,0,1,1) 0ms`).join(', ');
}

/** Scene layer container: leaves fast, enters after the previous scene has gone. */
export const layerFade = (on: boolean) => (on ? `opacity 500ms ease ${IN_DELAY - 60}ms` : `opacity ${OUT_MS}ms ease-in 0ms`);
