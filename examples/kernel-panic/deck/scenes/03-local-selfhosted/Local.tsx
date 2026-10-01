import { usePos } from 'beatdeck';
import { NotEqual } from '../../../components/Icons';
import { CountUp } from '../../../components/CountUp';
import { layerFade, swap } from '../../../components/motion';
import { DEMAND } from '../../../simulation/requestSimulation';
import vllm from '../../../assets/source/vllm.png';
import sglang from '../../../assets/source/sglang.png';
import litellm from '../../../assets/source/litellm.png';
import bifrost from '../../../assets/source/bifrost.png';

/** Two real logos on one row, left edge x=120, vertically centred; the category as a system line above. */
function LogoPair({ on, out, caption, a, b, h }: { on: boolean; out: boolean; caption: string; a: [string, string]; b: [string, string]; h: number }) {
  return (
    <div style={{ position: 'absolute', left: 120, top: 540, opacity: on ? 1 : 0, transform: `translateY(calc(-50% + ${on ? 0 : out ? -30 : 30}px))`, transition: swap(on, 1000) }}>
      <div className="t-eyebrow" style={{ marginBottom: 56 }}>// {caption}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 56 }}>
        <img src={a[0]} alt={a[1]} style={{ height: h, display: 'block' }} />
        <span style={{ fontWeight: 300, fontSize: h * 0.9, lineHeight: 1, color: 'var(--kernel)' }}>/</span>
        <img src={b[0]} alt={b[1]} style={{ height: h, display: 'block' }} />
      </div>
    </div>
  );
}

/** 03 LOCAL ≠ SELF-HOSTED — the capacity simulation lives on the canvas; this layer carries numbers, labels, logos. */
export function Local() {
  const { s, b } = usePos();
  const here = s === 2;
  const D = DEMAND[here ? b : 0];
  const numOn = here && b <= 5;
  const lblO = here && b === 5;

  return (
    <div className="layer" style={{ opacity: here ? 1 : 0, transition: layerFade(here) }}>
      <div style={{ position: 'absolute', left: 960, top: 150, width: 1, height: 800, background: 'rgba(255,255,255,.09)', opacity: numOn ? 1 : 0, transition: swap(numOn, 600, 0, ['opacity']) }} />
      <div style={{ position: 'absolute', left: 120, top: 130, opacity: numOn ? 1 : 0, transition: swap(numOn, 600, 0, ['opacity']) }}>
        <div className="t-numeral" style={{ fontSize: 260, letterSpacing: '-0.02em' }}>~5</div>
        <div className="t-meta" style={{ fontSize: 22, marginTop: 22, whiteSpace: 'nowrap', color: D > 5 ? 'var(--warning)' : 'rgba(255,255,255,.6)', transition: 'color 400ms' }}>
          {D > 5 ? 'saturado' : 'procesos concurrentes'}
        </div>
      </div>
      <div style={{ position: 'absolute', left: 1040, top: 130, opacity: numOn ? 1 : 0, transition: swap(numOn, 600, 0, ['opacity']) }}>
        <div className="t-numeral" style={{ fontSize: 260, letterSpacing: '-0.02em' }}><CountUp value={D} ms={900} prefix="~" /></div>
        <div className="t-meta" style={{ fontSize: 22, marginTop: 22, whiteSpace: 'nowrap' }}>procesos concurrentes</div>
      </div>

      <div className="t-statement" style={{ position: 'absolute', left: 120, top: 860, fontSize: 88, letterSpacing: '-0.04em', lineHeight: 1, opacity: lblO ? 1 : 0, transform: `translateY(${lblO ? 0 : 30}px)`, transition: swap(lblO, 900, -200) }}>Local</div>
      <div className="t-statement" style={{ position: 'absolute', left: 1040, top: 860, fontSize: 88, letterSpacing: '-0.04em', lineHeight: 1, opacity: lblO ? 1 : 0, transform: `translateY(${lblO ? 0 : 30}px)`, transition: swap(lblO, 900, -80) }}>Self-hosted</div>
      <div style={{ position: 'absolute', left: 900, top: 505, width: 120, height: 110, display: 'grid', placeItems: 'center', background: 'var(--bg)', opacity: lblO ? 1 : 0, transition: swap(lblO, 500, 250, ['opacity']) }}>
        <NotEqual size={130} />
      </div>

      {/* slide 06 — Motores de inferencia Enterprise (real logos) */}
      <LogoPair on={here && b === 6} out={here && b > 6} caption="motores de inferencia enterprise" a={[vllm, 'vLLM']} b={[sglang, 'SGLang']} h={170} />
      {/* slide 07 — Gobernanza (real logos) */}
      <LogoPair on={here && b === 7} out={false} caption="gobernanza" a={[litellm, 'LiteLLM']} b={[bifrost, 'Bifrost']} h={160} />
    </div>
  );
}
