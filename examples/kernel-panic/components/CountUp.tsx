import { useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';

/**
 * A number that counts to its new value instead of jumping. Written straight to the DOM (no re-renders).
 * Tabular figures; nothing is anchored to its right edge, so growing digits push nothing.
 * `from` + `entry` restart the count from a fixed value on every beat entry (metrics count up from 0).
 */
export function CountUp({ value, ms = 700, prefix = '', suffix = '', from, entry, delay = 0, ease = 'power2.out', className, style }: {
  value: number; ms?: number; prefix?: string; suffix?: string; from?: number; entry?: number; delay?: number; ease?: string;
  className?: string; style?: React.CSSProperties;
}) {
  const el = useRef<HTMLSpanElement>(null);
  const cur = useRef(from ?? value);
  useLayoutEffect(() => {
    const node = el.current!;
    if (from != null) cur.current = from;
    const o = { v: cur.current };
    const write = () => { node.textContent = prefix + Math.round(o.v) + suffix; };
    write();
    const tw = gsap.to(o, { v: value, duration: ms / 1000, delay: delay / 1000, ease, onUpdate: () => { cur.current = o.v; write(); } });
    return () => { tw.kill(); };
  }, [value, ms, prefix, suffix, from, entry, delay, ease]);
  return (
    <span ref={el} className={className} style={{ fontVariantNumeric: 'tabular-nums', display: 'inline-block', ...style }}>
      {prefix + Math.round(cur.current) + suffix}
    </span>
  );
}
