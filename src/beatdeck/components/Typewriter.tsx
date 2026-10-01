import { useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { IN_DELAY } from './motion';

/**
 * Types text in with a bar cursor in the accent colour. The bar sits on the baseline and is cap-height tall.
 * The full text is laid out from the first frame (the untyped part is invisible), so typing never reflows
 * anything around it. Written straight to the DOM: no React re-render per character.
 * Restarts every time `run` becomes true (or `entry` changes); when `run` is false the text is shown complete.
 */
export function Typewriter({ lines, run, entry, charMs = 34, delay = IN_DELAY, cursorAfter = 1400, lineStyle, cursorColor = 'var(--accent)' }: {
  lines: string[]; run: boolean; entry?: number; charMs?: number; delay?: number; cursorAfter?: number;
  lineStyle?: React.CSSProperties; cursorColor?: string;
}) {
  const typed = useRef<(HTMLSpanElement | null)[]>([]);
  const rest = useRef<(HTMLSpanElement | null)[]>([]);
  const cur = useRef<(HTMLSpanElement | null)[]>([]);
  const key = lines.join('\n');

  useLayoutEffect(() => {
    const total = lines.reduce((a, l) => a + l.length, 0);
    const paint = (n: number, showCursor: boolean) => {
      let left = n;
      let cursorLine = -1;
      lines.forEach((l, i) => {
        const k = Math.max(0, Math.min(l.length, left));
        left -= l.length;
        if (typed.current[i]) typed.current[i]!.textContent = l.slice(0, k);
        if (rest.current[i]) rest.current[i]!.textContent = l.slice(k);
        if (k < l.length && cursorLine < 0) cursorLine = i;
      });
      if (cursorLine < 0) cursorLine = lines.length - 1;
      cur.current.forEach((c, i) => { if (c) c.style.opacity = showCursor && i === cursorLine ? '1' : '0'; });
    };
    if (!run) { paint(total, false); return; }
    paint(0, false);
    const o = { n: 0 };
    const tl = gsap.timeline();
    tl.to(o, { n: total, duration: (total * charMs) / 1000, ease: 'none', delay: delay / 1000, onStart: () => paint(0, true), onUpdate: () => paint(Math.floor(o.n), true) });
    tl.call(() => paint(total, false), [], `+=${cursorAfter / 1000}`);
    return () => { tl.kill(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run, entry, key, charMs, delay, cursorAfter]);

  return (
    <>
      {lines.map((l, i) => (
        <div key={i} style={{ whiteSpace: 'nowrap', ...lineStyle }}>
          <span ref={(el) => { typed.current[i] = el; }}>{l}</span>
          <span style={{ display: 'inline-block', width: 0, position: 'relative' }}>
            <span ref={(el) => { cur.current[i] = el; }} style={{ position: 'absolute', left: '0.05em', bottom: '-0.01em', width: '0.08em', height: '0.72em', opacity: 0 }}>
              <span className="cursor" style={{ display: 'block', width: '100%', height: '100%', background: cursorColor }} />
            </span>
          </span>
          <span ref={(el) => { rest.current[i] = el; }} style={{ visibility: 'hidden' }} />
        </div>
      ))}
    </>
  );
}
