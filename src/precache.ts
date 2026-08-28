export function shouldPrecache(path: string): boolean {
  return path !== '/staticwebapp.config.json'
    && !path.endsWith('/sw.js')
    && !path.includes('feedback-geometry-1280');
}
