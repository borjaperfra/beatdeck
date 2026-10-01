// Verifies a built deck end to end — the automated half of skills/building-a-beatdeck/references/checklist.md.
//
//   1. forward walk with PageDown (like a clicker)        → <out>/walk-SS-BB.png, position checked on every beat
//   2. backward walk with PageUp from the last beat        → <out>/back-SS-BB.png (follows the deck's own `prev`)
//   3. every beat loaded straight from its URL hash        → <out>/direct-SS-BB.png
//   4. walk and back frames pixel-compared with direct     → a beat that differs is not reconstructable from state
//   5. ?reduced=1 applies and renders without errors
//   6. the closing QR decodes to deck qrUrl (if configured)
//   7. presenter window connects and drives the stage; overview opens
//   8. contact sheet of every beat                         → <out>/contact.png
// Fails on console errors/warnings, page errors, wrong positions, frame mismatches, a QR that does not scan,
// or any request to a non-local host. `?capture=1` freezes auto-advance and ambient loops; each frame is taken
// once nothing is animating (GSAP + CSS), bounded by --max-wait.
//
// Usage: node scripts/verify.mjs [distDir=dist] [outDir=artifacts/verify]
//          [--diff=0.1]       max % of pixels allowed to differ between walk/back and direct frames
//                             (a beat can raise its own limit with `tolerance` in scenes.ts)
//          [--max-wait=8000]  per-beat settle timeout (ms)   [--min-wait=500]
//          [--jobs=4]         pages loading beats from the URL in parallel
//          [--source=<file>]  Terminal lines and [data-exact] text must appear verbatim in this file
// Needs a Chromium-family browser: Chrome, Edge, Playwright's Chromium, or $BEATDECK_BROWSER (see scripts/lib.mjs).
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { auditFrame, contactSheet, launchBrowser, missingFromSource, name, settle as settleOn, sleep, startServer } from './lib.mjs';

const args = process.argv.slice(2);
const pos = args.filter((a) => !a.startsWith('--'));
const opt = (k, d) => +(args.find((a) => a.startsWith(`--${k}=`))?.split('=')[1] ?? d);
const DIST = pos[0] ?? 'dist';
const OUT = pos[1] ?? 'artifacts/verify';
const DIFF = opt('diff', 0.1);
const MAX_WAIT = opt('max-wait', 8000);
const MIN_WAIT = opt('min-wait', 500);
const JOBS = Math.max(1, opt('jobs', 4));
const SOURCE = args.find((a) => a.startsWith('--source='))?.slice(9);
if (SOURCE && !existsSync(SOURCE)) { console.error(`✕ verify: --source ${SOURCE} does not exist`); process.exit(1); }
const JSQR = createRequire(import.meta.url).resolve('jsqr/dist/jsQR.js');
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
const t0 = Date.now();

const { base: BASE, stop } = await startServer({ dist: DIST });
const browser = await launchBrowser();
const errors = [], remote = [];
// one context per parallel worker: pages sharing a context get their animation frames throttled
async function newContext() {
  const c = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  c.on('request', (r) => {
    const u = new URL(r.url());
    if (u.protocol.startsWith('http') && !['127.0.0.1', 'localhost'].includes(u.hostname)) remote.push(r.url());
  });
  return c;
}
const context = await newContext();
const watch = (p, tag = '') => {
  p.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(`${tag}[${m.type()}] ${m.text()}`); });
  p.on('pageerror', (e) => errors.push(`${tag}[pageerror] ${e.message}`));
  return p;
};
const page = watch(await context.newPage());

const hashOf = async () => page.evaluate(() => location.hash);
const settle = (p = page) => settleOn(p, { min: MIN_WAIT, max: MAX_WAIT });
async function load(hash, query = 'capture=1', p = page) {
  await p.goto('about:blank');
  await p.goto(`${BASE}?${query}${hash}`);
  try {
    await p.waitForFunction(() => window.__beatdeck && document.fonts.status === 'loaded', null, { timeout: 15000 });
  } catch {
    console.error(`✕ verify: the deck did not start at ${hash}`);
    errors.forEach((e) => console.error('  ' + e));
    await browser.close();
    process.exit(1);
  }
}

const layout = [], warnings = new Set(), exact = new Map();

