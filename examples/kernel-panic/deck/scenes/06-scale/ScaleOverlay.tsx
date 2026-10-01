import { useDeck } from '../../state';
import { CountUp } from '../../../components/CountUp';
import { EASE, swap } from '../../../components/motion';
import { Typewriter } from '../../../components/Typewriter';

/** Slide 20, exact wording. The system shorthand comes first; the Spanish source line is the message. */
const WARNINGS: [string, string][] = [
  ['single_point_of_failure', 'No hay HA en puntos críticos'],
  ['deploy_requires_downtime', 'Meter/quitar modelos supone caída de servicio'],
  ['server_01_is_doing_everything', 'Todo dependía del server 01'],
];

/** Typography that lives with the architecture world in 05.5–06.5: users counter, routing, reyes magos, warnings. */
export function ScaleOverlay() {
  const d = useDeck((st) => ({ s: st.scene, b: st.beat, entry: st.entry, users: st.live.users, warnN: st.live.warnN, black: st.live.black }));
  const { s, b } = d;
  const usersOn = ((s === 4 && b >= 4) || s === 5) && !d.black && !(s === 5 && b === 2);
  const warnOn = s === 5 && b === 4;
  const rmOn = s === 5 && b === 2;
  const routingOn = s === 5 && b === 3;
  const waitOn = s === 5 && b === 0;

  return (
    <>
      {/* users — counts between steps; nothing is anchored to its right edge, so growing digits push nothing */}
      <div style={{ position: 'absolute', left: 110, top: 100, opacity: usersOn ? 1 : 0, transition: swap(usersOn, 700, 0, ['opacity']) }}>
        <div className="t-numeral" style={{ fontSize: 250 }}>
          <CountUp value={s === 4 ? 25 : d.users} ms={800} prefix="~" />
        </div>
        <div className="t-meta" style={{ fontSize: 22, letterSpacing: '.1em', color: 'rgba(255,255,255,.55)', marginTop: 16, whiteSpace: 'nowrap' }}>
          <div>usuarios activos</div>
          <div style={{ opacity: waitOn ? 1 : 0, transition: swap(waitOn, 700, 200, ['opacity']), color: 'var(--violet-text)', marginTop: 8 }}>la waitlist no para de crecer</div>
        </div>
      </div>

      {/* slide 19 — múltiples modelos: LiteLLM routes by model (arrives after server_03 has landed) */}
      <div className="mono" style={{ position: 'absolute', left: 120, top: 720, opacity: routingOn ? 1 : 0, transform: `translateX(${routingOn ? 0 : -16}px)`, transition: swap(routingOn, 800, 1100, ['opacity', 'transform']) }}>
        <div className="t-eyebrow" style={{ fontSize: 22, marginBottom: 22 }}>// múltiples modelos · litellm enruta</div>
        <div style={{ display: 'grid', gridTemplateColumns: '170px 56px auto', rowGap: 14, fontSize: 28, whiteSpace: 'nowrap' }}>
          <span>qwencito</span><span style={{ color: 'rgba(255,255,255,.35)' }}>-&gt;</span><span style={{ color: 'rgba(255,255,255,.7)' }}>server_01 · server_02</span>
          <span style={{ color: 'var(--violet-text)' }}>gemma4</span><span style={{ color: 'rgba(255,255,255,.35)' }}>-&gt;</span><span style={{ color: 'rgba(255,255,255,.7)' }}>server_03</span>
        </div>
      </div>

      {/* slide 20 — the three problems (the timeline reveals them one by one) */}
      <div style={{ position: 'absolute', left: 120, top: 720, display: 'flex', flexDirection: 'column', gap: 20, opacity: warnOn ? 1 : 0, transition: swap(warnOn, 300, -340, ['opacity']) }}>
        {WARNINGS.map(([k, t], i) => {
          const on = warnOn && d.warnN > i;
          return (
            <div key={k} style={{ opacity: on ? 1 : 0, transform: `translateX(${on ? 0 : -16}px)`, transition: `opacity 600ms ${EASE}, transform 600ms ${EASE}` }}>
              <div className="mono" style={{ fontSize: 18, color: 'var(--warning)', whiteSpace: 'nowrap' }}>warning[{i + 1}]: {k}</div>
              <div style={{ fontSize: 28, fontWeight: 500, letterSpacing: '-0.01em', color: 'rgba(255,255,255,.9)', marginTop: 4, whiteSpace: 'nowrap' }}>{t}</div>
            </div>
          );
        })}
      </div>

      {/* slide 18 */}
      <div className="t-statement" style={{ position: 'absolute', left: 120, top: 360, fontSize: 170, lineHeight: 0.9, letterSpacing: '-0.03em', opacity: rmOn ? 1 : 0, transition: swap(rmOn, 200, -300, ['opacity']) }}>
        <Typewriter lines={['Carta a los', 'reyes magos']} run={rmOn} entry={d.entry} charMs={48} delay={500} lineStyle={{ paddingBottom: 12 }} />
      </div>
    </>
  );
}
