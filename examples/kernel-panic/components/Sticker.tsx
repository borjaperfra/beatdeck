/** One of the two approved Helmcode stickers: stamped in after the beat has landed, gone first when it leaves. */
export function Sticker({ on, src, alt, x, y, w, h, rot, delay = 900 }: { on: boolean; src: string; alt: string; x: number; y: number; w: number; h: number; rot: number; delay?: number }) {
  return (
    <img
      src={src}
      alt={alt}
      style={{
        position: 'absolute', left: x, top: y, width: w, height: h, objectFit: 'contain',
        opacity: on ? 1 : 0, transform: `rotate(${on ? rot : rot - 10}deg) scale(${on ? 1 : 1.3})`,
        transition: on
          ? `opacity 240ms ease-out ${delay}ms, transform 340ms cubic-bezier(.2,.9,.3,1) ${delay}ms`
          : 'opacity 200ms ease-in, transform 200ms ease-in',
        filter: 'drop-shadow(0 24px 40px rgba(0,0,0,.6))', pointerEvents: 'none',
      }}
    />
  );
}
