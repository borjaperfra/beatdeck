import { usePos } from 'beatdeck';
import cfMark from '../../../assets/source/cloudflare-mark.png';
import k8sMark from '../../../assets/source/kubernetes-mark.png';
import { EASE, IN_DELAY, layerFade, swap } from '../../../components/motion';
import { Typewriter } from '../../../components/Typewriter';

/** Sizes shared with the 07.2 selection frames in architecture-layouts.ts (F.cf / F.k8s at b=1). */
export const COMBO = { cfTop: 270, kTop: 590, frameH: 180, font: 110 };

/**
 * Slide 21 — a word + its real mark inside a selection box. The word types in, the mark lands after it.
 * At 07.3/07.4 the pair shrinks into the label of its layer boundary (mark sized in em, so it scales with the word).
 */
function Word({ text, mark, markH, color, big, x, y, yBig, on, entry, typeDelay, spin, type }: {
  text: string; mark: string; markH: number; color: string; big: boolean; x: number; y: number; yBig: number;
  on: boolean; entry: number; typeDelay: number; spin?: boolean; type: boolean;
}) {
  // types only on its own reveal beat (07.2); on later beats it is simply there
  const typing = on && type;
  const markDelay = typeDelay + text.length * 45 + 150;
  return (
    <div style={{
      position: 'absolute', left: big ? 160 : x, top: big ? yBig : y, fontSize: big ? COMBO.font : 22,
      letterSpacing: big ? '-0.03em' : '0.12em', fontWeight: 500, lineHeight: 1, textTransform: 'uppercase', whiteSpace: 'nowrap',
      color, opacity: on ? 1 : 0, display: 'flex', alignItems: 'center', transition: `left 1000ms ${EASE}, top 1000ms ${EASE}, font-size 1000ms ${EASE}, letter-spacing 1000ms ${EASE}, opacity 300ms`,
    }}>
      <Typewriter lines={[text]} run={typing} entry={entry} charMs={45} delay={typeDelay} cursorAfter={250} />
      <img src={mark} alt="" style={{
        height: `${markH}em`, marginLeft: '0.4em',
        opacity: on ? 1 : 0,
        transform: on ? 'none' : spin ? 'rotate(-150deg) scale(.6)' : 'translateY(.25em) scale(.8)',
        transition: on ? `opacity 400ms ease ${type ? markDelay : 0}ms, transform 900ms ${EASE} ${type ? markDelay : 0}ms` : 'opacity 200ms, transform 200ms',
      }} />
    </div>
  );
}

/** 07 REBUILD — `> reboot_`, CLOUDFLARE + KUBERNETES, words → layers. The services themselves are the architecture world. */
export function Rebuild() {
  const { s, b, entry } = usePos();
  const here = s === 6;
  const on = here && b >= 1;
  const cfBig = here && b === 1;
  const kBig = here && b <= 2;
  const plusOn = cfBig;
  const yIn = (top: number) => top + (COMBO.frameH - COMBO.font) / 2;

  return (
    <div className="layer" style={{ opacity: here ? 1 : 0, transition: layerFade(here) }}>
      <div className="mono" style={{ position: 'absolute', left: 0, top: 510, width: 1920, textAlign: 'center', fontSize: 34, color: 'rgba(255,255,255,.75)', opacity: here && b === 0 ? 1 : 0 }}>
        &gt; reboot<span className="cursor">_</span>
      </div>
      <Word text="Cloudflare" mark={cfMark} markH={0.62} color="var(--cloudflare)" big={cfBig} x={162} y={92} yBig={yIn(COMBO.cfTop)} on={on} entry={entry} typeDelay={IN_DELAY + 200} type={cfBig} />
      <div style={{ position: 'absolute', left: 170, top: COMBO.cfTop + COMBO.frameH + 22, fontWeight: 300, fontSize: 96, lineHeight: 1, color: 'rgba(255,255,255,.55)', opacity: plusOn ? 1 : 0, transform: `rotate(${plusOn ? 0 : -90}deg)`, transition: swap(plusOn, 700, 1100, ['opacity', 'transform']) }}>+</div>
      <Word text="Kubernetes" mark={k8sMark} markH={0.82} color="#fff" big={kBig} x={162} y={362} yBig={yIn(COMBO.kTop)} on={on} entry={entry} typeDelay={IN_DELAY + 1500} type={cfBig} spin />
      {/* slide 22 says "parte de": this is part of the current architecture, not all of it */}
      <div className="t-eyebrow" style={{ position: 'absolute', left: 220, top: 935, fontSize: 20, opacity: here && b === 4 ? 1 : 0, transition: swap(here && b === 4, 900, 900, ['opacity']) }}>
        // parte de la arquitectura actual
      </div>
    </div>
  );
}
