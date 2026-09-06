import assert from 'node:assert/strict';

const origin = (process.env.PRODUCT_ORIGIN ?? 'https://rubric-feedback-bundles.sociobot.in').replace(/\/$/, '');
const billing = 'https://api.sociobot.in/api/v1/products/rubric-feedback-bundles/checkout';

async function response(path, init) {
  const result = await fetch(`${origin}${path}`, init);
  assert.equal(result.status, 200, `${path} returned ${result.status}`);
  return result;
}

const root = await response('/');
const html = await root.text();
assert.match(html, /<title>Rubric Feedback Bundles — Writing feedback for teachers<\/title>/);
assert.match(html, /<html lang="en">/);
assert.match(html, /<link rel="canonical" href="https:\/\/rubric-feedback-bundles\.sociobot\.in\/"/);
assert.match(html, /property="og:image" content="https:\/\/rubric-feedback-bundles\.sociobot\.in\/assets\/feedback-bundles-social\.jpg"/);
assert.match(html, /name="twitter:card" content="summary_large_image"/);
assert.match(html, /rel="apple-touch-icon" href="\/icons\/apple-touch-icon\.png"/);

const csp = root.headers.get('content-security-policy') ?? '';
assert.match(csp, /default-src 'self'/);
assert.match(csp, /connect-src 'self' https:\/\/api\.sociobot\.in/);
assert.match(csp, /frame-ancestors 'none'/);
assert.match(root.headers.get('permissions-policy') ?? '', /camera=\(\)/);

for (const path of ['/privacy/', '/terms/']) {
  const legal = await response(path);
  const legalHtml = await legal.text();
  assert.match(legalHtml, /rel="canonical" href="https:\/\/rubric-feedback-bundles\.sociobot\.in\/(privacy|terms)\/"/);
  assert.match(legalHtml, /property="og:image"/);
  assert.match(legalHtml, /name="twitter:card" content="summary_large_image"/);
}

const demo = await response('/demo');
assert.match(await demo.text(), /id="app"/);

const notFound = await fetch(`${origin}/this-route-does-not-exist`);
assert.equal(notFound.status, 404, 'unknown route must return HTTP 404');
const notFoundHtml = await notFound.text();
assert.match(notFoundHtml, /<title>Page not found — Rubric Feedback Bundles<\/title>/);
assert.match(notFoundHtml, /<h1>Page not found<\/h1>/);

const assetPath = html.match(/<script[^>]+src="([^"]*\/assets\/app-[^"]+\.js)"/)?.[1];
assert.ok(assetPath, 'could not find the hashed application asset');
const asset = await response(assetPath, { method: 'HEAD' });
assert.equal(asset.headers.get('cache-control'), 'public, max-age=31536000, immutable');

const font = await response('/fonts/inter-latin-wght-normal.woff2', { method: 'HEAD' });
assert.equal(font.headers.get('cache-control'), 'public, max-age=31536000, immutable');
const worker = await response('/sw.js', { method: 'HEAD' });
assert.match(worker.headers.get('cache-control') ?? '', /no-cache/);
const manifest = await response('/manifest.webmanifest', { method: 'HEAD' });
assert.equal(manifest.headers.get('content-type'), 'application/manifest+json');

const checkout = await fetch(billing, { redirect: 'manual' });
assert.ok([302, 303, 307, 308].includes(checkout.status), `checkout returned ${checkout.status}`);
const location = checkout.headers.get('location');
assert.ok(location, 'checkout response had no redirect location');
assert.equal(new URL(location).hostname, 'checkout.dodopayments.com');

console.log(`PASS ${origin}`);
console.log(`identity, legal pages, response policy, immutable assets, and hosted checkout verified`);
