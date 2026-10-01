import { useDeck } from '../../state';

/**
 * After the 520 ms failure: absolute black with the frozen kernel's last words (no grid, no particles, no chrome).
 * It stays until the speaker clicks (→ 07.1 `> reboot_`). Printed at once, like a real panic; nothing moves.
 */
const LINES: [string, string][] = [
  ['[ 2147.483647 ] ', 'Kernel panic - not syncing: single point of failure'],
  ['[ 2147.483647 ] ', 'CPU: 0 PID: 1 Comm: server_01'],
  ['[ 2147.483647 ] ', '---[ end Kernel panic - not syncing ]---'],
];

export function PanicScreen() {
  const on = useDeck((st) => st.scene === 5 && st.beat === 5 && st.live.black && !st.blackout);
  return (
    <div className="layer mono" style={{ opacity: on ? 1 : 0, transition: on ? 'opacity 0ms linear 450ms' : 'none', fontSize: 28, lineHeight: '46px' }}>
      <div style={{ position: 'absolute', left: 120, top: 460 }}>
        {LINES.map(([ts, msg], i) => (
          <div key={i} style={{ whiteSpace: 'nowrap' }}>
            <span style={{ color: 'rgba(255,255,255,.3)' }}>{ts}</span>
            <span style={{ color: i === 0 ? 'var(--fault)' : 'rgba(255,255,255,.72)' }}>{msg}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
