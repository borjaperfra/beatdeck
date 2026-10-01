import type { SceneDef } from 'beatdeck';

/**
 * The talk's beat map: scenes → beats. One click = one beat. This is the contract every scene component
 * reads from (by index) and what the overview, presenter view and debug panel show.
 * `ref` / `source` point back to the source material; `note` is the speaker cue.
 */
export const SCENES: SceneDef[] = [
  {
    id: '01', title: 'OPEN',
    beats: [
      { name: 'standby', note: 'Black screen with a prompt. One click starts the boot.' },
      { name: 'boot', auto: true, note: 'Automatic: the scaffold command types itself, then the title.' },
      { name: 'title' },
    ],
  },
  {
    id: '02', title: 'IDEA',
    beats: [
      { name: 'slides are pages' },
      { name: 'talks are beats' },
      { name: 'strike pages' },
      { name: 'rule · one click' },
      { name: 'rule · from the url' },
      { name: 'rule · motion inside' },
    ],
  },
  {
    id: '03', title: 'STATE',
    beats: [
      { name: 'state', note: 'The state box shows the real position — try going back and forth.' },
      { name: 'input' },
      { name: 'stage' },
      { name: 'url' },
      { name: 'presenter' },
    ],
  },
  {
    id: '04', title: 'PROOF',
    beats: [
      { name: 'build', note: 'Real output of npm run build on this deck.' },
      { name: 'verify', note: 'Real output of npm run verify on this deck.' },
      { name: 'what it checks' },
    ],
  },
  {
    id: '05', title: 'COST',
    beats: [
      { name: 'axes', note: 'Real npm run verify timings on one laptop: blank starter, this demo, Kernel Panic.' },
      { name: 'three decks' },
    ],
  },
  {
    id: '06', title: 'NUMBERS',
    beats: [
      { name: '0 requests' },
      { name: '1920 × 1080' },
      { name: 'beats', auto: true, note: 'Automatic: counts every beat in this deck.' },
    ],
  },
  {
    id: '07', title: 'END',
    beats: [
      { name: 'make your own' },
      { name: 'q&a' },
    ],
  },
];

export const TOTAL_BEATS = SCENES.reduce((n, s) => n + s.beats.length, 0);
