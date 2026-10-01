import { useMemo } from 'react';
import QRCode from 'qrcode';

export const qrConfigured = (url: string | undefined): url is string => !!url && url !== 'TODO';

/**
 * QR code drawn as SVG modules, computed locally from the URL (no network, no image file).
 * White plate with a quiet zone so phones scan it off a projector. Renders nothing while the URL is "TODO".
 */
export function QR({ url, size, x, y, plate = 24, style }: {
  url: string | undefined; size: number; x?: number; y?: number; plate?: number; style?: React.CSSProperties;
}) {
  const path = useMemo(() => {
    if (!qrConfigured(url)) return null;
    const { modules } = QRCode.create(url, { errorCorrectionLevel: 'M' });
    const n = modules.size;
    let d = '';
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (modules.get(r, c)) d += `M${c} ${r}h1v1h-1z`;
    return { d, n };
  }, [url]);
  if (!path) return null;
  return (
    <div style={{ position: x != null || y != null ? 'absolute' : undefined, left: x, top: y, width: size, height: size, background: '#fff', padding: plate, ...style }}>
      <svg viewBox={`0 0 ${path.n} ${path.n}`} width="100%" height="100%" shapeRendering="crispEdges" role="img" aria-label={url}>
        <path d={path.d} fill="#0a0a0a" />
      </svg>
    </div>
  );
}
