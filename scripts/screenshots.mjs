// Visual check of a built deck: renders every beat at 1920×1080 into <out>/SS-BB.png.
// 1) walks the deck with PageDown like a clicker (?capture=1 freezes auto-advance and ambient loops),
// 2) reloads every beat straight from its URL hash into <out>/direct-SS-BB.png (proves reconstruct-from-state),
// 3) checks the presenter window connects and the overview opens,
// and fails on console errors, page errors, a wrong position, or any request to a non-local host.
//
// Usage: node scripts/screenshots.mjs [distDir=dist] [outDir=artifacts/screenshots] [--wait=1900] [--auto-wait=4500]
// Requires a local Chrome (playwright-core, channel "chrome").
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';

const args = process.argv.slice(2);
const pos = args.filter((a) => !a.startsWith('--'));
const opt = (k, d) => +(args.find((a) => a.startsWith(`--${k}=`))?.split('=')[1] ?? d);
const DIST = pos[0] ?? 'dist';
const OUT = pos[1] ?? 'artifacts/screenshots';
const WAIT = opt('wait', 1900);
const AUTO_WAIT = opt('auto-wait', 4500);
const PORT = 4174;
const BASE = `http://127.0.0.1:${PORT}/`;
mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--outDir', DIST, '--host', '127.0.0.1', '--port', String(PORT), '--strictPort'], { stdio: 'pipe' });
const stop = () => { try { server.kill(); } catch { /* already gone */ } };
process.on('exit', stop);
for (let i = 0; i < 50; i++) {
  try { if ((await fetch(BASE)).ok) break; } catch { /* not up yet */ }
  await sleep(200);
}

const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--force-device-scale-factor=1'] });
const context = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
const errors = [], remote = [];
context.on('request', (r) => {
  const u = new URL(r.url());
  if (u.protocol.startsWith('http') && !['127.0.0.1', 'localhost'].includes(u.hostname)) remote.push(r.url());
});
const page = await context.newPage();
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(`[${m.type()}] ${m.text()}`); });
page.on('pageerror', (e) => errors.push(`[pageerror] ${e.message}`));

const file = (s, b) => `${String(s).padStart(2, '0')}-${String(b).padStart(2, '0')}`;
const shot = (name) => page.screenshot({ path: `${OUT}/${name}.png` });

// 1) sequential walk (the real show)
await page.goto(`${BASE}?capture=1#1.1`);
await page.evaluate(() => localStorage.clear());
await page.goto(`${BASE}?capture=1#1.1`);
await page.waitForFunction(() => window.__beatdeck && document.fonts.status === 'loaded');
const beats = await page.evaluate(() => window.__beatdeck.beats);
await sleep(1200);
for (let s = 1; s <= beats.length; s++) {
  for (let b = 1; b <= beats[s - 1].length; b++) {
    if (!(s === 1 && b === 1)) await page.keyboard.press('PageDown');
    await sleep(beats[s - 1][b - 1] ? AUTO_WAIT : WAIT);
    await shot(file(s, b));
    const h = await page.evaluate(() => location.hash);
    if (h !== `#${s}.${b}`) errors.push(`[position] expected #${s}.${b}, got ${h}`);
  }
}

// 2) every beat straight from the URL (fresh load each time)
for (let s = 1; s <= beats.length; s++) {
  for (let b = 1; b <= beats[s - 1].length; b++) {
    await page.goto('about:blank');
    await page.goto(`${BASE}?capture=1#${s}.${b}`);
    await sleep(beats[s - 1][b - 1] ? AUTO_WAIT : WAIT);
    await shot(`direct-${file(s, b)}`);
  }
}

// 3) presenter window connects and drives the stage; overview opens
const presenter = await context.newPage();
presenter.on('pageerror', (e) => errors.push(`[presenter pageerror] ${e.message}`));
await presenter.goto(`${BASE}?view=presenter`);
await sleep(1800);
await presenter.screenshot({ path: `${OUT}/presenter.png` });
const connected = await presenter.evaluate(() => document.body.innerText.toLowerCase().includes('stage connected'));
if (!connected) errors.push('[presenter] not connected to the stage');
const before = await page.evaluate(() => location.hash);
await presenter.keyboard.press('PageUp');
await sleep(600);
const after = await page.evaluate(() => location.hash);
if (before === after) errors.push(`[presenter] PageUp did not move the stage (${before})`);
await page.keyboard.press('o');
await sleep(400);
await shot('overview');
await page.keyboard.press('Escape');

writeFileSync(`${OUT}/report.json`, JSON.stringify({ errors, remote, presenterConnected: connected }, null, 2));
console.log(`screenshots → ${OUT}`);
console.log(`console errors/warnings: ${errors.length}`);
errors.forEach((e) => console.log('  ' + e));
console.log(`remote requests: ${remote.length}`);
remote.forEach((u) => console.log('  ' + u));
await browser.close();
stop();
process.exit(errors.length || remote.length ? 1 : 0);
