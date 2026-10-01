import { useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { useDeck } from '../../state';
import { deckConfig } from '../../../deck/deck.config';
import { KernelPanicMark } from '../../../components/KernelPanicMark';
import { LinkedInLogo, XLogo } from '../../../components/Icons';
import { CountUp } from '../../../components/CountUp';
import { EASE, IN_DELAY, layerFade, swap } from '../../../components/motion';
import { QR, qrConfigured } from 'beatdeck';
import thisIsFine from '../../../assets/source/this-is-fine.jpg';
import helmcodeLogo from '../../../assets/source/helmcode-logo.svg';
import {
  VizCanvas, drawMonths, drawUsers, drawMap, drawPortrait,
  MONTHS_W, MONTHS_H, USERS_W, USERS_H, USERS_MS, MAP_W, MAP_H, MAP_SCAN_MS, PINS_MS, PORTRAIT_MS,
} from './viz';

const TOKENS = 50_000_000_000;
const fmt = (n: number) => Math.round(n).toLocaleString('es-ES');
/** the count starts once the number has faded in */
export const COUNT_DELAY = 600;
/** Fixed-width odometer: the final 14-character width from the first frame, leading zeros dimmed. */
const odometer = (n: number) => {
  const full = fmt(Math.round(n) + 1e11).slice(1); // a leading '1' keeps the grouping of all 11 digits
  const i = full.search(/[1-9]/);
  const head = i < 0 ? full : full.slice(0, i), tail = i < 0 ? '' : full.slice(i);
  return `<span style="color:rgba(255,255,255,.14)">${head}</span>${tail}`;
};
const PORTRAIT = 400;
const hasQr = qrConfigured(deckConfig.speakerQrUrl);
const drawPortrait400 = drawPortrait(PORTRAIT);

/** 50,000,000,000 counted over ~4.6 s; written straight to the DOM so React does not re-render at 60 fps. */
function TokenCounter({ run, entry }: { run: boolean; entry: number }) {
  const el = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const node = el.current!;
    if (!run) { node.innerHTML = odometer(TOKENS); return; }
    const o = { v: 0 };
    node.innerHTML = odometer(0);
    const tw = gsap.to(o, { v: TOKENS, duration: deckConfig.tokenCountMs / 1000, delay: COUNT_DELAY / 1000, ease: 'power3.inOut', onUpdate: () => { node.innerHTML = odometer(o.v); } });
    return () => { tw.kill(); };
  }, [run, entry]);
  return <div ref={el} className="t-numeral" style={{ fontSize: 230, lineHeight: 0.9, letterSpacing: '-0.02em' }}>{fmt(TOKENS)}</div>;
}

/**
 * Slide 23, one metric per beat: the number counts up on the left, its picture builds on the right.
 */
type Viz = { draw: ((x: CanvasRenderingContext2D, t: number) => void) | null; w: number; h: number; ms: number; left: number; countMs: number; countDelay: number };

/** nan.builders/docs/models — the cluster today (30/09). `true` = new since the talk was written. */
const MODELS: [string, string, boolean?][] = [
  ['glm5.3', 'llm · coding'], ['deepseek-v4-flash', 'llm · vision'], ['glm5.3-flash', 'llm · vision'],
  ['qwen3.8-flash', 'llm · vision'], ['mimo-v2.6-flash', 'omni · audio', true], ['gemma4', 'llm · vision'],
  ['qwen3.6', 'llm · qwencito'], ['qwen3-embedding', 'embeddings'], ['rerank', 'reranking'],
  ['kokoro', 'text-to-speech'], ['whisper', 'speech-to-text'], ['flux-2-klein', 'imagen'], ['qwen-image-2.1', 'imagen', true],
];