// 1) forward walk
await load('#1.1');
await page.evaluate(() => localStorage.clear());
await load('#1.1');
const { beats, qrUrl, tolerance } = await page.evaluate(() => ({ beats: window.__beatdeck.beats, qrUrl: window.__beatdeck.qrUrl, tolerance: window.__beatdeck.tolerance }));
const tol = (s, b) => tolerance?.[s - 1]?.[b - 1] ?? DIFF;
const all = beats.flatMap((bs, s) => bs.map((_, b) => [s + 1, b + 1]));
const slow = [];
for (const [s, b] of all) {
  if (!(s === 1 && b === 1)) await page.keyboard.press('PageDown');
  const ms = await settle();
  if (ms >= MAX_WAIT) slow.push(`${s}.${b}`);
  await page.screenshot({ path: `${OUT}/walk-${name(s, b)}.png` });
  const audit = await page.evaluate(auditFrame);
  audit.errors.forEach((e) => layout.push(`${s}.${b} ${e}`));
  audit.warnings.forEach((w) => warnings.add(w));
  audit.exact.forEach((e) => { if (!exact.has(e.t)) exact.set(e.t, { ...e, at: `${s}.${b}` }); });
  const h = await hashOf();
  if (h !== `#${s}.${b}`) errors.push(`[walk] expected #${s}.${b}, got ${h}`);
}

// 2) backward walk (whatever path the deck's prev() takes)
const back = [];
for (let guard = 0; guard <= all.length; guard++) {
  if (guard > 0) {
    const before = await hashOf();
    await page.keyboard.press('PageUp');
    await settle();
    if ((await hashOf()) === before) break; // reached the start
  }
  const h = await hashOf();
  const [s, b] = h.slice(1).split('.').map(Number);
  await page.screenshot({ path: `${OUT}/back-${name(s, b)}.png` });
  back.push([s, b]);
}
if (back.at(-1)?.join('.') !== '1.1') errors.push(`[back] PageUp from the end stopped at #${back.at(-1)?.join('.')}, not #1.1`);

// 3) direct from URL, JOBS pages in parallel (each beat is a fresh load, so order does not matter)
{
  const queue = [...all];
  const workers = await Promise.all(Array.from({ length: Math.min(JOBS, queue.length) }, async (_, i) => (i === 0 ? page : watch(await (await newContext()).newPage()))));
  await Promise.all(workers.map(async (w) => {
    for (let item = queue.shift(); item; item = queue.shift()) {
      const [s, b] = item;
      await load(`#${s}.${b}`, 'capture=1', w);
      if ((await settle(w)) >= MAX_WAIT && !slow.includes(`${s}.${b}`)) slow.push(`${s}.${b}`);
      await w.screenshot({ path: `${OUT}/direct-${name(s, b)}.png` });
    }
  }));
  for (const w of workers) if (w !== page) await w.context().close();
}

// 4) compare frames (in the browser: decode both PNGs, count pixels differing by > 40 in any channel)
const cmp = await context.newPage();
await cmp.setContent('<canvas id=a></canvas><canvas id=b></canvas>');
const b64 = (f) => `data:image/png;base64,${readFileSync(f).toString('base64')}`;
async function diffPct(fa, fb) {
  return cmp.evaluate(async ([ua, ub]) => {
    const img = (u) => new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = u; });
    const [ia, ib] = await Promise.all([img(ua), img(ub)]);
    const px = (i, id) => { const c = document.getElementById(id); c.width = i.width; c.height = i.height; const x = c.getContext('2d'); x.drawImage(i, 0, 0); return x.getImageData(0, 0, i.width, i.height).data; };
    const a = px(ia, 'a'), b = px(ib, 'b');
    let n = 0;
    for (let k = 0; k < a.length; k += 4) if (Math.abs(a[k] - b[k]) > 40 || Math.abs(a[k + 1] - b[k + 1]) > 40 || Math.abs(a[k + 2] - b[k + 2]) > 40) n++;
    return (100 * n) / (a.length / 4);
  }, [b64(fa), b64(fb)]);
}
const mismatches = [];
for (const [s, b] of all) {
  const d = await diffPct(`${OUT}/walk-${name(s, b)}.png`, `${OUT}/direct-${name(s, b)}.png`);
  if (d > tol(s, b)) mismatches.push(`walk ${s}.${b} vs direct: ${d.toFixed(2)}% of pixels differ (max ${tol(s, b)}%)`);
}
for (const [s, b] of back) {
  const d = await diffPct(`${OUT}/back-${name(s, b)}.png`, `${OUT}/direct-${name(s, b)}.png`);
  if (d > tol(s, b)) mismatches.push(`back ${s}.${b} vs direct: ${d.toFixed(2)}% of pixels differ (max ${tol(s, b)}%)`);
}

// 5) reduced motion
const [ls, lb] = all.at(-1);
await load(`#${ls}.${lb}`, 'capture=1&reduced=1');
await settle();
if (!(await page.evaluate(() => document.documentElement.classList.contains('reduced-motion')))) errors.push('[reduced] ?reduced=1 did not apply .reduced-motion');

