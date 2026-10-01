import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/stage.css';
import './styles/operator.css';
import { flags, reducedMotion } from './flags';
import { createEngine } from './engine';
import type { DeckDefinition } from './types';

/** Boot the deck: wait (bounded) for its fonts, then render the stage — or the presenter view with `?view=presenter`. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function mount(def: DeckDefinition<any>, el: HTMLElement = document.getElementById('root')!) {
  createEngine(def);
  document.documentElement.lang = def.lang ?? 'en';
  document.title = flags.presenter ? `Presenter · ${def.title}` : def.title;
  reducedMotion.set(null); // applies the .reduced-motion class from the OS setting / ?reduced=1
  // wait for the local fonts so the projector never shows a fallback face (bounded: never block the talk)
  if (def.fonts?.length) {
    await Promise.race([
      Promise.all(def.fonts.map((f) => document.fonts.load(f))).catch(() => {}),
      new Promise((r) => setTimeout(r, 2500)),
    ]);
  }
  const root = createRoot(el);
  if (flags.presenter) {
    const { PresenterView } = await import('./app/PresenterView');
    root.render(<StrictMode><PresenterView /></StrictMode>);
  } else {
    const { App } = await import('./app/App');
    root.render(<App def={def} />);
  }
}
