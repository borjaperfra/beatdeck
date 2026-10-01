import { defineDeck } from 'beatdeck';
import '../themes/neutral.css';
import { config } from './deck.config';
import { SCENES } from './scenes';
import { initialLive, timeline, type Live } from './timeline';
import { Open } from './scenes/01-Open';
import { Idea } from './scenes/02-Idea';
import { State } from './scenes/03-State';
import { Proof } from './scenes/04-Proof';
import { Cost } from './scenes/05-Cost';
import { Numbers } from './scenes/06-Numbers';
import { End } from './scenes/07-End';

/** Every layer of the stage, back to front. All stay mounted; each shows itself for its own scene. */
function Stage() {
  return (
    <>
      <Open />
      <Idea />
      <State />
      <Proof />
      <Cost />
      <Numbers />
      <End />
    </>
  );
}

export default defineDeck<Live>({
  id: 'beatdeck-demo',
  title: config.title,
  lang: 'en',
  scenes: SCENES,
  Stage,
  initialLive,
  timeline,
  // the boot beats are automatic: stepping back from anywhere in 01 returns to standby
  prev: ({ scene, beat }) => (scene === 0 ? (beat === 0 ? null : { scene: 0, beat: 0 }) : undefined),
  fonts: ['400 100px "Inter Variable"', '600 100px "Inter Variable"', '400 32px "JetBrains Mono Variable"'],
  qrUrl: config.qrUrl,
});
