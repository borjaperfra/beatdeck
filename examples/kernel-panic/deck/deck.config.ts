/**
 * Stage configuration. Everything that may need changing five minutes before going on stage lives here.
 * After editing, rebuild (`npm run build` / `npm run present`).
 */
export const deckConfig = {
  /**
   * Destination of the QR code on the final Q&A screen.
   * The source deck only had a placeholder ("QR"), so the real URL is unknown.
   * While this is "TODO" no QR is drawn on stage and the build prints a warning.
   */
  speakerQrUrl: 'TODO',

  /** Duration of the KERNEL PANIC failure (06.6) before cutting to absolute black. */
  panicMs: 520,

  /** Hide the mouse cursor after this many ms without movement. */
  cursorHideMs: 2000,

  /** Duration of the 50B token counter (08.5). */
  tokenCountMs: 4600,
} as const;

export type DeckConfig = typeof deckConfig;

/** Namespace for the presenter channel and the timer in localStorage. */
export const DECK_ID = 'kernel-panic-01';
