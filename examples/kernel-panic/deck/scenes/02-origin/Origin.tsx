import { usePos } from 'beatdeck';
import { BookmarkIcon, GrokIcon, HeartIcon, ReplyIcon, RepostIcon, ShareIcon, VerifiedBadge } from '../../../components/Icons';
import avatar from '../../../assets/source/avatar.png';
import { layerFade, swap } from '../../../components/motion';
import { Typewriter } from '../../../components/Typewriter';

const STMT = ['Todo empezó', 'con una idea', 'bastante mala.'];

/**
 * 02 ORIGIN — the statement (typed), then the real tweet (text verbatim from the source screenshot, slide 02),
 * progressively stripped until only "con Ollama en 2 minutos" remains, zoomed — then slide 03: "¿Ollama? Wtf…".
 */
export function Origin() {
  const { s, b, entry } = usePos();
  const here = s === 1;

  const twTf = !here || b === 0
    ? s > 1 ? 'perspective(1800px) translate3d(-160px,-120px,0) scale(2.4)' : 'perspective(1800px) translate3d(120px,160px,-1100px) rotateY(-34deg) rotateX(20deg)'
    : b <= 2 ? 'perspective(1800px) translate3d(100px,10px,0) rotateY(-11deg) rotateX(5deg)'
      : b === 3 ? 'perspective(1800px) translate3d(-60px,10px,0) scale(1.04)'
        : 'perspective(1800px) translate3d(-160px,-120px,0) scale(2.4)';
  const bb = here ? Math.min(b, 4) : s > 1 ? 4 : 0;
  const ui = here && b <= 1 ? 1 : 0;
  const card = bb <= 1;
  const bO = bb <= 2 ? 1 : bb === 3 ? 0.07 : 0;   // body
  const h1O = bb <= 3 ? 1 : 0;                   // "un buen server privado con GPUs…"
  const h2O = bb === 4 ? 1 : bO;                 // "con Ollama en 2 minutos"
  const h2C = bb === 4 ? 'var(--violet-text)' : '#ffffff';
  // text that leaves goes quickly; text that stays or arrives settles slowly
  const t = (o: number) => ({ opacity: o, transition: o >= 0.5 ? 'opacity 900ms ease' : 'opacity 380ms ease-in' });
  const stmtOn = here && b === 0;
  const tweetOn = here && b >= 1 && b <= 4;
  const wtfOn = here && b === 5;

  return (
    <div className="layer" style={{ opacity: here ? 1 : 0, transition: layerFade(here) }}>
      {/* statement — typed, one left edge */}
      <div className="t-statement" style={{ position: 'absolute', left: 120, top: 250, fontSize: 165, opacity: stmtOn ? 1 : 0, transition: swap(stmtOn, 300, -300, ['opacity']) }}>
        <Typewriter lines={STMT} run={stmtOn} entry={entry} charMs={42} lineStyle={{ paddingBottom: 14 }} />
      </div>

      {/* slide 03 — ¿Ollama? Wtf… */}
      <div className="t-editorial" style={{ position: 'absolute', left: 120, top: 380, fontSize: 250, opacity: wtfOn ? 1 : 0, transition: swap(wtfOn, 300, -100, ['opacity']) }}>
        <Typewriter lines={['¿Ollama? Wtf…']} run={wtfOn} entry={entry} charMs={70} delay={450} cursorAfter={2600} />
      </div>

      {/* the tweet */}
      <div style={{ position: 'absolute', left: 430, top: 130, width: 1180, opacity: tweetOn ? 1 : 0, transform: twTf, transformOrigin: b >= 4 || s > 1 ? '42% 66%' : '50% 50%', transition: tweetOn ? 'opacity 900ms ease 250ms, transform 1600ms var(--ease-tweet)' : 'opacity 320ms ease-in, transform 1600ms var(--ease-tweet)' }}>
        <div className="tweet-float" style={{ animationPlayState: here && b >= 1 && b <= 3 ? 'running' : 'paused' }}>
          <div className="tweet-tilt" style={{ animationPlayState: here && b >= 1 && b <= 3 ? 'running' : 'paused' }}>
            <div style={{ padding: '44px 48px', background: card ? '#111111' : 'rgba(17,17,17,0)', border: `0.5px solid ${card ? 'rgba(255,255,255,.12)' : 'rgba(255,255,255,0)'}`, boxShadow: card ? '0 80px 160px rgba(0,0,0,.7)' : '0 0 0 rgba(0,0,0,0)', transition: 'background 900ms, border-color 900ms, box-shadow 900ms' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 20, opacity: ui, transition: 'opacity 700ms' }}>
                <div style={{ width: 72, height: 72, borderRadius: '50%', background: `url(${avatar}) center/cover`, flex: 'none' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
                  <div style={{ fontWeight: 500, fontSize: 30, display: 'flex', alignItems: 'center', gap: 10 }}>
                    Cristian Córdova <span style={{ fontSize: 24 }}>🐧</span> <VerifiedBadge size={30} />
                  </div>
                  <div className="mono" style={{ fontSize: 22, color: 'rgba(255,255,255,.55)' }}>@barckcode</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 26, color: 'rgba(255,255,255,.75)', alignSelf: 'flex-start' }}>
                  <GrokIcon size={30} />
                  <span style={{ fontSize: 30, letterSpacing: '.05em', lineHeight: 1 }}>···</span>
                </div>
              </div>
              <div style={{ fontSize: 32, lineHeight: 1.38, marginTop: 28, textWrap: 'pretty' } as React.CSSProperties}>
                <p style={{ margin: '0 0 28px' }}>
                  <span style={t(bO)}>🤔 Saben que estaría bien? Juntarnos unos 5/10 locos que estemos desarrollando a full cosas con IA y nos montemos una mini comunidad para pagar </span>
                  <span style={t(h1O)}>un buen server privado con GPUs para poder quemar tokens como locos con modelos locales.</span>
                </p>
                <p style={{ margin: '0 0 28px', ...t(bO) }}>Yo creo que entre unos 5/10 que nos juntemos nos sale casi regalado todo.</p>
                <p style={{ margin: 0 }}>
                  <span style={t(bO)}>Se apuntarían? Yo me comprometo a montar el server y disponibilizo los modelos que queramos </span>
                  <span style={{ opacity: h2O, color: h2C, transition: 'opacity 900ms, color 900ms 300ms' }}>con Ollama en 2 minutos</span>
                  <span style={t(bO)}> para que puedan acceder a ellos en un momento de forma privada desde cualquier sitio.</span>
                </p>
              </div>
              <div style={{ opacity: ui, transition: 'opacity 700ms' }}>
                <div className="mono" style={{ fontSize: 20, color: 'rgba(255,255,255,.45)', marginTop: 30 }}>
                  12:59 a. m. · 10 abr. 2026 · <span style={{ color: '#fff' }}>108,7 mil</span> Visualizaciones
                </div>
                <div style={{ height: 0.5, background: 'rgba(255,255,255,.12)', margin: '24px 0' }} />
                <div className="mono" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 24, color: 'rgba(255,255,255,.55)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}><ReplyIcon />109</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}><RepostIcon />21</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#f91880' }}><HeartIcon color="#f91880" />475</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#1d9bf0' }}><BookmarkIcon color="#1d9bf0" />144</span>
                  <ShareIcon />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
