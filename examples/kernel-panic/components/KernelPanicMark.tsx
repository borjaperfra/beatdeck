/** Event wordmark as HTML (Archivo Black + violet offset shadow), rebuilt from the KERNEL PANIC event graphic. */
export function KernelPanicMark({ size = 26, shadow = 2, style }: { size?: number; shadow?: number; style?: React.CSSProperties }) {
  return (
    <span className="event" style={{ fontSize: size, color: 'var(--off-white)', textShadow: `${shadow}px ${shadow}px 0 var(--kernel)`, whiteSpace: 'nowrap', ...style }}>
      KERNEL PANIC!
    </span>
  );
}