function ModelList({ on }: { on: boolean }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '380px 380px', gridAutoFlow: 'column', gridTemplateRows: 'repeat(7, 68px)', columnGap: 20 }}>
      {MODELS.map(([name, kind, isNew], i) => (
        <div key={name} style={{ opacity: on ? 1 : 0, transform: `translateY(${on ? 0 : 10}px)`, transition: on ? `opacity 500ms ease ${IN_DELAY + 200 + i * 110}ms, transform 600ms ${EASE} ${IN_DELAY + 200 + i * 110}ms` : 'opacity 200ms ease-in, transform 200ms' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
            <span style={{ fontSize: 30, fontWeight: 500, letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>{name}</span>
            {isNew && <span className="mono" style={{ fontSize: 14, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--ok)' }}>new</span>}
          </div>
          <div className="mono" style={{ fontSize: 19, color: 'var(--violet-text)', marginTop: 4, letterSpacing: '.04em' }}>{kind}</div>
        </div>
      ))}
    </div>
  );
}
const METRICS: [number, string, string, string, string, Viz][] = [
  [5, '~', '', 'meses', '', { draw: drawMonths, w: MONTHS_W, h: MONTHS_H, ms: 2400, left: 1040, countMs: 2200, countDelay: 0 }],
  [900, '', '+', 'usuarios', '', { draw: drawUsers, w: USERS_W, h: USERS_H, ms: USERS_MS, left: 1040, countMs: USERS_MS, countDelay: 0 }],
  [80, '', '+', 'países', '', { draw: drawMap, w: MAP_W, h: MAP_H, ms: MAP_SCAN_MS + PINS_MS, left: 1800 - MAP_W, countMs: PINS_MS, countDelay: MAP_SCAN_MS }],
  [10, '', '+', 'modelos', 'no solo LLMs', { draw: null, w: 0, h: 0, ms: 0, left: 1000, countMs: 1900, countDelay: 0 }],
];

function Metric({ i, on, past, entry }: { i: number; on: boolean; past: boolean; entry: number }) {
  const [value, prefix, suffix, label, sub, viz] = METRICS[i];
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: on ? 1 : 0, transform: `translateY(${on ? 0 : past ? -30 : 30}px)`, transition: swap(on, 900) }}>
      <div style={{ position: 'absolute', left: 120, top: 250 }}>
        <div className="t-numeral" style={{ fontSize: 360 }}>
          <CountUp value={value} from={0} entry={on ? entry : -1} ms={viz.countMs} delay={IN_DELAY + viz.countDelay} ease="power1.out" prefix={prefix} suffix={suffix} />
        </div>
        <div className="t-statement" style={{ fontSize: 96, letterSpacing: '-0.03em', marginTop: 30, lineHeight: 1 }}>{label}</div>
        {sub && <div className="mono" style={{ fontSize: 28, color: 'rgba(255,255,255,.6)', marginTop: 16 }}>{sub}</div>}
      </div>
      <div style={{ position: 'absolute', left: viz.left, top: 540, transform: 'translateY(-50%)' }}>
        {viz.draw ? <VizCanvas w={viz.w} h={viz.h} draw={viz.draw} duration={viz.ms + IN_DELAY} run={on} entry={entry} /> : <ModelList on={on} />}
      </div>
    </div>
  );
}

export function Finale() {
  const d = useDeck((st) => ({ s: st.scene, b: st.beat, entry: st.entry, done: st.live.tokensDone, fine: st.live.fine }));
  const here = d.s === 7, b = d.b;
  const tkO = here && b === 4;
  const qa = here && b === 6;

  return (
    <div className="layer" style={{ opacity: here ? 1 : 0, transition: layerFade(here) }}>
      {METRICS.map((_, i) => <Metric key={i} i={i} on={here && b === i} past={here && b > i} entry={d.entry} />)}

      {/* 08.5 — 50B tokens in one day */}
      <div style={{ position: 'absolute', left: 120, top: 330, opacity: tkO ? 1 : 0, filter: `blur(${tkO ? 0 : 12}px)`, transition: swap(tkO, 900, 0, ['opacity', 'filter']) }}>
        <TokenCounter run={tkO && !d.done} entry={d.entry} />
        <div className="t-statement" style={{ fontSize: 80, letterSpacing: '-0.03em', marginTop: 44, lineHeight: 1, opacity: tkO && d.done ? 1 : 0, transition: tkO && d.done ? 'opacity 900ms ease' : 'opacity 250ms ease-in' }}>Tokens en un solo día</div>
        <div className="mono" style={{ fontSize: 26, color: 'rgba(255,255,255,.6)', marginTop: 22, opacity: tkO && d.done ? 1 : 0, transition: tkO && d.done ? 'opacity 900ms ease 400ms' : 'opacity 250ms ease-in' }}>// procesamos casi 50B de tokens en un solo día</div>
      </div>
      {/* slide 23's punchline, kept small: it never covers the number */}
      <div style={{ position: 'absolute', left: 1360, top: 610, width: 440, opacity: tkO && d.fine ? 1 : 0, transform: `translateY(${tkO && d.fine ? 0 : 16}px) rotate(${tkO && d.fine ? -2 : -4}deg)`, transition: tkO && d.fine ? `opacity 700ms ${EASE}, transform 900ms ${EASE}` : 'opacity 250ms ease-in, transform 250ms ease-in' }}>
        <img src={thisIsFine} alt="This is fine" style={{ display: 'block', width: 440, height: 310, objectFit: 'cover', border: '1px solid rgba(255,255,255,.16)' }} />
        <div className="mono" style={{ fontSize: 22, marginTop: 12, color: 'rgba(255,255,255,.6)' }}>
          status: <span style={{ color: 'var(--ok)' }}>this is fine</span>
        </div>
      </div>

      <div className="mono" style={{ position: 'absolute', left: 120, top: 480, fontSize: 80, opacity: here && b === 5 ? 1 : 0, transition: swap(here && b === 5, 1400, 100, ['opacity']) }}>
        <span style={{ color: 'rgba(255,255,255,.35)' }}>&gt;</span> still scaling.<span className="cursor" style={{ color: 'var(--violet-text)' }}>_</span>
      </div>

      {/* 08.7 Q&A — "¡Muchas gracias!" big, the speaker small; static once built, can stay projected indefinitely */}
      <div style={{ position: 'absolute', inset: 0, opacity: qa ? 1 : 0, transition: swap(qa, 1000, 0, ['opacity']) }}>
        <div style={{ position: 'absolute', left: 120, top: hasQr ? 250 : 330 }}>
          <div style={{ fontWeight: 500, fontSize: 150, lineHeight: 0.95, letterSpacing: '-0.04em' }}>¡Muchas gracias!</div>
          <div style={{ marginTop: 70, opacity: qa ? 1 : 0, transition: swap(qa, 800, 500, ['opacity']) }}>
            <div style={{ fontSize: 44, fontWeight: 500, letterSpacing: '-0.01em' }}>Cristian Córdova</div>
            <div className="mono" style={{ fontSize: 24, color: 'rgba(255,255,255,.6)', marginTop: 12 }}>Founder &amp; CEO de Helmcode</div>
            <div className="mono" style={{ display: 'flex', alignItems: 'center', gap: 18, fontSize: 30, color: 'var(--violet-text)', marginTop: 26 }}>
              <XLogo size={28} color="rgba(255,255,255,.8)" />
              <LinkedInLogo size={28} color="rgba(255,255,255,.8)" />
              <span style={{ marginLeft: 4 }}>@barckcode</span>
            </div>
          </div>
        </div>
        {/* the 1-bit portrait from helmcode.com/about, assembling dot by dot */}
        <div style={{ position: 'absolute', left: 1800 - PORTRAIT, top: hasQr ? 150 : 300, width: PORTRAIT, height: PORTRAIT, outline: '1px solid rgba(255,255,255,.16)' }}>
          <VizCanvas w={PORTRAIT} h={PORTRAIT} draw={drawPortrait400} duration={PORTRAIT_MS + IN_DELAY + 300} run={qa} entry={d.entry} />
        </div>
        {hasQr && <QR url={deckConfig.speakerQrUrl} x={1800 - 300} y={600} size={300} />}
        <div style={{ position: 'absolute', left: 120, right: 120, top: 944, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <img src={helmcodeLogo} alt="Helmcode" style={{ height: 40 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 36 }}>
            <span className="mono" style={{ whiteSpace: 'nowrap', fontSize: 22, color: 'rgba(255,255,255,.6)' }}>helmcode.com · nan.builders</span>
            <KernelPanicMark size={24} style={{ opacity: 0.85 }} />
          </div>
        </div>
      </div>
    </div>
  );
}
