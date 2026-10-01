import { defineDeck } from 'beatdeck';
import '../themes/neutral.css';
import { config } from './deck.config';
import { SCENES } from './scenes';
import { Open } from './scenes/01-Open';
import { End } from './scenes/02-End';

/** Every layer of the stage, back to front. All stay mounted; each shows itself for its own scene. */
function Stage() {
  return (
    <>
      <Open />
      <End />
    </>
  );
}

export default defineDeck({
  id: 'my-talk',
  title: config.title,
  lang: 'en',
  scenes: SCENES,
  Stage,
  fonts: ['400 100px "Inter Variable"', '600 100px "Inter Variable"', '400 32px "JetBrains Mono Variable"'],
  qrUrl: config.qrUrl,
});
