// Shared by verify.mjs and shot.mjs.
import { spawn } from 'node:child_process';

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const name = (s, b) => `${String(s).padStart(2, '0')}-${String(b).padStart(2, '0')}`;

/**
 * Serve the deck locally: `vite preview` of a build (`dist`), or the dev server (`dev: true`, no build needed;
 * `mode` picks an example). Resolves to { base, stop }.
 */
export async function startServer({ dist = 'dist', dev = false, mode, port = 4174 } = {}) {
  const vite = 'node_modules/vite/bin/vite.js';
  const argv = dev
    ? [vite, '--host', '127.0.0.1', '--port', String(port), '--strictPort', ...(mode ? ['--mode', mode] : [])]
    : [vite, 'preview', '--outDir', dist, '--host', '127.0.0.1', '--port', String(port), '--strictPort'];
  const server = spawn(process.execPath, argv, { stdio: 'pipe' });
  const stop = () => { try { server.kill(); } catch { /* already gone */ } };
  process.on('exit', stop);
  const base = `http://127.0.0.1:${port}/`;
  for (let i = 0; i < 100; i++) {
    try { if ((await fetch(base)).ok) return { base, stop }; } catch { /* not up yet */ }
    await sleep(150);
  }
  stop();
  throw new Error(`could not start vite on ${base}`);
}

/** Wait until nothing animates (GSAP + finite CSS; two quiet polls in a row), at least `min`, at most `max` ms. */
export async function settle(page, { min = 500, max = 8000 } = {}) {
  const start = Date.now();
  await sleep(min);
  let quiet = 0;
  while (Date.now() - start < max) {
    const busy = await page.evaluate(() => window.__beatdeck?.busy?.() ?? false);
    quiet = busy ? 0 : quiet + 1;
    if (quiet >= 2) return Date.now() - start;
    await sleep(120);
  }
  return Date.now() - start;
}

/**
 * DOM audit of the current frame (runs in the page via page.evaluate). Looks only at text that is actually
 * visible: effective opacity (own × ancestors) > 0.5. Returns problems as strings.
 */
export function auditFrame() {
  const stage = document.querySelector('.stage');
  if (!stage) return [];
  const out = [];
  const visible = (el) => {
    let o = 1;
    for (let e = el; e && e !== stage.parentElement; e = e.parentElement) {
      const cs = getComputedStyle(e);
      if (cs.visibility === 'hidden' || cs.display === 'none') return false;
      o *= +cs.opacity;
    }
    return o > 0.5;
  };
  const texts = [];
  const walker = document.createTreeWalker(stage, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (!n.textContent.trim()) continue;
    const el = n.parentElement;
    if (!el || !visible(el)) continue;
    if (!texts.includes(el)) texts.push(el);
    // characters that change meaning under text-transform: uppercase (µ → Greek Μ, ß → SS)
    if (/[µß]/.test(n.textContent) && getComputedStyle(el).textTransform === 'uppercase') {
      out.push(`uppercase changes "${n.textContent.trim().slice(0, 40)}" (µ/ß): wrap the unit in <span className="keep-case">`);
    }
  }
  return out;
}
