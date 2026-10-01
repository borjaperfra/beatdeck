import type { ComponentType } from 'react';

/** 0-based internally; the URL hash and every UI label are 1-based (`#5.4` → scene 4, beat 3). */
export interface Position {
  scene: number;
  beat: number;
}

export interface BeatDef {
  /** Short name, shown in the overview, the presenter view and the debug panel. */
  name: string;
  /** The beat has automatic motion (a timeline) — the presenter view flags it. */
  auto?: boolean;
  /** Where this beat comes from in the source material (e.g. "slide 04–05"). */
  ref?: string;
  /** What the source says — the presenter reads this, the audience never does. */
  source?: string;
  /** Speaker cue. */
  note?: string;
  /**
   * `npm run verify`: % of pixels allowed to differ between reaching this beat by walking and by URL.
   * Only for beats with intentionally random or live layers (particles, dithering, clocks). Default: --diff.
   */
  tolerance?: number;
}

export interface SceneDef {
  /** Short id shown in the chrome and labels ("01"). */
  id: string;
  title: string;
  beats: BeatDef[];
}

export interface DeckState<L = Record<string, never>> extends Position {
  /** Automatic sub-state of the current beat. Reset to `initialLive(pos)` on every entry. */
  live: L;
  /** Increments on every beat entry (even re-entering the same beat) — lets components restart local timelines. */
  entry: number;
  /** Previous position (for transitions that depend on where we came from). */
  from: Position | null;
  /** Operator blackout (B key). Not part of the talk. */
  blackout: boolean;
}

export interface TimelineHost<L> {
  /** The beat's GSAP timeline. Killed when the speaker leaves the beat. */
  tl: gsap.core.Timeline;
  /** Schedule `fn` at `ms` after the beat entry. */
  at(ms: number, fn: () => void): void;
  setLive(p: Partial<L>): void;
  /** Automatic advance to another beat (suppressed in `?capture=1`). */
  autoGo(p: Position): void;
  /** Run when the speaker leaves the beat (stop effects started outside the timeline). */
  onExit(fn: () => void): void;
}

export interface DeckDefinition<L = Record<string, never>> {
  /** Namespace for localStorage and the presenter channel. Lowercase, no spaces. */
  id: string;
  /** Document title and default chrome label. */
  title: string;
  /** `lang` attribute of the page. */
  lang?: string;
  scenes: SceneDef[];

  /** Every layer of the stage. All layers stay mounted; each one reads the position and shows itself. */
  Stage: ComponentType;
  /** System chrome on top of the stage. Defaults to `DefaultChrome`; `null` = the deck draws its own. */
  Chrome?: ComponentType<{ black: boolean }> | null;
  /** Drawn above the blackout cover (e.g. a message that must survive a cut to black). */
  Overlay?: ComponentType;
  /** Extra rows for the `?debug=1` panel. */
  Debug?: ComponentType;

  /** Initial automatic state of a beat. Every beat must be reconstructable from this alone. */
  initialLive?: (p: Position) => L;
  /** Automatic motion inside a beat. Schedule with `host.at`; the engine kills it when the beat is left. */
  timeline?: (p: Position, host: TimelineHost<L>) => void;
  /** Override "previous" (e.g. stepping back from automatic beats). Return `undefined` for the default. */
  prev?: (p: Position) => Position | null | undefined;

  /** The stage background goes to pure #000 and the default chrome hides. */
  isBlack?: (s: DeckState<L>) => boolean;
  /** A full black cover above everything except `Overlay` (operator blackout always counts). */
  isCut?: (s: DeckState<L>) => boolean;

  /** Font faces to wait for before the first frame, as `document.fonts.load` specs (bounded at 2.5 s). */
  fonts?: string[];
  /** Hide the mouse cursor after this many ms without movement. Default 2000. */
  cursorHideMs?: number;
  /** Destination of the QR on the closing screen. `'TODO'` or empty = no QR (the presenter view warns). */
  qrUrl?: string;
}
