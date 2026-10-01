import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/stage.css';
import './styles/operator.css';
import './styles/components.css';
import { flags, reducedMotion } from './flags';
import { createEngine } from './engine';
import type { DeckDefinition } from './types';

/** Boot the deck: wait (bounded) for its fonts, then render the stage — or the presenter view with `?view=presenter`. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function mount(def: DeckDefinition<any>, el: HTMLElement = document.getElementById('root')!) {
  createEngine(def);
  document.documentElement.lang = def.lang ?? 'en';
  document.title = flags.presenter ? `Presenter · ${def.title}` : def.title;
  reducedMotion.set(flags.reducedParam ? true : null); // ?reduced=1 forces it; otherwise follow the OS setting
  // wait for the local fonts so the projector never shows a fallback face (bounded: never block the talk)
  if (def.fonts?.length) {
    await Promise.race([
      Promise.all(def.fonts.map((f) => document.fonts.load(f))).catch(() => {}),
      new Promise((r) => setTimeout(r, 2500)),
    ]);
  }
  matchColorScheme();
  const root = createRoot(el);
  if (flags.presenter) {
    const { PresenterView } = await import('./app/PresenterView');
    root.render(<StrictMode><PresenterView /></StrictMode>);
  } else {
    const { App } = await import('./app/App');
    root.render(<App def={def} />);
  }
}

/** Set `<meta name="color-scheme">` from the theme's --bg, so form controls and scrollbars match a light or dark deck. */
function matchColorScheme() {
  const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
  const m = /^#?([0-9a-f]{6})$/i.exec(bg);
  if (!m) return;
  const n = parseInt(m[1], 16);
  const lum = (0.2126 * (n >> 16) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255;
  let meta = document.querySelector<HTMLMetaElement>('meta[name="color-scheme"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = 'color-scheme';
    document.head.appendChild(meta);
  }
  meta.content = lum > 0.5 ? 'light' : 'dark';
}
