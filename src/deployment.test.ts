import { describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';

interface RouteConfig {
  route: string;
  headers?: Record<string, string>;
}

interface StaticWebAppConfig {
  routes: RouteConfig[];
  globalHeaders: Record<string, string>;
}

async function deploymentConfig(): Promise<StaticWebAppConfig> {
  return JSON.parse(await readFile(new URL('../public/staticwebapp.config.json', import.meta.url), 'utf8')) as StaticWebAppConfig;
}

describe('production response policy', () => {
  it('serves versioned assets and fonts with immutable caching', async () => {
    const config = await deploymentConfig();
    for (const route of ['/assets/*', '/fonts/*']) {
      expect(config.routes.find((item) => item.route === route)?.headers?.['Cache-Control'])
        .toBe('public, max-age=31536000, immutable');
    }
    expect(config.routes.find((item) => item.route === '/sw.js')?.headers?.['Cache-Control']).toBe('no-cache');
  });

  it('contains local classroom data with browser security headers', async () => {
    const { globalHeaders } = await deploymentConfig();
    expect(globalHeaders['Content-Security-Policy']).toContain("default-src 'self'");
    expect(globalHeaders['Content-Security-Policy']).toContain('https://api.sociobot.in');
    expect(globalHeaders['Content-Security-Policy']).toContain("frame-ancestors 'none'");
    expect(globalHeaders['Permissions-Policy']).toContain('camera=()');
    expect(globalHeaders['X-Content-Type-Options']).toBe('nosniff');
  });
});
