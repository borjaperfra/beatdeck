import { deck } from './engine';
import { flags } from './flags';

/** Stage ⇄ presenter protocol over BroadcastChannel (same origin, no network). */
export type Msg =
  | { type: 'state'; scene: number; beat: number; fullscreen: boolean; blackout: boolean; sentAt: number }
  | { type: 'hello' }
  | { type: 'cmd'; cmd: 'next' | 'prev' | 'home' | 'end' | 'blackout' }
  | { type: 'go'; scene: number; beat: number };

export function openChannel(): BroadcastChannel | null {
  try {
    return new BroadcastChannel(`beatdeck:${deck.def.id}`);
  } catch {
    return null;
  }
}

/** Stage side: publish every state change and obey commands from presenter windows. */
export function startStageSync(): () => void {
  const ch = openChannel();
  if (!ch) return () => {};
  let last = '';
  const publish = (force = false) => {
    const s = deck.getState();
    const msg: Msg = {
      type: 'state', scene: s.scene, beat: s.beat,
      fullscreen: !!document.fullscreenElement, blackout: s.blackout, sentAt: Date.now(),
    };
    const key = `${msg.scene}.${msg.beat}.${msg.fullscreen}.${msg.blackout}`;
    if (!force && key === last) return;
    last = key;
    ch.postMessage(msg);
  };
  const unsub = deck.subscribe(() => publish());
  const onFs = () => publish();
  document.addEventListener('fullscreenchange', onFs);
  // heartbeat: lets the presenter show "connected" and recover from a missed message
  const hb = setInterval(() => publish(true), 1000);
  ch.onmessage = (e: MessageEvent<Msg>) => {
    const m = e.data;
    if (m.type === 'hello') publish(true);
    else if (m.type === 'go') deck.go({ scene: m.scene, beat: m.beat });
    else if (m.type === 'cmd') {
      if (m.cmd === 'next') deck.next();
      else if (m.cmd === 'prev') deck.prev();
      else if (m.cmd === 'home') deck.home();
      else if (m.cmd === 'end') deck.end();
      else if (m.cmd === 'blackout') deck.toggleBlackout();
    }
  };
  publish(true);
  return () => {
    unsub();
    clearInterval(hb);
    document.removeEventListener('fullscreenchange', onFs);
    ch.close();
  };
}

export function openPresenterWindow() {
  if (flags.presenter) return;
  window.open(`${location.pathname}?view=presenter`, `beatdeck-presenter-${deck.def.id}`, 'width=1280,height=800');
}
