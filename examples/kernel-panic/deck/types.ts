export type { Position } from 'beatdeck';

/** Automatic sub-state of the current beat. Reset to the beat's initial value on every entry. */
export interface Live {
  /** 01.2 boot log lines shown (0–6). */
  bootN: number;
  /** 01.2 typed command. */
  typed: string;
  /** 01.2 command executed → log hides. */
  rmDone: boolean;
  /** 06.x active users. */
  users: number;
  /** 06.5 warnings shown (0–3). */
  warnN: number;
  /** 06.6 panic in progress. */
  panic: boolean;
  /** 06.6 panic finished → absolute black. */
  black: boolean;
  /** 08.5 counter finished. */
  tokensDone: boolean;
  /** 08.5 "this is fine" punchline visible. */
  fine: boolean;
}
