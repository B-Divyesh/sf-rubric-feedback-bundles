import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { resolve, relative } from 'node:path';

async function walk(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const path = resolve(directory, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  }));
  return nested.flat();
}

function serviceWorkerPlugin() {
  return {
    name: 'feedback-bundles-service-worker',
    apply: 'build' as const,
    async closeBundle() {
      const dist = resolve(import.meta.dirname, 'dist');
      const files = (await walk(dist))
        .map((file) => `/${relative(dist, file).replaceAll('\\\\', '/')}`)
        .filter((file) => !file.endsWith('/sw.js') && !file.includes('feedback-geometry-1280'));
      const template = await readFile(resolve(import.meta.dirname, 'src/sw-template.js'), 'utf8');
      await writeFile(resolve(dist, 'sw.js'), template.replace('__PRECACHE__', JSON.stringify(files)));
    }
  };
}

export default defineConfig({
  plugins: [preact(), serviceWorkerPlugin()],
  build: {
    target: 'es2022',
    cssCodeSplit: true,
    rollupOptions: {
      input: {
        app: resolve(import.meta.dirname, 'index.html'),
        privacy: resolve(import.meta.dirname, 'privacy/index.html'),
        terms: resolve(import.meta.dirname, 'terms/index.html')
      }
    }
  }
});
