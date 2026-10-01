/**
 * Terminal text, rendered exactly: one line per entry, `white-space: pre`, real tabs, nothing reformatted.
 * Marks recolour and underline a substring (optionally with a label under it) without changing a character —
 * labels are CSS `::after` content, so every line's `textContent` is the original text. Hidden lines keep their
 * space, so revealing output line by line never reflows anything.
 */

export interface TermMark {
  /** Substring to mark (must occur in the line). */
  text: string;
  /** Which occurrence, 0-based. Default 0. */
  nth?: number;
  /** Highlighted now. Default true. */
  on?: boolean;
  /** Label shown under the substring while on (stage text, e.g. "type"). */
  label?: string;
  /** Label row under the line: 0 (default) or 1, to stagger labels that would collide. */
  row?: 0 | 1;
}

export interface TermLine {
  t: string;
  /** Visible now. Default true. Hidden lines keep their height. */
  on?: boolean;
  marks?: TermMark[];
  /** Label rows to reserve under this line (0–2), so labels never push the next line. */
  labels?: 0 | 1 | 2;
  /** Dim the line (context that is not the point of this beat). */
  dim?: boolean;
}

type Seg = { s: string; m?: TermMark };

function segments(t: string, marks: TermMark[] = []): Seg[] {
  const found = marks
    .map((m) => {
      let i = -1;
      for (let k = 0; k <= (m.nth ?? 0); k++) i = t.indexOf(m.text, i + 1);
      if (i < 0) throw new Error(`Terminal: mark "${m.text}" not found in "${t}"`);
      return { m, i, j: i + m.text.length };
    })
    .sort((a, b) => a.i - b.i);
  const out: Seg[] = [];
  let p = 0;
  for (const f of found) {
    if (f.i < p) throw new Error(`Terminal: overlapping marks in "${t}"`);
    if (f.i > p) out.push({ s: t.slice(p, f.i) });
    out.push({ s: t.slice(f.i, f.j), m: f.m });
    p = f.j;
  }
  if (p < t.length) out.push({ s: t.slice(p) });
  return out;
}

/**
 * ```tsx
 * <Terminal x={150} y={140} size={30} lines={[
 *   '$ git hash-object hola.txt',
 *   { t: '5c1b14949828006ed75a3e8858957f86a2f7e2eb', marks: [{ text: '5c1b149', on: b >= 2, label: 'short hash' }] },
 *   { t: '$ git add hola.txt', on: b >= 3 },
 * ]} />
 * ```
 * Lines starting with `prompt` (default "$ ") are commands: bold, with the prompt sign in the accent colour.
 */
export function Terminal({ lines, size = 28, prompt = '$ ', x, y, width, framed = false, style, className }: {
  lines: (string | TermLine)[]; size?: number; prompt?: string; x?: number; y?: number; width?: number;
  framed?: boolean; style?: React.CSSProperties; className?: string;
}) {
  const sign = prompt.trimEnd();
  return (
    <div
      className={`bd-term${framed ? ' framed' : ''}${className ? ` ${className}` : ''}`}
      style={{ position: x != null || y != null ? 'absolute' : undefined, left: x, top: y, width, fontSize: size, ...style }}
    >
      {lines.map((raw, i) => {
        const l: TermLine = typeof raw === 'string' ? { t: raw } : raw;
        const cmd = !!prompt && l.t.startsWith(prompt);
        const segs = segments(l.t, l.marks);
        return (
          <div
            key={i}
            className={`bd-term-line${cmd ? ' cmd' : ''}${l.dim ? ' dim' : ''}`}
            style={{ paddingBottom: `${(l.labels ?? 0) * 1.25}em`, opacity: l.on === false ? 0 : undefined }}
          >
            {segs.map((sg, k) => {
              // the prompt sign is coloured, never altered
              const lead = k === 0 && cmd;
              const text = lead ? sg.s.slice(sign.length) : sg.s;
              const p = lead ? <span className="bd-prompt">{sign}</span> : null;
              if (!sg.m) return <span key={k}>{p}{text}</span>;
              const on = sg.m.on ?? true;
              return (
                <span key={k}>
                  {p}
                  <span className={`bd-mk${on ? ' on' : ''}${sg.m.row ? ' r1' : ''}`} data-label={sg.m.label ?? ''}>{text}</span>
                </span>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
