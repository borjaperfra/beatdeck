import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { STAGE_H, STAGE_W, StageScale } from './stage';
import { deck, useDeck } from '../engine';
import { bindKeys, localTarget, startCursorAutoHide } from '../navigation';
import { startStageSync } from '../presenter';
import { parseHash } from '../persistence';
import { flags } from '../flags';
import type { DeckDefinition, DeckState } from '../types';
import { DefaultChrome } from './DefaultChrome';
import { qrConfigured } from '../components/QR';
import { gsap } from 'gsap';
import { Overview } from './Overview';
import { DebugPanel } from './DebugPanel';

/** Fit the fixed 1920×1080 stage into the viewport, preserving aspect ratio (black letterbox). */
function useStageFit() {
  const [fit, setFit] = useState({ scale: 1, ox: 0, oy: 0 });
  useLayoutEffect(() => {
    const onResize = () => {
      const w = window.innerWidth, h = window.innerHeight;
      const scale = Math.min(w / STAGE_W, h / STAGE_H);
      setFit({ scale, ox: (w - STAGE_W * scale) / 2, oy: (h - STAGE_H * scale) / 2 });
    };
    onResize();
    window.addEventListener('resize', onResize);
    document.addEventListener('fullscreenchange', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      document.removeEventListener('fullscreenchange', onResize);
    };
  }, []);
  return fit;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function App({ def }: { def: DeckDefinition<any> }) {
  const fit = useStageFit();
  const d = useDeck((st: DeckState<unknown>) => ({
    black: !!def.isBlack?.(st as never) || st.blackout,
    cut: !!def.isCut?.(st as never) || st.blackout,
  }));
  const [overview, setOverview] = useState(false);
  const overviewRef = useRef(overview);
  overviewRef.current = overview;

  useEffect(() => {
    deck.start();
    // test hook for scripts/verify.mjs (capture mode only)
    if (flags.capture) {
      (window as unknown as { __beatdeck: unknown }).__beatdeck = {
        beats: deck.scenes.map((s) => s.beats.map((b) => !!b.auto)),
        tolerance: deck.scenes.map((s) => s.beats.map((b) => b.tolerance ?? null)),
        qrUrl: qrConfigured(def.qrUrl) ? def.qrUrl : null,
        /** true while any GSAP tween or finite CSS animation/transition is still running */
        busy: () =>
          gsap.globalTimeline.getChildren(true, true, true).some((t) => t.isActive()) ||
          document.getAnimations().some((a) => a.playState === 'running' && a.effect?.getComputedTiming().endTime !== Infinity),
      };
    }
    const offKeys = bindKeys(localTarget, {
      toggleOverview: () => setOverview((o) => !o),
      closeOverview: () => {
        if (!overviewRef.current) return false;
        setOverview(false);
        return true;
      },
    });
    const offCursor = startCursorAutoHide(def.cursorHideMs ?? 2000);
    const offSync = startStageSync();
    const onHash = () => {
      const p = parseHash(location.hash);
      const st = deck.getState();
      if (p && (p.scene !== st.scene || p.beat !== st.beat)) deck.go(p);
    };
    window.addEventListener('hashchange', onHash);
    // no scrolling, ever (wheel / touch)
    const block = (e: Event) => e.preventDefault();
    window.addEventListener('wheel', block, { passive: false });
    window.addEventListener('touchmove', block, { passive: false });
    return () => {
      offKeys(); offCursor(); offSync();
      window.removeEventListener('hashchange', onHash);
      window.removeEventListener('wheel', block);
      window.removeEventListener('touchmove', block);
    };
  }, [def]);

  const onStageClick = useCallback(() => {
    if (!overviewRef.current) deck.next();
  }, []);

  const { Stage, Overlay } = def;
  const Chrome = def.Chrome === undefined ? DefaultChrome : def.Chrome;

  return (
    <div className={`viewport${flags.capture ? ' capture' : ''}`} onClick={onStageClick}>
      <div
        className={`stage${d.black ? ' abs-black' : ''}`}
        style={{ transform: `translate(${fit.ox}px,${fit.oy}px) scale(${fit.scale})` }}
      >
        <StageScale.Provider value={fit.scale}>
          <Stage />
        </StageScale.Provider>
        {Chrome && <Chrome black={d.black} />}
        {/* cut to black (and operator blackout): instant, nothing on top except the Overlay */}
        <div className="layer" style={{ background: '#000', opacity: d.cut ? 1 : 0 }} />
        {Overlay && <Overlay />}
      </div>
      {overview && <Overview onClose={() => setOverview(false)} />}
      {flags.debug && <DebugPanel />}
    </div>
  );
}
