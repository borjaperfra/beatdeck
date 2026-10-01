// Shared by verify.mjs and shot.mjs.
import { spawn } from 'node:child_process';
import { chromium } from 'playwright-core';

/**
 * A headless Chromium-family browser: $BEATDECK_BROWSER (an executable path), else installed Chrome, else Edge,
 * else Playwright's own Chromium (`npx playwright-core install chromium`).
 */
export async function launchBrowser() {
  const args = ['--force-device-scale-factor=1'];
  const tries = [
    ...(process.env.BEATDECK_BROWSER ? [{ executablePath: process.env.BEATDECK_BROWSER }] : []),
    { channel: 'chrome' }, { channel: 'msedge' }, {},
  ];
  for (const t of tries) {
    try { return await chromium.launch({ headless: true, args, ...t }); } catch { /* next */ }
  }
  console.error('✕ no browser found for screenshots. Install Google Chrome, or run `npx playwright-core install chromium`,');
  console.error('  or set BEATDECK_BROWSER to a Chromium/Chrome/Edge executable.');
  process.exit(1);
}

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
 * visible: effective opacity (own × ancestors) > 0.5, not hidden, not inside `[data-audit="off"]`.
 * Returns { errors, warnings, exact } — `exact` are the texts that must match the source verbatim
 * (Terminal lines and `[data-exact]` elements).
 */
export function auditFrame() {
  const stage = document.querySelector('.stage');
  const res = { errors: [], warnings: [], exact: [] };
  if (!stage) return res;
  const sr = stage.getBoundingClientRect();
  const k = sr.width / 1920;
  const visible = (el) => {
    let o = 1;
    for (let e = el; e && e !== stage.parentElement; e = e.parentElement) {
      if (e.dataset?.audit === 'off') return false;
      const cs = getComputedStyle(e);
      if (cs.visibility === 'hidden' || cs.display === 'none') return false;
      o *= +cs.opacity;
    }
    return o > 0.5;
  };
  const short = (t) => JSON.stringify(t.trim().replace(/\s+/g, ' ').slice(0, 40));
  const boxes = [];
  const small = new Set();
  const walker = document.createTreeWalker(stage, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (!n.textContent.trim()) continue;
    const el = n.parentElement;
    if (!el || !visible(el)) continue;
    const cs = getComputedStyle(el);
    // characters that change meaning under text-transform: uppercase (µ → Greek Μ, ß → SS)
    if (/[µß]/.test(n.textContent) && cs.textTransform === 'uppercase') {
      res.errors.push(`uppercase changes ${short(n.textContent)} (µ/ß): wrap the unit in <span className="keep-case">`);
    }
    const px = parseFloat(cs.fontSize) / k;
    if (px < 17.5) small.add(`${short(n.textContent)} is ${Math.round(px)} px (stage minimum 18)`);
    const range = document.createRange();
    range.selectNodeContents(n);
    for (const r of range.getClientRects()) {
      if (r.width < 1 || r.height < 1) continue;
      // the line box of large type is much taller than its glyphs: keep the central ~0.8 em for overlap tests
      const fpx = parseFloat(cs.fontSize);
      const inset = Math.max(0, (r.height - 0.8 * fpx) / 2);
      const b = { x: (r.left - sr.left) / k, y: (r.top + inset - sr.top) / k, w: r.width / k, h: (r.height - 2 * inset) / k, t: n.textContent, n };
      boxes.push(b);
      if (b.x < -2 || b.y < -2 || b.x + b.w > 1922 || b.y + b.h > 1082) {
        res.errors.push(`${short(b.t)} is outside the 1920×1080 stage (x ${Math.round(b.x)}…${Math.round(b.x + b.w)}, y ${Math.round(b.y)}…${Math.round(b.y + b.h)})`);
      }
    }
  }
  // overlapping text: two different text nodes whose line boxes share > 30% of the smaller one
  const seen = new Set();
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i], c = boxes[j];
      if (a.n === c.n) continue;
      const ix = Math.min(a.x + a.w, c.x + c.w) - Math.max(a.x, c.x);
      const iy = Math.min(a.y + a.h, c.y + c.h) - Math.max(a.y, c.y);
      if (ix <= 0 || iy <= 0) continue;
      if (ix * iy > 0.3 * Math.min(a.w * a.h, c.w * c.h)) {
        const key = `${a.t}|${c.t}`;
        if (seen.has(key)) continue;
        seen.add(key);
        res.errors.push(`text overlaps: ${short(a.t)} and ${short(c.t)} (add data-audit="off" if intended)`);
      }
    }
  }
  res.warnings.push(...small);
  for (const el of stage.querySelectorAll('.bd-term-line, [data-exact]')) {
    if (visible(el) && el.textContent.trim()) res.exact.push({ t: el.textContent, term: el.classList.contains('bd-term-line') });
  }
  return res;
}

/**
 * Render a contact sheet of frames (`[{ file, label }]`) into `out` using `page` (any blank page).
 * Four 480×270 thumbnails per row, labelled.
 */
export async function contactSheet(page, frames, out) {
  const { readFileSync } = await import('node:fs');
  const cols = 4, w = 480, h = 270;
  const cells = frames.map(({ file, label }) => `<figure><img src="data:image/png;base64,${readFileSync(file).toString('base64')}"><figcaption>${label}</figcaption></figure>`).join('');
  await page.setViewportSize({ width: cols * (w + 8) + 8, height: 600 });
  await page.setContent(`<style>body{margin:0;background:#222;font:14px ui-monospace,monospace;color:#bbb;display:grid;grid-template-columns:repeat(${cols},${w}px);gap:8px;padding:8px}figure{margin:0}img{width:${w}px;height:${h}px;display:block}figcaption{padding:4px 2px}</style>${cells}`);
  await page.screenshot({ path: out, fullPage: true });
}

/** Source text as prose: Markdown markers removed (quotes, bullets, headings, **bold**, `code`), whitespace collapsed. */
export function proseOf(md) {
  return md.replace(/\r/g, '').split('\n')
    .map((l) => l.replace(/^\s*#{1,6}\s+/, '').replace(/^\s*(?:>\s?)+/, '').replace(/^\s*(?:[-*+]|\d+\.)\s+/, ''))
    .join('\n').replace(/\*\*|__|`/g, '').replace(/\s+/g, ' ');
}

/**
 * Exact-text check. Terminal lines must appear character for character in the source; [data-exact] text must
 * appear in its prose (Markdown markers and line breaks do not count). Returns the entries that do not.
 */
export function missingFromSource(entries, md) {
  const raw = md.replace(/\r/g, '');
  const prose = proseOf(md);
  return entries.filter(({ t, term }) => (term ? !raw.includes(t) : !prose.includes(t.replace(/\s+/g, ' ').trim())));
}
