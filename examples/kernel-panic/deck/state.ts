import { deck, useDeck as useDeckBase, type DeckState } from 'beatdeck';
import type { Live } from './types';

/** `useDeck` / `getState` typed with this talk's `Live` sub-state. */
export const useDeck = <T,>(selector: (s: DeckState<Live>) => T): T => useDeckBase<T, Live>(selector);
export const getState = () => deck.getState() as DeckState<Live>;
export const subscribe = (l: () => void) => deck.subscribe(l);
