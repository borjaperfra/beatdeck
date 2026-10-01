// Fails the build if the bundle references anything outside itself (fonts, CDNs, APIs, analytics).
// Usage: node scripts/check-offline.mjs <distDir> [deckDir]
// URLs written in <deckDir>/deck.config.ts are allowed: they are shown on stage (e.g. the QR target), never fetched.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, extname, relative, resolve } from 'node:path';

const DIST = resolve(process.argv[2] ?? 'dist');
const DECK = resolve(process.argv[3] ?? 'deck');
const URL_RE = /(?:https?:)?\/\/[a-z0-9.-]+\.[a-z]{2,}[^\s"'`)<>\\]*/gi;

const configUrls = [];
const cfg = join(DECK, 'deck.config.ts');
if (existsSync(cfg)) for (const m of readFileSync(cfg, 'utf8').matchAll(URL_RE)) if (/^https?:/.test(m[0])) configUrls.push(m[0]);

// URLs that are data, not fetches: SVG/XML namespaces, React's error-decoder link, GSAP's licence banner
const ALLOW = [/^https?:\/\/www\.w3\.org\//, /^https?:\/\/reactjs\.org\/docs\/error-decoder/, /^https?:\/\/react\.dev\/errors/,
  /^https?:\/\/gsap\.com(\/standard-license)?$/];
const allowed = (u) => ALLOW.some((r) => r.test(u)) || configUrls.some((c) => u === c || u.startsWith(c));

const TEXT = new Set(['.html', '.js', '.css', '.svg', '.json', '.webmanifest']);
const bad = [];
const walk = (d) => readdirSync(d).forEach((f) => {
  const p = join(d, f);
  if (statSync(p).isDirectory()) return walk(p);
  if (!TEXT.has(extname(p))) return;
  const src = readFileSync(p, 'utf8');
  for (const m of src.matchAll(URL_RE)) {
    let u = m[0];
    if (u.startsWith('//')) {
      // protocol-relative only counts inside url()/src/href contexts
      const before = src.slice(Math.max(0, m.index - 6), m.index);
      if (!/(url\(|src=|href=)["']?$/.test(before)) continue;
      u = 'https:' + u;
    }
    if (!/^https?:/.test(u) || allowed(u)) continue;
    bad.push(`${p.slice(DIST.length + 1)}: ${u}`);
  }
});

if (!existsSync(DIST)) {
  console.error(`✕ offline check: ${relative(process.cwd(), DIST)} does not exist (build first)`);
  process.exit(1);
}
walk(DIST);
if (bad.length) {
  console.error('\n✕ offline check: remote references found:\n  ' + [...new Set(bad)].join('\n  '));
  process.exit(1);
}
console.log(`✓ offline check: ${relative(process.cwd(), DIST) || '.'} has no remote references`);
