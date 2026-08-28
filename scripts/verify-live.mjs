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
assert.match(html, /<title>Rubric Feedback Bundles/);
assert.match(html, /<html lang="en">/);

const csp = root.headers.get('content-security-policy') ?? '';
assert.match(csp, /default-src 'self'/);
assert.match(csp, /connect-src 'self' https:\/\/api\.sociobot\.in/);
assert.match(csp, /frame-ancestors 'none'/);
assert.match(root.headers.get('permissions-policy') ?? '', /camera=\(\)/);

await response('/privacy/');
await response('/terms/');

const assetPath = html.match(/<script[^>]+src="([^"]*\/assets\/app-[^"]+\.js)"/)?.[1];
assert.ok(assetPath, 'could not find the hashed application asset');
const asset = await response(assetPath, { method: 'HEAD' });
assert.equal(asset.headers.get('cache-control'), 'public, max-age=31536000, immutable');

const font = await response('/fonts/inter-latin-wght-normal.woff2', { method: 'HEAD' });
assert.equal(font.headers.get('cache-control'), 'public, max-age=31536000, immutable');
const worker = await response('/sw.js', { method: 'HEAD' });
assert.match(worker.headers.get('cache-control') ?? '', /no-cache/);

const checkout = await fetch(billing, { redirect: 'manual' });
assert.ok([302, 303, 307, 308].includes(checkout.status), `checkout returned ${checkout.status}`);
const location = checkout.headers.get('location');
assert.ok(location, 'checkout response had no redirect location');
assert.equal(new URL(location).hostname, 'checkout.dodopayments.com');

console.log(`PASS ${origin}`);
console.log(`identity, legal pages, response policy, immutable assets, and hosted checkout verified`);
