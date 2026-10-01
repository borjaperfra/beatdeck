// Quick look at a few beats while designing — no build needed (uses the dev server).
//
//   npm run shot -- 4.3 7.6        → artifacts/shot/04-03.png, artifacts/shot/07-06.png
//   npm run shot -- 3              → every beat of scene 3
//   npm run shot -- 2.1-2.4        → a range
//   npm run shot -- 3 --source=reference/script.md   (+ the exact-text check, as in verify)
//   npm run shot -- 4.3 --mode=kernel-panic   (an example, beatdeck repo only)   --dist=dist (a build instead of the dev server)
//
// Each beat is loaded straight from its URL (?capture=1), shot once it has settled, and audited
// (the same text checks as `npm run verify`). With more than one beat it also writes <out>/contact.png.
// For the full proof, run `npm run verify`.
import { mkdirSync, readFileSync } from 'node:fs';
import { auditFrame, contactSheet, launchBrowser, missingFromSource, name, settle, startServer } from './lib.mjs';

const args = process.argv.slice(2);
const flag = (k) => args.find((a) => a.startsWith(`--${k}=`))?.split('=')[1];
const specs = args.filter((a) => !a.startsWith('--'));
const OUT = flag('out') ?? 'artifacts/shot';
const SOURCE = flag('source');
const sourceText = SOURCE ? readFileSync(SOURCE, 'utf8') : null;
if (!specs.length) {
  console.error('usage: npm run shot -- <scene>[.<beat>] [<from>-<to>] … [--mode=<example>] [--dist=<dir>] [--out=<dir>]');
  process.exit(1);
}
mkdirSync(OUT, { recursive: true });

const dist = flag('dist');
const { base, stop } = await startServer(dist ? { dist, port: 4176 } : { dev: true, mode: flag('mode'), port: 4176 });
const browser = await launchBrowser();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(e.message));

await page.goto(`${base}?capture=1#1.1`);
await page.waitForFunction(() => window.__beatdeck, null, { timeout: 30000 });
const beats = await page.evaluate(() => window.__beatdeck.beats);
const all = beats.flatMap((bs, s) => bs.map((_, b) => [s + 1, b + 1]));
const idx = (s, b) => all.findIndex(([x, y]) => x === s && y === b);
const parse = (p) => p.split('.').map(Number);

const wanted = [];
for (const spec of specs) {
  if (spec.includes('-')) {
    const [a, z] = spec.split('-').map(parse);
    const i = idx(a[0], a[1] ?? 1), j = idx(z[0], z[1] ?? beats[z[0] - 1]?.length);
    if (i < 0 || j < 0) { console.error(`✕ no such range ${spec}`); continue; }
    wanted.push(...all.slice(i, j + 1));
  } else {
    const [s, b] = parse(spec);
    if (!beats[s - 1] || (b && b > beats[s - 1].length)) { console.error(`✕ no such beat ${spec}`); continue; }
    if (b) wanted.push([s, b]); else wanted.push(...all.filter(([x]) => x === s));
  }
}

let problems = 0;
const shots = [];
for (const [s, b] of wanted) {
  await page.goto('about:blank');
  await page.goto(`${base}?capture=1#${s}.${b}`);
  await page.waitForFunction(() => window.__beatdeck && document.fonts.status === 'loaded');
  await settle(page);
  const file = `${OUT}/${name(s, b)}.png`;
  await page.screenshot({ path: file });
  shots.push({ file, label: `${s}.${b}` });
  const { errors: found, warnings, exact } = await page.evaluate(auditFrame);
  const issues = [...found, ...(sourceText ? missingFromSource(exact, sourceText).map((e) => `${JSON.stringify(e.t)} is not in ${SOURCE}`) : [])];
  problems += issues.length;
  console.log(`${issues.length ? '✕' : '✓'} ${s}.${b} → ${file}`);
  issues.forEach((i) => console.log('    ' + i));
  warnings.forEach((w) => console.log('    (warning) ' + w));
}
errors.forEach((e) => console.log('  [error] ' + e));
if (shots.length > 1) {
  await contactSheet(await browser.newPage(), shots, `${OUT}/contact.png`);
  console.log(`  contact sheet → ${OUT}/contact.png`);
}
await browser.close();
stop();
process.exit(errors.length || problems ? 1 : 0);
