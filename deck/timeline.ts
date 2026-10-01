import type { Position, TimelineHost } from 'beatdeck';
import { config } from './deck.config';

/** Automatic sub-state. Every field has a value for every beat, so any beat renders straight from the URL. */
export interface Live {
  /** 01.2 characters of the scaffold command typed so far. */
  typed: number;
  /** 04.3 the beat counter has finished. */
  counted: boolean;
}

export function initialLive({ scene: s, beat: b }: Position): Live {
  return {
    typed: s === 0 && b <= 1 ? 0 : config.scaffold.length,
    counted: !(s === 3 && b === 2),
  };
}

/** Motion that runs by itself inside a beat. Only where the talk wants it; everything else waits for a click. */
export function timeline({ scene: s, beat: b }: Position, host: TimelineHost<Live>) {
  if (s === 0 && b === 1) {
    const cmd = config.scaffold;
    for (let i = 1; i <= cmd.length; i++) host.at(400 + i * 38, () => host.setLive({ typed: i }));
    host.at(400 + cmd.length * 38 + 900, () => host.autoGo({ scene: 0, beat: 2 }));
  }
  if (s === 3 && b === 2) {
    host.at(2300, () => host.setLive({ counted: true }));
  }
}
