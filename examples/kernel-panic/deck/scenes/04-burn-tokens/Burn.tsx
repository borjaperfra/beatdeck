import { usePos } from 'beatdeck';
import { Sticker } from '../../../components/Sticker';
import { Typewriter } from '../../../components/Typewriter';
import { EASE, layerFade, swap } from '../../../components/motion';
import qwencito from '../../../assets/stickers/qwencito.png';

/** Slides 09–11: the three questions, typed one after the other in the same place. */
const QS: string[][] = [
  ['¿Qué hardware', '(GPUs) necesitamos?'],
  ['¿Qué modelos', 'queremos correr?'],
  ['¿Qué queremos', 'hacer con la IA?'],
];
export const BURN_BEAT = 3;
export const QWENCITO_BEAT = 4;

/** 04 BURN TOKENS — three questions, BURN TOKENS. (tokens on the canvas), then Qwencito. */
export function Burn() {
  const { s, b, entry } = usePos();
  const here = s === 3;
  const card = here && b === QWENCITO_BEAT;
  const burn = here && b >= BURN_BEAT;
  const burnBeat = here && b === BURN_BEAT;

  return (
    <div className="layer" style={{ opacity: here ? 1 : 0, transition: layerFade(here) }}>
      {QS.map((lines, i) => {
        const on = here && b === i;
        return (
          <div key={i} className="t-editorial" style={{ position: 'absolute', left: 120, top: 350, fontSize: 160, opacity: on ? 1 : 0, transition: swap(on, 200, -300, ['opacity']) }}>
            <Typewriter lines={lines} run={on} entry={entry} charMs={36} />
          </div>
        );
      })}

      {/* BURN TOKENS. — at 04.5 it becomes the small header of the Qwencito moment */}
      <div style={{ position: 'absolute', left: 120, top: 120, transform: card || s > 3 ? 'translate(0,-10px) scale(.3)' : 'none', transformOrigin: '0 0', opacity: burn ? 1 : 0, transition: `transform 1200ms ${EASE}, opacity ${burn ? 400 : 250}ms` }}>
        <div style={{ fontWeight: 500, fontSize: 250, lineHeight: 0.86, letterSpacing: '-0.04em' }}>BURN</div>
        <div style={{ fontWeight: 500, fontSize: 250, lineHeight: 0.86, letterSpacing: '-0.04em', textShadow: '12px 12px 0 #4934E1' }}>TOKENS.</div>
      </div>
      {/* slide 12, verbatim */}
      <div style={{ position: 'absolute', left: 120, top: 650, fontWeight: 500, fontSize: 42, letterSpacing: '-0.02em', color: 'rgba(255,255,255,.92)', textShadow: '0 0 22px #0a0a0a, 0 0 8px #0a0a0a', opacity: burnBeat ? 1 : 0, transition: swap(burnBeat, 900, 700, ['opacity']) }}>
        Queremos quemar tokens para crear cosas con código.
      </div>

      {/* slide 13 — Qwencito para los amigos */}
      <div className="mono" style={{ position: 'absolute', left: 120, top: 430, width: 1160, opacity: card ? 1 : 0, transform: `translateY(${card ? 0 : 24}px)`, transition: swap(card, 900, 300) }}>
        <div className="t-eyebrow">// model selected</div>
        <div style={{ fontSize: 96, letterSpacing: '-0.03em', margin: '26px 0 48px' }}>qwen3.6-35b-a3b</div>
        <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', rowGap: 18, fontSize: 36 }}>
          <span style={{ color: 'rgba(255,255,255,.55)' }}>status</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 16 }}><span style={{ width: 14, height: 14, borderRadius: '50%', background: 'var(--ok)' }} />READY</span>
          <span style={{ color: 'rgba(255,255,255,.55)' }}>nickname</span><span>qwencito</span>
        </div>
      </div>
      <Sticker on={card} src={qwencito} alt="Qwencito" x={1330} y={150} w={450} h={300} rot={-6} delay={1100} />
    </div>
  );
}

/** Canvas zones where burn tokens pass dimmed, so the text above them always reads. */
export function burnQuietZones(b: number): [number, number, number, number][] {
  const chrome: [number, number, number, number][] = [[0, 0, 1920, 72], [0, 1000, 1920, 1080]];
  if (b === BURN_BEAT) return [...chrome, [100, 110, 1500, 580], [100, 630, 1150, 710]];
  if (b === QWENCITO_BEAT) return [...chrome, [100, 90, 540, 290], [100, 420, 1300, 820], [1320, 140, 1790, 470]];
  return chrome;
}
