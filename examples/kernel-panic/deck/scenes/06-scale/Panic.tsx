import { useGlitch } from 'beatdeck';
import { rng } from 'beatdeck';

/**
 * 06.6 KERNEL PANIC takeover (and the short boot glitches): RGB-split wordmark, giant outlined PANIC fragment,
 * horizontal corruption bands. Under reduced motion only a static wordmark remains; the cut to black is kept.
 */
export function GlitchLayer() {
  const g = useGlitch();
  const r = (k: number) => rng(g.seed, k);
  const panic = g.active && g.panic;
  const violent = g.active && g.violent;

  const bars = violent
    ? Array.from({ length: panic ? 12 : 5 }, (_, i) => {
        const t = r(80 + i);
        return {
          y: Math.round(r(20 + i) * 1080), h: Math.round(4 + r(40 + i) * (panic ? 110 : 36)), x: Math.round((r(60 + i) - 0.5) * 160),
          c: t < 0.35 ? '#4934E1' : t < 0.55 ? '#ffffff' : t < 0.7 ? '#ff5f56' : 'transparent',
          mb: t < 0.7 ? 'difference' : 'normal',
          bf: t >= 0.7 ? `invert(1) hue-rotate(${Math.round(r(90 + i) * 180)}deg)` : 'none',
        };
      })
    : [];

  return (
    <>
      {/* giant PANIC fragment */}
      <div className="event" style={{
        position: 'absolute', left: panic && violent ? Math.round(560 + r(14) * 500) : 1920, top: 560, fontSize: 560, lineHeight: 0.8,
        color: 'transparent', WebkitTextStroke: '2px rgba(255,95,86,.45)', transform: 'rotate(-4deg)',
        opacity: panic && violent ? 1 : 0, whiteSpace: 'nowrap', pointerEvents: 'none',
      }}>PANIC</div>

      {/* event branding takeover */}
      <div className="event" style={{ position: 'absolute', left: 0, top: 240, width: 1920, textAlign: 'center', fontSize: 300, lineHeight: 0.9, opacity: panic ? 1 : 0, pointerEvents: 'none' }}>
        {violent && (
          <>
            <div style={{ position: 'absolute', left: 0, top: 0, width: 1920, color: '#ff5f56', transform: `translate(${-20 - r(7) * 30}px,${(r(8) - 0.5) * 24}px)`, mixBlendMode: 'screen' }}>KERNEL<br />PANIC</div>
            <div style={{ position: 'absolute', left: 0, top: 0, width: 1920, color: '#4934E1', transform: `translate(${20 + r(9) * 30}px,${(r(10) - 0.5) * 24}px)`, mixBlendMode: 'screen' }}>KERNEL<br />PANIC</div>
          </>
        )}
        <div style={{
          position: 'relative', color: '#fff',
          clipPath: violent ? `inset(${Math.round(r(11) * 60)}% 0 ${Math.round(r(12) * 40)}% 0)` : 'none',
          transform: violent ? `skewX(${Math.round((r(13) - 0.5) * 24)}deg)` : 'none',
          textShadow: violent ? 'none' : '8px 8px 0 #ff5f56',
        }}>KERNEL<br />PANIC</div>
      </div>

      {bars.map((bar, i) => (
        <div key={i} style={{
          position: 'absolute', left: bar.x, top: bar.y, width: 1920, height: bar.h, background: bar.c,
          mixBlendMode: bar.mb as React.CSSProperties['mixBlendMode'], backdropFilter: bar.bf, WebkitBackdropFilter: bar.bf, pointerEvents: 'none',
        }} />
      ))}
    </>
  );
}

/** Stage shake during glitches (v3 jTf). */
export function jitterTransform(g: ReturnType<typeof useGlitch>): string {
  if (!g.active || !g.violent) return 'none';
  const r = (k: number) => rng(g.seed, k);
  return `translate(${(r(1) - 0.5) * (g.panic ? 60 : 18)}px,${(r(2) - 0.5) * (g.panic ? 30 : 10)}px) scale(${g.panic ? 1 + r(3) * 0.05 : 1})`;
}
