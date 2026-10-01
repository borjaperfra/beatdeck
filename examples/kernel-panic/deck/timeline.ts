import { glitch, type Position, type TimelineHost } from 'beatdeck';
import type { Live } from './types';
import { deckConfig } from './deck.config';

export const BOOT_CMD = 'sudo rm -rf /boring_talks';

/** Initial automatic state of a beat. Every beat is reconstructable from this alone. */
export function initialLive({ scene: s, beat: b }: Position): Live {
  const booting = s === 0 && b <= 1;
  return {
    bootN: booting ? 0 : 6,
    typed: booting ? '' : BOOT_CMD,
    rmDone: !booting,
    users: s < 5 || (s === 5 && b === 0) ? 25 : 100,
    warnN: s === 5 && b === 4 ? 0 : 3,
    panic: s === 5 && b === 5,
    black: false,
    tokensDone: !(s === 7 && b === 4),
    fine: false,
  };
}

/** Automatic motion inside a beat (only where v3 intends it). Times are v3's. */
export function timeline({ scene: s, beat: b }: Position, host: TimelineHost<Live>) {
  const { at } = host;
  if (s === 0 && b === 1) {
    for (let i = 1; i <= 6; i++) at(250 + i * 270, () => host.setLive({ bootN: i }));
    const t1 = 250 + 6 * 270 + 380;
    for (let i = 1; i <= BOOT_CMD.length; i++) at(t1 + i * 36, () => host.setLive({ typed: BOOT_CMD.slice(0, i) }));
    const t2 = t1 + BOOT_CMD.length * 36 + 320;
    at(t2, () => glitch.start(240));
    at(t2 + 160, () => host.setLive({ rmDone: true }));
    at(t2 + 520, () => host.autoGo({ scene: 0, beat: 2 }));
  } else if (s === 0 && b === 2) {
    at(1000, () => glitch.start(140));
    at(3600, () => host.autoGo({ scene: 0, beat: 3 }));
  } else if (s === 5 && b === 0) {
    [31, 46, 68, 82, 100].forEach((u, i) => at(500 + i * 850, () => host.setLive({ users: u })));
  } else if (s === 5 && b === 4) {
    [1, 2, 3].forEach((n) => at(300 + (n - 1) * 1000, () => host.setLive({ warnN: n })));
  } else if (s === 5 && b === 5) {
    at(0, () => glitch.start(null, true));
    at(deckConfig.panicMs, () => {
      glitch.stop();
      host.setLive({ panic: false, black: true });
    });
  } else if (s === 7 && b === 4) {
    const end = deckConfig.tokenCountMs + 600; // Finale COUNT_DELAY
    at(end + 150, () => host.setLive({ tokensDone: true }));
    at(end + 1600, () => host.setLive({ fine: true }));
  }
}
