#!/usr/bin/env node
// Brings a talk project up to date with beatdeck, without touching the talk.
//
//   npm run upgrade                     latest beatdeck (main)
//   npm run upgrade -- --ref v0.3.0     a tag, branch or commit
//   npm run upgrade -- --from ../beatdeck   a local copy instead of GitHub
//   npm run upgrade -- --dry-run        show what would change
//   npm run upgrade -- --clean          also remove beatdeck-repo leftovers (showcase, plugin files, old CI)
//
// What it touches:
//   engine   src/beatdeck/, skills/building-a-beatdeck/, scripts/{check-offline,verify,shot,lib,upgrade}.mjs,
//            themes/neutral.css, themes/light.css → replaced. If you had edited one, your version is kept in
//            .beatdeck-backup/<time>/ first (engine files are not meant to be edited for one talk).
//   shared   vite.config.ts, tsconfig.json, src/main.tsx, src/vite-env.d.ts, .gitignore, .gitattributes,
//            .github/workflows/verify.yml → replaced only if you never edited them; otherwise the new version is written next
//            to yours as <file>.beatdeck-new for you to merge.
//   package.json → engine dependencies set to the new versions, missing engine scripts added. Nothing removed.
//   never    deck/, index.html, README.md, AGENTS.md, CLAUDE.md, docs/, reference/, your own themes and scripts.
// .beatdeck.json records the version and a hash of every engine/shared file, so the next upgrade knows what
// you changed.
import { createHash } from 'node:crypto';
import { execSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ENGINE_DIRS = ['src/beatdeck', 'skills/building-a-beatdeck'];
export const ENGINE_FILES = ['scripts/check-offline.mjs', 'scripts/verify.mjs', 'scripts/shot.mjs', 'scripts/lib.mjs', 'scripts/upgrade.mjs', 'themes/neutral.css', 'themes/light.css'];
// shared config: [path in the talk, path in the beatdeck repo]
export const SHARED = [
  ['vite.config.ts', 'vite.config.ts'], ['tsconfig.json', 'tsconfig.json'], ['src/main.tsx', 'src/main.tsx'],
  ['src/vite-env.d.ts', 'src/vite-env.d.ts'], ['.gitignore', '.gitignore'], ['.gitattributes', '.gitattributes'],
  ['.github/workflows/verify.yml', 'templates/talk/ci.yml'],
];
export const SHARED_FILES = SHARED.map(([t]) => t);
const MANIFEST = '.beatdeck.json';
// scripts that belong to the beatdeck repo itself, never to a talk
const REPO_ONLY_SCRIPT = (k) => k.includes('kernel-panic') || k === 'init';

/** How a repo file looks inside a talk project (the same edits `init` makes). */
export function forTalk(path, text) {
  if (path === 'tsconfig.json') return text.replace(/,\s*"examples"/, '').replace(/,\s*"templates"/, '');
  return text;
}

const sha = (buf) => createHash('sha256').update(buf).digest('hex').slice(0, 16);
const filesUnder = (root, dir) => {
  const abs = join(root, dir);
  if (!existsSync(abs)) return [];
  const out = [];
  const walk = (d) => readdirSync(d).forEach((f) => {
    const p = join(d, f);
    if (statSync(p).isDirectory()) walk(p);
    else out.push(relative(root, p).replace(/\\/g, '/'));
  });
  walk(abs);
  return out;
};
const managedFiles = (root) => [...ENGINE_DIRS.flatMap((d) => filesUnder(root, d)), ...ENGINE_FILES, ...SHARED_FILES].filter((f) => existsSync(join(root, f)));

/**
 * Write .beatdeck.json. It records, per file, the hash of beatdeck's own version of it (`pristine`) — not of
 * yours — so a file you edited keeps reading as edited on every later upgrade. Without `pristine` (init, right
 * after the copy) the current files are beatdeck's.
 */
export function writeManifest(root, version, ref, pristine) {
  const files = {};
  for (const f of managedFiles(root)) files[f] = pristine?.[f] ?? sha(readFileSync(join(root, f)));
  writeFileSync(join(root, MANIFEST), JSON.stringify({ beatdeck: version, ref, updated: new Date().toISOString().slice(0, 10), files }, null, 2) + '\n');
}

async function main() {
  const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
  const argv = process.argv.slice(2);
  const arg = (k) => { const i = argv.indexOf(`--${k}`); return i >= 0 ? argv[i + 1] : undefined; };
  const dry = argv.includes('--dry-run');
  const ref = arg('ref') ?? 'main';
  const from = arg('from');

  // the beatdeck repo itself (talks copied before `init` existed also have .claude-plugin/, but their own name)
  const ownName = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).name;
  if (existsSync(join(root, '.claude-plugin')) && ownName === 'beatdeck' && !argv.includes('--force')) {
    console.error('upgrade: this looks like the beatdeck repo itself, not a talk project (package "beatdeck" with');
    console.error('  .claude-plugin/). If it is a talk, rename it in package.json, or pass --force.');
    process.exit(1);
  }

  // 1 · get the new beatdeck
  let src = from ? resolve(from) : null;
  let tmp = null;
  if (!src) {
    tmp = mkdtempSync(join(tmpdir(), 'beatdeck-'));
    src = join(tmp, 'b');
    console.log(`… fetching borjaperfra/beatdeck#${ref}`);
    execSync(`npx -y degit borjaperfra/beatdeck#${ref} "${src}"`, { stdio: 'inherit' });
  }
  if (!existsSync(join(src, 'src/beatdeck'))) { console.error(`upgrade: ${src} is not a beatdeck copy`); process.exit(1); }
  const upPkg = JSON.parse(readFileSync(join(src, 'package.json'), 'utf8'));

  const manifest = existsSync(join(root, MANIFEST)) ? JSON.parse(readFileSync(join(root, MANIFEST), 'utf8')) : null;
  const known = manifest?.files ?? {};
  const edited = (f) => existsSync(join(root, f)) && known[f] !== undefined && known[f] !== sha(readFileSync(join(root, f)));
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const backup = join(root, '.beatdeck-backup', stamp);
  const log = { replaced: [], added: [], removed: [], backedUp: [], newBeside: [], pkg: [] };
  const pristine = {};
  const write = (f, buf) => { if (!dry) { mkdirSync(dirname(join(root, f)), { recursive: true }); writeFileSync(join(root, f), buf); } };
  const keep = (f) => { if (!dry) { mkdirSync(dirname(join(backup, f)), { recursive: true }); copyFileSync(join(root, f), join(backup, f)); } log.backedUp.push(f); };

  // 2 · engine: replace (backing up anything you had edited — or everything, if there is no manifest yet)
  const upEngine = [...ENGINE_DIRS.flatMap((d) => filesUnder(src, d)), ...ENGINE_FILES.filter((f) => existsSync(join(src, f)))];
  const localEngine = [...ENGINE_DIRS.flatMap((d) => filesUnder(root, d)), ...ENGINE_FILES.filter((f) => existsSync(join(root, f)))];
  for (const f of upEngine) {
    const next = readFileSync(join(src, f));
    pristine[f] = sha(next);
    if (!existsSync(join(root, f))) { write(f, next); log.added.push(f); continue; }
    const cur = readFileSync(join(root, f));
    if (sha(cur) === sha(next)) continue;
    if (!manifest || edited(f)) keep(f);
    write(f, next);
    log.replaced.push(f);
  }
  for (const f of localEngine) {
    if (upEngine.includes(f)) continue;
    if (!manifest || edited(f)) keep(f);
    if (!dry) rmSync(join(root, f));
    log.removed.push(f);
  }

  // 3 · shared: replace only if untouched
  for (const [f, from] of SHARED) {
    if (!existsSync(join(src, from))) continue;
    const next = forTalk(f, readFileSync(join(src, from), 'utf8'));
    pristine[f] = sha(Buffer.from(next));
    if (!existsSync(join(root, f))) { write(f, next); log.added.push(f); continue; }
    const cur = readFileSync(join(root, f), 'utf8');
    if (cur === next) continue;
    if (manifest && known[f] === sha(Buffer.from(cur))) { write(f, next); log.replaced.push(f); }
    else { write(`${f}.beatdeck-new`, next); log.newBeside.push(f); }
  }

  // 4 · package.json: engine deps to the new versions, missing scripts added
  const pkgPath = join(root, 'package.json');
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
  for (const field of ['dependencies', 'devDependencies']) {
    pkg[field] ??= {};
    for (const [dep, v] of Object.entries(upPkg[field] ?? {})) {
      const mine = pkg.dependencies?.[dep] ?? pkg.devDependencies?.[dep];
      if (mine === v) continue;
      if (field === 'devDependencies' && pkg.dependencies?.[dep]) pkg.dependencies[dep] = v; else pkg[field][dep] = v;
      log.pkg.push(`${dep} ${mine ?? '(new)'} → ${v}`);
    }
  }
  for (const [k, v] of Object.entries(upPkg.scripts ?? {})) {
    if (REPO_ONLY_SCRIPT(k) || pkg.scripts?.[k]) continue;
    (pkg.scripts ??= {})[k] = v;
    log.pkg.push(`script "${k}" added`);
  }
  if (!dry) writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');

  // 5 · leftovers of the beatdeck repo in talks copied before `init` cleaned them (reported; removed with --clean)
  const read = (f) => { try { return readFileSync(join(root, f), 'utf8'); } catch { return ''; } };
  const leftovers = [
    ['examples/kernel-panic', existsSync(join(root, 'examples/kernel-panic/ASSETS-CREDITS.md'))],
    ['.claude-plugin', existsSync(join(root, '.claude-plugin/marketplace.json')) && read('.claude-plugin/marketplace.json').includes('"beatdeck"')],
    ['.github/workflows/ci.yml', read('.github/workflows/ci.yml').includes('kernel-panic')],
    ['CHANGELOG.md', read('CHANGELOG.md').startsWith('# Changelog\n\nTalk projects update with `npm run upgrade`')],
    ['docs/media', existsSync(join(root, 'docs/media/kernel-panic-architecture.jpg'))],
    ['templates', existsSync(join(root, 'templates/blank/deck'))],
  ].filter(([, is]) => is).map(([f]) => f);
  const clean = argv.includes('--clean');
  if (clean && !dry) for (const f of leftovers) rmSync(join(root, f), { recursive: true, force: true });

  if (!dry) writeManifest(root, upPkg.version, ref, pristine);
  if (tmp) rmSync(tmp, { recursive: true, force: true });

  const n = (a) => a.length;
  console.log(`${dry ? '(dry run) ' : ''}✓ beatdeck ${manifest?.beatdeck ?? '(unknown)'} → ${upPkg.version}`);
  console.log(`  engine: ${n(log.replaced)} updated, ${n(log.added)} added, ${n(log.removed)} removed`);
  if (log.backedUp.length) console.log(`  your previous engine files are in ${relative(root, backup)}/ (${n(log.backedUp)} file(s))`);
  for (const f of log.newBeside) console.log(`  ! ${f} was edited by you: the new version is ${f}.beatdeck-new — merge it by hand`);
  for (const l of log.pkg) console.log(`  package.json: ${l}`);
  if (leftovers.length) {
    console.log(clean && !dry
      ? `  removed beatdeck-repo leftovers: ${leftovers.join(', ')}`
      : `  ! beatdeck-repo leftovers in this talk (the showcase has non-MIT assets; the old CI fails): ${leftovers.join(', ')}\n    run again with --clean to remove them`);
  }
  console.log(dry ? '  nothing written.' : '  next: npm install && npm run build && npm run verify');
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) await main();
