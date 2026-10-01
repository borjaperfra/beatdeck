import { memo } from 'react';

/**
 * RTX PRO 6000 (Blackwell) as a technical line drawing, Helmcode style: hairlines, one violet accent.
 * The drawing traces itself in (stroke-dashoffset, pathLength=1) and the fans turn slowly once it is built.
 * Used at 05.1 inside the GPU node; the same node then becomes the architecture's GPU box.
 */
const FAN_BLADES = 11;

function Fan({ cx, cy, r, on, delay }: { cx: number; cy: number; r: number; on: boolean; delay: number }) {
  const blades = Array.from({ length: FAN_BLADES }, (_, i) => {
    const a = (i / FAN_BLADES) * Math.PI * 2;
    const r0 = r * 0.3, r1 = r * 0.93;
    const p0 = [cx + Math.cos(a) * r0, cy + Math.sin(a) * r0];
    const p1 = [cx + Math.cos(a + 0.55) * r1, cy + Math.sin(a + 0.55) * r1];
    const c = [cx + Math.cos(a + 0.05) * r * 0.78, cy + Math.sin(a + 0.05) * r * 0.78];
    return `M${p0[0].toFixed(1)} ${p0[1].toFixed(1)} Q${c[0].toFixed(1)} ${c[1].toFixed(1)} ${p1[0].toFixed(1)} ${p1[1].toFixed(1)}`;
  });
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} {...line(on, delay)} />
      <circle cx={cx} cy={cy} r={r + 10} {...line(on, delay + 80, 0.35)} />
      <g className={on ? 'gpu-fan spin' : 'gpu-fan'} style={{ transformOrigin: `${cx}px ${cy}px` }}>
        {blades.map((d, i) => <path key={i} d={d} {...line(on, delay + 200 + i * 40, 0.8)} />)}
      </g>
      <circle cx={cx} cy={cy} r={r * 0.24} {...line(on, delay + 300)} />
      <circle cx={cx} cy={cy} r={r * 0.24} fill="none" stroke="var(--kernel)" strokeWidth={3} pathLength={1} strokeDasharray="1 1"
        style={{ strokeDashoffset: on ? 0 : 1, transition: `stroke-dashoffset 900ms var(--ease) ${delay + 700}ms` }} />
    </g>
  );
}

/** props for a self-tracing hairline */
function line(on: boolean, delay: number, alpha = 0.75, w = 1.5) {
  return {
    fill: 'none', stroke: `rgba(255,255,255,${alpha})`, strokeWidth: w, pathLength: 1, strokeDasharray: '1 1',
    style: { strokeDashoffset: on ? 0 : 1, transition: `stroke-dashoffset 1100ms var(--ease) ${delay}ms` },
  } as const;
}

export const GpuDrawing = memo(function GpuDrawing({ on }: { on: boolean }) {
  // card body 40..660 × 60..300, bracket on the left, PCIe edge at the bottom, power at the top
  return (
    <svg viewBox="0 0 700 360" width="100%" height="100%" style={{ display: 'block', overflow: 'visible' }} aria-label="NVIDIA RTX PRO 6000">
      {/* bracket */}
      <path d="M40 40 H18 V330 H40" {...line(on, 0)} />
      {[0, 1, 2, 3].map((i) => <rect key={i} x={24} y={80 + i * 44} width={10} height={28} {...line(on, 120 + i * 40, 0.55)} />)}
      {/* shroud */}
      <rect x={40} y={60} width={620} height={240} {...line(on, 100, 0.9)} />
      <rect x={52} y={72} width={596} height={216} {...line(on, 260, 0.3)} />
      {/* the X between the fans (the card's signature shroud) */}
      <path d="M282 72 L418 288 M418 72 L282 288" {...line(on, 420, 0.55)} />
      <path d="M270 72 V288 M430 72 V288" {...line(on, 520, 0.2)} />
      {/* fans */}
      <Fan cx={176} cy={180} r={82} on={on} delay={500} />
      <Fan cx={524} cy={180} r={82} on={on} delay={650} />
      {/* power connector (12V-2x6) */}
      <rect x={560} y={42} width={64} height={18} {...line(on, 900, 0.7)} />
      {[0, 1, 2, 3, 4, 5].map((i) => <path key={i} d={`M${568 + i * 10} 47 v8`} {...line(on, 1000 + i * 30, 0.5, 1)} />)}
      {/* PCIe edge */}
      <path d="M120 300 V318 H470 V300" {...line(on, 950, 0.7)} />
      <g style={{ opacity: on ? 1 : 0, transition: `opacity 600ms ease ${on ? 1500 : 0}ms` }}>
        {Array.from({ length: 34 }, (_, i) => <rect key={i} x={128 + i * 10} y={304} width={5} height={10} fill="var(--kernel)" />)}
      </g>
      {/* spec line */}
      <text x={40} y={350} fill="rgba(255,255,255,.55)" fontFamily="Roboto Mono" fontSize={17} letterSpacing="2"
        style={{ opacity: on ? 1 : 0, transition: `opacity 700ms ease ${on ? 1600 : 0}ms` }}>
        NVIDIA RTX PRO 6000 · BLACKWELL
      </text>
    </svg>
  );
});
