#!/usr/bin/env node
// Turns a fresh copy of the beatdeck repo into a clean talk project. Run once, right after degit:
//
//   npx degit borjaperfra/beatdeck my-talk && cd my-talk
//   npm run init -- --title "My talk" --author "Ada Lovelace" --lang en --theme light
//
// Removes what belongs to the beatdeck repo, not to a talk (the Kernel Panic showcase and its non-MIT assets,
// the plugin marketplace files, beatdeck's README and screenshots, the example scripts), renames the package,
// and writes title / author / lang / theme into the deck. The demo deck in deck/ stays as a working starting
// point. Deletes itself when done. All flags are optional.
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const p = (f) => resolve(root, f);
const argv = process.argv.slice(2);
const arg = (k, d) => {
  const i = argv.indexOf(`--${k}`);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : d;
};
const slug = (s) => s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'my-talk';

if (!existsSync(p('src/beatdeck')) || !existsSync(p('deck'))) {
  console.error('init: run this from the root of a beatdeck copy (src/beatdeck and deck/ must exist).');
  process.exit(1);
}
if (existsSync(p('.git')) && existsSync(p('.claude-plugin'))) {
  console.error('init: this looks like the beatdeck repo itself (it has .git and .claude-plugin). Refusing to strip it.');
  process.exit(1);
}

const title = arg('title', null);
const author = arg('author', null);
const lang = arg('lang', null);
const theme = arg('theme', 'neutral');
const name = slug(arg('name', title ?? basename(root)));
const esc = (s) => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
const edit = (f, fn) => { if (existsSync(p(f))) writeFileSync(p(f), fn(readFileSync(p(f), 'utf8'))); };

// 1 · what belongs to the beatdeck repo, not to a talk
for (const f of ['examples', '.claude-plugin', 'docs/media', 'README.md']) rmSync(p(f), { recursive: true, force: true });

// 2 · package.json: own name, no example scripts, no init
const pkg = JSON.parse(readFileSync(p('package.json'), 'utf8'));
pkg.name = name;
pkg.version = '0.1.0';
pkg.description = title ?? 'A talk built with beatdeck';
delete pkg.repository;
delete pkg.license;
if (author) pkg.author = author; else delete pkg.author;
for (const k of Object.keys(pkg.scripts)) if (k.includes('kernel-panic') || k === 'init') delete pkg.scripts[k];
writeFileSync(p('package.json'), JSON.stringify(pkg, null, 2) + '\n');
edit('package-lock.json', (s) => s.replace(/("name":\s*)"beatdeck"/g, `$1"${name}"`));

// 3 · tsconfig / licence / agent guide: no references to the showcase
edit('tsconfig.json', (s) => s.replace(/,\s*"examples"/, ''));
edit('LICENSE', (s) => s.replace(/\n\nThe MIT license covers[\s\S]*$/, '\n'));
edit('AGENTS.md', (s) => s.replace(/^\| `examples\/kernel-panic\/`.*\n/m, '').replace(/^npm run example:kernel-panic\n/m, ''));

// 4 · the deck: title, author, lang, id, theme
if (title) edit('deck/deck.config.ts', (s) => s.replace(/title: '[^']*'/, `title: '${esc(title)}'`));
if (author) edit('deck/deck.config.ts', (s) => s.replace(/author: '[^']*'/, `author: '${esc(author)}'`));
edit('deck/index.tsx', (s) => {
  s = s.replace(/id: '[^']*'/, `id: '${name}'`);
  if (lang) s = s.replace(/lang: '[^']*'/, `lang: '${esc(lang)}'`);
  if (theme === 'light' && !s.includes('light.css')) s = s.replace("import '../themes/neutral.css';", "import '../themes/neutral.css';\nimport '../themes/light.css';");
  return s;
});
edit('index.html', (s) => {
  if (title) s = s.replace(/<title>[^<]*<\/title>/, `<title>${title.replace(/</g, '&lt;')}</title>`);
  if (lang) s = s.replace(/<html lang="[^"]*">/, `<html lang="${lang}">`);
  if (theme === 'light') s = s.replace('content="dark"', 'content="light"');
  return s;
});

// 5 · a README for the talk
writeFileSync(p('README.md'), `# ${title ?? name}

${author ? `${author} · ` : ''}built with [beatdeck](https://github.com/borjaperfra/beatdeck).

\`\`\`bash
npm install
npm run dev          # http://127.0.0.1:5173/#1.1
npm run present      # production build, opened locally (works offline)
npm run verify       # every beat checked → artifacts/verify/
\`\`\`

The talk lives in \`deck/\`. See \`AGENTS.md\` and \`skills/building-a-beatdeck/SKILL.md\`.
`);

rmSync(p('scripts/init.mjs'), { force: true });
console.log(`✓ ${name}: clean talk project${title ? ` "${title}"` : ''}${theme === 'light' ? ', light theme' : ''}. Next: npm install && npm run dev`);
