import { createContext, useContext } from 'react';

/** The fixed logical stage. Everything inside it is laid out in these pixels. */
export const STAGE_W = 1920;
export const STAGE_H = 1080;

export const StageScale = createContext(1);

/** Current stage scale (viewport px per stage px). */
export const useStageScale = () => useContext(StageScale);

/** Stage scale × devicePixelRatio, clamped to [1, 2] — the right backing-store ratio for a canvas layer. */
export function useStagePixelRatio(): number {
  const scale = useStageScale();
  return Math.min(2, Math.max(1, scale * (window.devicePixelRatio || 1)));
}
