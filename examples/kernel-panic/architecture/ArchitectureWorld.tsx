import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { gsap } from 'gsap';
import { useDeck } from '../deck/state';
import { glitch, rng } from 'beatdeck';
import { getArchitectureState } from './architecture-state';
import { userCols } from './architecture-layouts';
import { edgeGeo, edgePoints, getBoundaryGeo, getNodeGeo, pathD, polyLen, worldRuntime, type NodeGeo } from './geometry';
import { ArchitectureNode } from './ArchitectureNode';
import { ArchitectureEdge } from './ArchitectureEdge';
import { ArchitectureBoundary } from './ArchitectureBoundary';
import { useGlitch } from 'beatdeck';

const EASE = 'power4.out'; // = cubic-bezier(.22,1,.36,1), v3's world easing

/**
 * ONE architecture world for scenes 04.5 → 07.5. Nodes, wires and boundaries are keyed by stable IDs and physically
 * travel between beats: GSAP tweens plain geometry objects, a single ticker writes transforms/sizes to the DOM and
 * recomputes every wire from the animated rects (the canvas reads the same geometry for packets).
 */
export function ArchitectureWorld() {
  const d = useDeck((st) => ({ s: st.scene, b: st.beat, users: st.live.users, warnN: st.live.warnN, panic: st.live.panic, black: st.live.black }));
  const state = useMemo(
    () => getArchitectureState(d.s, d.b, { users: d.users, warnN: d.warnN, panic: d.panic, black: d.black }),
    [d.s, d.b, d.users, d.warnN, d.panic, d.black],
  );
  const gl = useGlitch();
  const nodeEls = useRef<Record<string, HTMLDivElement | null>>({});
  const frameEls = useRef<Record<string, HTMLDivElement | null>>({});
  const edgeEls = useRef<Record<string, SVGPathElement | null>>({});
  const targets = useRef<Record<string, string>>({});
  const dirty = useRef(true);
  const lastScene = useRef(d.s);
  const sceneChanged = lastScene.current !== d.s;
  const refFns = useRef<Record<string, (el: never) => void>>({});
  const refFor = <T,>(bag: Record<string, T | null>, key: string) =>
    (refFns.current[key] ??= ((el: T | null) => { bag[key.slice(2)] = el; }) as (el: never) => void) as (el: T | null) => void;
  const stateRef = useRef(state);
  stateRef.current = state;

  // runtime values for the canvas
  useLayoutEffect(() => {
    Object.assign(worldRuntime, {
      scene: d.s, beat: d.b, routes: state.routes, rate: state.rate, users: state.users,
      cols: userCols(d.s, d.b, d.users), showUsers: state.showUsers, panic: d.panic, worldOpacity: state.worldOpacity,
      changedAt: performance.now(),
    });
  }, [state, d.s, d.b, d.users, d.panic]);

  // tween toward this beat's targets
  useLayoutEffect(() => {
    const mark = () => { dirty.current = true; };
    // on a scene change the outgoing typography leaves first (motion.ts OUT_MS); the world moves after it
    const wait = lastScene.current !== d.s ? 300 : 0;
    lastScene.current = d.s;
    const tweenBox = (key: string, g: NodeGeo, on: boolean, rect: number[] | null, delay0: number, enterOffset: number) => {
      const delay = delay0 + wait;
      const k = on && rect ? rect.join(',') : 'off';
      if (targets.current[key] === k) return;
      targets.current[key] = k;
      gsap.killTweensOf(g);
      if (on && rect) {
        const [x, y, w, h] = rect;
        if (!g.placed) Object.assign(g, { x: x - enterOffset, y, w, h, o: 0, placed: true });
        gsap.to(g, { x, y, w, h, duration: 1, ease: EASE, delay: delay / 1000, onUpdate: mark });
        gsap.to(g, { o: 1, duration: 0.5, ease: 'none', delay: delay / 1000, onUpdate: mark });
      } else if (g.placed) {
        gsap.to(g, { o: 0, duration: 0.5, ease: 'none', onUpdate: mark });
        if (enterOffset) gsap.to(g, { x: g.x - enterOffset, duration: 0.6, ease: EASE, onUpdate: mark });
      }
    };
    state.nodes.forEach((n) => tweenBox('n:' + n.id, getNodeGeo(n.id), n.on, n.rect, n.delay, 60));
    state.boundaries.forEach((f) => tweenBox('f:' + f.id, getBoundaryGeo(f.id), f.on, f.rect, f.delay, 0));
    state.edges.forEach((e) => {
      const g = (edgeGeo[e.id] ??= { pts: [], len: 0, draw: 0, on: false });
      if (g.on === e.on) return;
      g.on = e.on;
      gsap.killTweensOf(g);
      gsap.to(g, { draw: e.on ? 1 : 0, duration: 1, ease: EASE, delay: e.on ? (e.delay + wait) / 1000 : 0, onUpdate: mark });
    });
    dirty.current = true;
  }, [state]);

  // single writer: geometry → DOM
  useEffect(() => {
    let wasShaking = false;
    const apply = () => {
      const g = glitch.get();
      const shaking = g.panic && g.violent;
      if (!dirty.current && !shaking && !wasShaking) return;
      wasShaking = shaking;
      dirty.current = false;
      const st = stateRef.current;
      st.nodes.forEach((n, i) => {
        const el = nodeEls.current[n.id];
        const q = getNodeGeo(n.id);
        if (!el) return;
        let tx = q.x, ty = q.y, rot = 0, flick = 1;
        if (shaking && n.on) {
          const r = (k: number) => rng(g.seed, k);
          tx += (r(i) - 0.5) * 140; ty += (r(i + 50) - 0.5) * 100; rot = (r(i + 90) - 0.5) * 12;
          flick = r(i + 130) < 0.3 ? 0.25 : 1;
        }
        el.style.transform = `translate3d(${tx.toFixed(1)}px,${ty.toFixed(1)}px,0)${rot ? ` rotate(${rot.toFixed(2)}deg)` : ''}`;
        el.style.width = `${q.w.toFixed(1)}px`;
        el.style.height = `${q.h.toFixed(1)}px`;
        el.style.opacity = (q.o * flick).toFixed(3);
        el.style.visibility = q.o < 0.005 ? 'hidden' : 'visible';
      });
      st.boundaries.forEach((f) => {
        const el = frameEls.current[f.id];
        const q = getBoundaryGeo(f.id);
        if (!el) return;
        el.style.transform = `translate3d(${q.x.toFixed(1)}px,${q.y.toFixed(1)}px,0)`;
        el.style.width = `${q.w.toFixed(1)}px`;
        el.style.height = `${q.h.toFixed(1)}px`;
        el.style.opacity = q.o.toFixed(3);
        el.style.visibility = q.o < 0.005 ? 'hidden' : 'visible';
      });
      st.edges.forEach((e, i) => {
        const el = edgeEls.current[e.id];
        const q = edgeGeo[e.id];
        if (!el || !q) return;
        q.pts = edgePoints(e.from, e.to, e.shape);
        q.len = polyLen(q.pts) + 2;
        el.setAttribute('d', pathD(q.pts));
        if (shaking && e.on) {
          el.style.strokeDasharray = '6 16';
          el.style.strokeDashoffset = String(Math.round(rng(g.seed, i + 200) * 40));
          el.style.opacity = '1';
        } else if (e.implied) {
          el.style.strokeDasharray = '5 9';
          el.style.strokeDashoffset = '0';
          el.style.opacity = q.draw.toFixed(3);
        } else {
          el.style.strokeDasharray = `${q.len.toFixed(1)} ${q.len.toFixed(1)}`;
          el.style.strokeDashoffset = (q.len * (1 - q.draw)).toFixed(1);
          el.style.opacity = q.draw > 0.001 ? '1' : '0';
        }
      });
    };
    gsap.ticker.add(apply);
    return () => gsap.ticker.remove(apply);
  }, []);

  return (
    <div className="layer arch-world" style={{ opacity: state.worldOpacity, transition: state.worldOpacity < 1 ? 'opacity 600ms ease' : 'opacity 700ms ease 320ms' }}>
      {state.boundaries.map((f) => (
        <ArchitectureBoundary key={f.id} f={f} setRef={refFor(frameEls.current, 'f:' + f.id)} />
      ))}
      <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        {state.edges.map((e) => (
          <ArchitectureEdge key={e.id} e={e} panic={gl.panic} setRef={refFor(edgeEls.current, 'e:' + e.id)} />
        ))}
      </svg>
      {state.nodes.map((n) => (
        <ArchitectureNode key={n.id} n={n} lag={n.delay + (sceneChanged ? 300 : 0)} setRef={refFor(nodeEls.current, 'n:' + n.id)} />
      ))}
    </div>
  );
}
