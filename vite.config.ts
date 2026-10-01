import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

const root = (p: string) => fileURLToPath(new URL(p, import.meta.url));

/**
 * The deck lives in `deck/`. `--mode <name>` builds `examples/<name>/` instead (e.g. `--mode kernel-panic`),
 * into `dist-<name>/`. `beatdeck` resolves to the engine in `src/beatdeck/`.
 */
export default defineConfig(({ mode }) => {
  const example = mode === 'development' || mode === 'production' ? null : mode;
  const deckDir = example ? `examples/${example}` : 'deck';
  return {
    base: './',
    plugins: [react()],
    resolve: {
      alias: {
        beatdeck: root('./src/beatdeck/index.ts'),
        '@deck': root(`./${deckDir}/index.tsx`),
      },
    },
    build: {
      outDir: example ? `dist-${example}` : 'dist',
      target: 'es2022',
      assetsInlineLimit: 0,
      chunkSizeWarningLimit: 900,
    },
    server: { host: '127.0.0.1', port: 5173 },
    preview: { host: '127.0.0.1' },
  };
});
