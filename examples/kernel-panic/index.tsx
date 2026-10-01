import { useState } from 'react';
import { deck, defineDeck, useGlitch, useStagePixelRatio } from 'beatdeck';
import './styles/fonts.css';
import './styles/tokens.css';
import './styles/stage.css';
import './styles/typography.css';
import { DECK_ID, deckConfig } from './deck/deck.config';
import { SCENES } from './deck/scenes';
import { initialLive, timeline } from './deck/timeline';
import { getState, useDeck } from './deck/state';
import type { Live } from './deck/types';
import { ParticleCanvas, canvasOptions } from './simulation/ParticleCanvas';
import { ArchitectureWorld } from './architecture/ArchitectureWorld';
import { getArchitectureState } from './architecture/architecture-state';
import { Boot } from './deck/scenes/01-boot/Boot';
import { Origin } from './deck/scenes/02-origin/Origin';
import { Local } from './deck/scenes/03-local-selfhosted/Local';
import { Burn } from './deck/scenes/04-burn-tokens/Burn';
import { ScaleOverlay } from './deck/scenes/06-scale/ScaleOverlay';
import { GlitchLayer, jitterTransform } from './deck/scenes/06-scale/Panic';
import { PanicScreen } from './deck/scenes/06-scale/PanicScreen';
import { Rebuild } from './deck/scenes/07-rebuild/Rebuild';
import { Finale } from './deck/scenes/08-finale/Finale';
import { Chrome } from './Chrome';

/** Pure black: standby/boot, the reboot prompt, after the panic. */
const isBlack = (s: { scene: number; beat: number; live: Live }) =>
  s.live.black || (s.scene === 6 && s.beat === 0) || (s.scene === 0 && s.beat <= 1);

/** Every layer, back to front. The whole stage (chrome included) shakes during the panic. */
function Stage() {
  const g = useGlitch();
  const absBlack = useDeck((st) => isBlack(st) || st.blackout);
  const pixelRatio = useStagePixelRatio();
  return (
    <div className="jitter" style={{ transform: jitterTransform(g) }}>
      <ParticleCanvas pixelRatio={pixelRatio} />
      <ArchitectureWorld />
      <div className="layer"><ScaleOverlay /></div>
      <Boot />
      <Origin />
      <Local />
      <Burn />
      <Rebuild />
      <Finale />
      <Chrome absBlack={absBlack} />
      <div className="layer"><GlitchLayer /></div>
    </div>
  );
}

/** Extra rows for `?debug=1`. */
function Debug() {
  const [showArch, setShowArch] = useState(false);
  const st = getState();
  const arch = showArch ? getArchitectureState(st.scene, st.beat, st.live) : null;
  return (
    <>
      <div className="debug-row">
        <button onClick={() => deck.go({ scene: 5, beat: 5 })}>trigger panic</button>
        <button onClick={() => deck.go({ scene: 7, beat: 0 })}>finale</button>
        <button onClick={() => { canvasOptions.grid = !canvasOptions.grid; deck.go(st); }}>grid {canvasOptions.grid ? 'on' : 'off'}</button>
        <button onClick={() => setShowArch((v) => !v)}>arch</button>
      </div>
      {arch && (
        <pre>
          {arch.nodes.filter((n) => n.on).map((n) => `${n.id.padEnd(8)} ${n.rect!.join(',').padEnd(18)} ${n.status}`).join('\n')}
          {'\nedges: ' + arch.edges.filter((e) => e.on).map((e) => e.id).join(' ')}
          {'\nrate: ' + arch.rate.toFixed(1)}
        </pre>
      )}
    </>
  );
}

/**
 * "Escalando inferencia · de 0 a cientos de usuarios" — Cristian Córdova, KERNEL PANIC #01, Madrid.
 * The talk beatdeck was extracted from. 8 scenes, 47 beats.
 */
export default defineDeck<Live>({
  id: DECK_ID,
  title: 'Escalando inferencia · KERNEL PANIC',
  lang: 'es',
  scenes: SCENES,
  Stage,
  Chrome: null,
  Overlay: PanicScreen,
  Debug,
  initialLive,
  timeline,
  // the boot beats are automatic: stepping back from anywhere in 01 returns to standby
  prev: ({ scene, beat }) => (scene === 0 ? (beat === 0 ? null : { scene: 0, beat: 0 }) : undefined),
  isBlack,
  // after the 520 ms panic: ABSOLUTE black until the next input (only the kernel message survives, as Overlay)
  isCut: (s) => s.live.black,
  fonts: ['500 100px "Roboto"', '300 100px "Roboto"', '400 32px "Roboto Mono"', '500 32px "Roboto Mono"', '400 100px "Archivo Black"'],
  cursorHideMs: deckConfig.cursorHideMs,
  qrUrl: deckConfig.speakerQrUrl,
});
