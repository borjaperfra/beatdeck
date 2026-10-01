import { useDeck } from '../../state';
import { useGlitch } from 'beatdeck';
import { rng } from 'beatdeck';
import { Check, Cross } from '../../../components/Icons';
import { layerFade, swap } from '../../../components/motion';
import helmcodeLogo from '../../../assets/source/helmcode-logo.svg';

const BOOT: [string, 'ok' | 'fail' | ''][] = [
  ['booting kernel_panic...', ''],
  ['loading speaker: cristian_cordova', ''],
  ['loading talk: scaling_inference', ''],
  ['GPU detected', 'ok'],
  ['audience detected', 'ok'],
  ['boring_slides detected', 'fail'],
];
// per-letter tilt of the event wordmark: [char, rotate°, dy]
const WM1: [string, number, number][] = [['K', -3, 0], ['E', 2, -6], ['R', -2, 4], ['N', 3, -4], ['E', -1, 6], ['L', 3, -2]];
const WM2: [string, number, number][] = [['P', -2, 4], ['A', 3, -4], ['N', -3, 6], ['I', 2, -2], ['C', -2, 4], ['!', 5, -6]];

const EASE = 'cubic-bezier(.22,1,.36,1)';

/** 01 BOOT — standby, boot log, `sudo rm -rf /boring_talks`, event wordmark, talk title. */
export function Boot() {
  const d = useDeck((st) => ({ s: st.scene, b: st.beat, bootN: st.live.bootN, typed: st.live.typed, rmDone: st.live.rmDone }));
  const g = useGlitch();
  const here = d.s === 0;
  const b = d.b;
  const hot = g.active && g.violent && here;
  const r = (k: number) => rng(g.seed, k);
  const wmOn = here && b >= 2;
  const letters = (arr: typeof WM1, off: number) =>
    arr.map(([ch, rot, dy], i) => (
      <span key={i} style={{
        display: 'inline-block', opacity: wmOn ? 1 : 0,
        transform: wmOn ? `translateY(${dy}px) rotate(${rot}deg)` : `translateY(140px) rotate(${rot * 4}deg)`,
        transition: `all 600ms ${EASE}`, transitionDelay: `${wmOn ? (off + i) * 50 : 0}ms`,
      }}>{ch}</span>
    ));
  const titleOn = here && b === 3;
  const wmShadow = hot
    ? `${-10 + r(4) * 6}px 0 0 rgba(255,95,86,.85), ${14 + r(5) * 8}px ${8 + r(6) * 6}px 0 #4934E1`
    : '10px 10px 0 #4934E1';
  const stickerOn = here && b === 2;

  return (
    <div className="layer" style={{ opacity: here ? 1 : 0, transition: layerFade(here) }}>
      {/* 01.1 standby */}
      <div className="mono" style={{ position: 'absolute', left: 160, top: 500, fontSize: 32, color: 'rgba(255,255,255,.7)', opacity: here && b === 0 ? 1 : 0 }}>
        <span className="cursor">_</span>
      </div>

      {/* 01.2 boot log */}
      <div className="mono" style={{ position: 'absolute', left: 160, top: 330, fontSize: 32, lineHeight: '56px', opacity: here && b === 1 && !d.rmDone ? 1 : 0, transition: 'opacity 150ms' }}>
        {BOOT.map(([t, m], i) => (
          <div key={i} style={{ opacity: d.bootN > i ? 1 : 0, color: 'rgba(255,255,255,.72)', display: 'flex', gap: 18, alignItems: 'center' }}>
            <span style={{ color: 'rgba(255,255,255,.35)' }}>&gt;</span>
            <span>{t}</span>
            {m === 'ok' && <Check color="#fff" />}
            {m === 'fail' && <Cross color="var(--fault)" />}
          </div>
        ))}
        <div style={{ opacity: here && b === 1 && d.bootN >= 6 ? 1 : 0, display: 'flex', gap: 18, marginTop: 28, color: '#fff' }}>
          <span style={{ color: 'var(--violet-text)' }}>$</span>
          <span>{d.typed}<span className="cursor block-cursor" /></span>
        </div>
      </div>

      {/* 01.3 event wordmark (rebuilt from the KERNEL PANIC graphic) */}
      <div className="t-system" style={{ position: 'absolute', left: 0, top: 188, width: 1920, textAlign: 'center', fontSize: 26, letterSpacing: '.14em', color: 'var(--violet-text)', opacity: here && b === 2 ? 1 : 0, transition: swap(here && b === 2, 600, 60, ['opacity']) }}>
        // ai open models conference · #01
      </div>
      <div style={{ position: 'absolute', left: 0, top: 250, width: 1920, textAlign: 'center', opacity: here && b === 2 ? 1 : 0, transform: here && b === 3 ? 'scale(.9)' : 'none', transformOrigin: '50% 50%', transition: `transform 1200ms ${EASE}, opacity 300ms` }}>
        <div className="event" style={{ fontSize: 300, lineHeight: 0.92, color: 'var(--off-white)', textShadow: wmShadow }}>
          <div>{letters(WM1, 0)}</div>
          <div>{letters(WM2, 6)}</div>
        </div>
      </div>
      <div className="t-system" style={{ position: 'absolute', left: 0, top: 830, width: 1920, textAlign: 'center', fontSize: 28, letterSpacing: '.12em', color: 'rgba(255,255,255,.6)', opacity: here && b === 2 ? 1 : 0, transition: swap(here && b === 2, 600, 360, ['opacity']) }}>
        madrid · 06 oct · casa del lector, matadero
      </div>
      {/* event sticker from the graphic (opening only) */}
      <div className="mono" style={{
        position: 'absolute', left: 170, top: 130, opacity: stickerOn ? 1 : 0,
        transform: `rotate(${stickerOn ? -7 : -15}deg) scale(${stickerOn ? 1 : 1.25})`, transformOrigin: '0 50%',
        transition: 'opacity 220ms ease-out, transform 260ms cubic-bezier(.2,.9,.3,1)', transitionDelay: `${stickerOn ? 550 : 0}ms`,
        fontWeight: 500, fontSize: 26, letterSpacing: '.06em', textTransform: 'uppercase', whiteSpace: 'nowrap',
        background: '#1c1c1c', border: '0.5px solid rgba(255,255,255,.18)', boxShadow: '5px 5px 0 #4934E1', padding: '12px 20px', color: 'rgba(255,255,255,.9)',
      }}>
        sudo rm -rf /boring_talks
      </div>

      {/* 01.4 talk title — the Helmcode world takes over. One left edge (x=120) for everything. */}
      <img src={helmcodeLogo} alt="Helmcode" style={{ position: 'absolute', left: 120, top: 110, height: 44, opacity: titleOn ? 1 : 0, transition: swap(titleOn, 800, 500, ['opacity']) }} />
      <div style={{ position: 'absolute', left: 120, top: 290, opacity: titleOn ? 1 : 0, transform: `translateY(${titleOn ? 0 : 40}px)`, filter: `blur(${titleOn ? 0 : 10}px)`, transition: swap(titleOn, 1100, 0) }}>
        <div style={{ fontWeight: 500, fontSize: 230, letterSpacing: '-0.045em', lineHeight: 0.92 }}>Escalando</div>
        <div style={{ fontWeight: 500, fontSize: 230, letterSpacing: '-0.045em', lineHeight: 0.92 }}>inferencia</div>
        <div className="mono" style={{ fontSize: 44, color: 'var(--violet-text)', marginTop: 56 }}>de 0 a +1000 usuarios</div>
      </div>
      <div style={{ position: 'absolute', left: 120, right: 120, top: 900, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', whiteSpace: 'nowrap', opacity: titleOn ? 1 : 0, transition: swap(titleOn, 800, 700, ['opacity']) }}>
        <div>
          <div style={{ fontSize: 34, fontWeight: 500, letterSpacing: '-0.01em' }}>Cristian Córdova</div>
          <div className="mono" style={{ fontSize: 22, color: 'rgba(255,255,255,.6)', marginTop: 10 }}>Founder &amp; CEO de Helmcode · @barckcode</div>
        </div>
        <div className="mono" style={{ fontSize: 22, color: 'rgba(255,255,255,.6)' }}>helmcode.com · nan.builders</div>
      </div>
    </div>
  );
}
