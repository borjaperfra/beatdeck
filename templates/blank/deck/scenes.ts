import type { SceneDef } from 'beatdeck';

/**
 * The talk's beat map: scenes → beats. One click = one beat.
 * `ref` = where it comes from in the source, `source` = what the source says, `note` = speaker cue
 * (the presenter view shows all three; the audience never does).
 */
export const SCENES: SceneDef[] = [
  {
    id: '01', title: 'OPEN',
    beats: [
      { name: 'standby', note: 'Calm screen while people sit down. The first click starts the talk.' },
      { name: 'title' },
    ],
  },
  {
    id: '02', title: 'END',
    beats: [
      { name: 'questions' },
    ],
  },
];
