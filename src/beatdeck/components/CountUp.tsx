import { useLayoutEffect, useMemo, useRef } from 'react';
import { gsap } from 'gsap';

/**
 * A number that counts to its new value instead of jumping. Written straight to the DOM (no re-renders).
 * Tabular figures; nothing is anchored to its right edge, so growing digits push nothing.
 * `from` + `entry` restart the count from a fixed value on every beat entry (metrics count up from 0).
 * `decimals` fixes the fraction digits; `locale` (e.g. "es-ES") formats with that locale's separators
 * ("20.200", "3,9"). Without `locale` the digits are plain ("20200", "3.9").
 */
export function CountUp({ value, ms = 700, prefix = '', suffix = '', from, entry, delay = 0, ease = 'power2.out', decimals = 0, locale, className, style }: {
  value: number; ms?: number; prefix?: string; suffix?: string; from?: number; entry?: number; delay?: number; ease?: string;
  decimals?: number; locale?: string; className?: string; style?: React.CSSProperties;
}) {
  const fmt = useMemo(() => {
    const zero = 0.5 * 10 ** -decimals; // never print "-0"
    if (!locale) return (n: number) => (Math.abs(n) < zero ? 0 : n).toFixed(decimals);
    const nf = new Intl.NumberFormat(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    return (n: number) => nf.format(Math.abs(n) < zero ? 0 : n);
  }, [locale, decimals]);
  const el = useRef<HTMLSpanElement>(null);
  const cur = useRef(from ?? value);
  useLayoutEffect(() => {
    const node = el.current!;
    if (from != null) cur.current = from;
    const o = { v: cur.current };
    const write = () => { node.textContent = prefix + fmt(o.v) + suffix; };
    write();
    const tw = gsap.to(o, { v: value, duration: ms / 1000, delay: delay / 1000, ease, onUpdate: () => { cur.current = o.v; write(); } });
    return () => { tw.kill(); };
  }, [value, ms, prefix, suffix, from, entry, delay, ease, fmt]);
  return (
    <span ref={el} className={className} style={{ fontVariantNumeric: 'tabular-nums', display: 'inline-block', ...style }}>
      {prefix + fmt(cur.current) + suffix}
    </span>
  );
}