// 6) QR: decode every walk frame, the configured URL must be found and nothing else
const decoded = new Map();
if (qrUrl) {
  await cmp.addScriptTag({ path: JSQR });
  for (const [s, b] of all) {
    const text = await cmp.evaluate(async (u) => {
      const i = await new Promise((r) => { const im = new Image(); im.onload = () => r(im); im.src = u; });
      const c = document.getElementById('a'); c.width = i.width; c.height = i.height;
      const x = c.getContext('2d'); x.drawImage(i, 0, 0);
      const d = x.getImageData(0, 0, i.width, i.height);
      return window.jsQR(d.data, d.width, d.height)?.data ?? null;
    }, b64(`${OUT}/walk-${name(s, b)}.png`));
    if (text) decoded.set(`${s}.${b}`, text);
  }
  if (!decoded.size) errors.push(`[qr] qrUrl is ${qrUrl} but no frame has a QR that decodes`);
  for (const [p, t] of decoded) if (t !== qrUrl) errors.push(`[qr] ${p} decodes to ${t}, expected ${qrUrl}`);
}

// 7) presenter + overview
const presenter = await context.newPage();
presenter.on('pageerror', (e) => errors.push(`[presenter pageerror] ${e.message}`));
await load(`#${ls}.${lb}`);
await presenter.goto(`${BASE}?view=presenter`);
await sleep(1800);
await presenter.screenshot({ path: `${OUT}/presenter.png` });
const connected = await presenter.evaluate(() => document.body.innerText.toLowerCase().includes('stage connected'));
if (!connected) errors.push('[presenter] not connected to the stage');
const before = await hashOf();
await presenter.keyboard.press('PageUp');
await sleep(600);
if ((await hashOf()) === before) errors.push(`[presenter] PageUp did not move the stage (${before})`);
await presenter.close();
await page.keyboard.press('o');
await sleep(400);
await page.screenshot({ path: `${OUT}/overview.png` });
await page.keyboard.press('Escape');

// 8) contact sheet
await contactSheet(cmp, all.map(([s, b]) => ({ file: `${OUT}/walk-${name(s, b)}.png`, label: `${s}.${b}${beats[s - 1][b - 1] ? ' · auto' : ''}` })), `${OUT}/contact.png`);

// exact text: every Terminal line / [data-exact] element must appear verbatim in the source
const notInSource = [];
if (SOURCE) {
  for (const e of missingFromSource([...exact.values()], readFileSync(SOURCE, 'utf8'))) {
    notInSource.push(`${e.at} ${JSON.stringify(e.t)} is not in ${SOURCE}${e.term ? ' (terminal line: compared character for character)' : ''}`);
  }
}

const report = { beats: all.length, backPath: back.map((p) => p.join('.')), errors, remote, mismatches, layout, notInSource, warnings: [...warnings], qr: Object.fromEntries(decoded), slowToSettle: slow, presenterConnected: connected, seconds: Math.round((Date.now() - t0) / 1000) };
writeFileSync(`${OUT}/report.json`, JSON.stringify(report, null, 2));
await browser.close();
stop();

const ok = !errors.length && !remote.length && !mismatches.length && !layout.length && !notInSource.length;
console.log(`${ok ? '✓' : '✕'} verify · ${all.length} beats walked, ${back.length} walked back, ${all.length} reloaded from the URL · ${report.seconds}s`);
console.log(`  frames identical (≤ ${DIFF}% px): ${mismatches.length ? `${mismatches.length} mismatch(es)` : 'yes'}`);
mismatches.forEach((m) => console.log('    ' + m));
console.log(`  text and layout: ${layout.length ? `${layout.length} problem(s)` : 'ok'}`);
layout.forEach((m) => console.log('    ' + m));
console.log(`  exact text: ${SOURCE ? (notInSource.length ? `${notInSource.length} line(s) not in the source` : `${exact.size} line(s) match ${SOURCE}`) : `${exact.size} line(s) on stage, not checked (pass --source=<script>)`}`);
notInSource.forEach((m) => console.log('    ' + m));
if (warnings.size) { console.log(`  warnings (not failing): ${warnings.size}`); [...warnings].slice(0, 12).forEach((w) => console.log('    ' + w)); if (warnings.size > 12) console.log(`    … see report.json`); }
console.log(`  QR: ${qrUrl ? (decoded.size ? `decodes to ${qrUrl} on ${[...decoded.keys()].join(', ')}` : 'NOT FOUND') : 'not configured (qrUrl is TODO)'}`);
console.log(`  console errors/warnings: ${errors.length} · remote requests: ${remote.length} · presenter: ${connected ? 'connected' : 'NOT connected'}`);
errors.forEach((e) => console.log('    ' + e));
remote.forEach((u) => console.log('    remote: ' + u));
if (slow.length) console.log(`  still animating after ${MAX_WAIT} ms (frame taken anyway): ${slow.join(', ')}`);
console.log(`  frames, contact sheet, report → ${OUT}/`);
process.exit(ok ? 0 : 1);
