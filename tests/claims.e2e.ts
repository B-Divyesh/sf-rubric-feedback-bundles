import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const billingOrigin = 'https://api.sociobot.in';
const verifyPath = '/api/v1/products/rubric-feedback-bundles/verify?license=demo-license';

test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'Claim checks run once in a fresh desktop demo context.');
});

async function openDemo(page: import('@playwright/test').Page) {
  await page.goto('/demo');
  await expect(page.getByText('Demo — sample data, nothing is saved', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Flash fiction: a turn at the station' })).toBeVisible();
}

async function waitForServiceWorker(page: import('@playwright/test').Page) {
  await page.evaluate(() => navigator.serviceWorker.ready);
  if (!await page.evaluate(() => Boolean(navigator.serviceWorker.controller))) await page.reload();
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
}

test('@claim:feedback-bundle selects reusable feedback and keeps a personal note', async ({ page }) => {
  await openDemo(page);
  const tailored = page.getByLabel('Tailor for Avery Chen').first();
  await expect(tailored).toHaveValue(/station clock detail/);
  await expect(page.getByLabel('A note only you could write')).toHaveValue(/quiet station image/);
  await tailored.fill('Explain why the backward station clock changes the scene.');
  await expect(tailored).toHaveValue('Explain why the backward station clock changes the scene.');
});

test('@claim:student-page-export downloads a readable student feedback page', async ({ page }) => {
  await openDemo(page);
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download feedback page' }).click();
  const download = await downloadPromise;
  const html = await readFile((await download.path())!, 'utf8');
  expect(download.suggestedFilename()).toBe('avery-chen-feedback.html');
  expect(html).toContain('<main>');
  expect(html).toContain('A note just for you');
  expect(html).toContain('quiet station image');
});

test('@claim:local-browser-storage keeps demo changes in its isolated browser database', async ({ page }) => {
  await openDemo(page);
  const note = 'The patient pacing makes the final image land.';
  await page.getByLabel('A note only you could write').fill(note);
  await page.reload();
  await expect(page.getByLabel('A note only you could write')).toHaveValue(note);
  const names = await page.evaluate(async () => (await indexedDB.databases()).map((item) => item.name));
  expect(names).toContain('demo:rubric-feedback-bundles');
  expect(names).not.toContain('rubric-feedback-bundles');
});

test('@claim:no-account-required completes feedback without an account or sign-in', async ({ page }) => {
  await openDemo(page);
  await page.getByRole('button', { name: 'Finished', exact: true }).click();
  await expect(page.getByText('Feedback for Avery Chen is ready to export.')).toBeVisible();
  expect(await page.context().cookies()).toEqual([]);
});

test('@claim:no-ai-access keeps student writing out of network requests', async ({ page }, testInfo) => {
  const requests: { url: string; method: string }[] = [];
  const origin = new URL(String(testInfo.project.use.baseURL)).origin;
  page.on('request', (request) => requests.push({ url: request.url(), method: request.method() }));
  await openDemo(page);
  await page.getByLabel('Submission').fill('A private classroom sentence that must stay in this browser.');
  await page.getByRole('button', { name: 'Download feedback page' }).click();
  await expect(page.getByText('Downloaded Avery Chen’s private feedback page.')).toBeVisible();
  expect(requests.filter((item) => item.url.startsWith('http')).every((item) => new URL(item.url).origin === origin)).toBe(true);
  expect(requests.some((item) => item.method === 'POST')).toBe(false);
});

test('@claim:anonymized-summary shows feedback patterns without student writing or names', async ({ page }) => {
  await openDemo(page);
  await page.getByRole('link', { name: 'Class summary' }).click();
  await expect(page.getByRole('heading', { name: 'Anonymized feedback summary' })).toBeVisible();
  await expect(page.getByText('Choose one specific detail and explain how it supports your claim.')).toBeVisible();
  await expect(page.getByText('Avery Chen', { exact: true })).toHaveCount(0);
  await expect(page.getByText('quiet station image', { exact: false })).toHaveCount(0);
  await expect(page.getByText('The station clock in the empty station', { exact: false })).toHaveCount(0);
});

test('@claim:backup-import exports a complete JSON backup and accepts it again', async ({ page }) => {
  await openDemo(page);
  await page.getByRole('link', { name: 'Settings' }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download JSON backup' }).click();
  const download = await downloadPromise;
  const content = await readFile((await download.path())!, 'utf8');
  const backup = JSON.parse(content) as { bundles: Array<{ title: string; students: unknown[] }> };
  expect(backup.bundles[0]).toMatchObject({ title: 'Flash fiction: a turn at the station' });
  expect(backup.bundles[0].students).toHaveLength(3);
  await page.getByLabel('Import a backup').setInputFiles({ name: 'demo-backup.json', mimeType: 'application/json', buffer: Buffer.from(content) });
  await expect(page.getByText('Imported 1 bundle.')).toBeVisible();
});

test('@claim:pwa-install has an installable app shell after the first visit', async ({ page }) => {
  await openDemo(page);
  await waitForServiceWorker(page);
  const manifest = await page.evaluate(async () => {
    const response = await fetch('/manifest.webmanifest');
    return { type: response.headers.get('content-type'), value: await response.json() };
  });
  expect(manifest.type).toContain('application/manifest+json');
  expect(manifest.value).toMatchObject({ display: 'standalone', start_url: '/?source=installed&v=2' });
  expect(manifest.value.icons.some((icon: { sizes: string }) => icon.sizes === '192x192')).toBe(true);
  expect(manifest.value.icons.some((icon: { sizes: string }) => icon.sizes === '512x512')).toBe(true);
});

test('@claim:offline-reload reloads the sample workspace without a connection', async ({ browser, baseURL }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  try {
    await page.goto(`${baseURL}/demo`);
    await expect(page.getByText('Demo — sample data, nothing is saved', { exact: true })).toBeVisible();
    await waitForServiceWorker(page);
    await context.setOffline(true);
    await page.reload();
    await expect(page.getByText('Offline.', { exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Flash fiction: a turn at the station' })).toBeVisible();
  } finally {
    await context.close();
  }
});

test('@claim:plus-price shows the one-time Plus price and checkout route', async ({ page }) => {
  await openDemo(page);
  await page.getByRole('link', { name: 'Settings' }).click();
  await expect(page.getByText('$24 one-time.', { exact: true })).toBeVisible();
  const href = await page.getByRole('link', { name: 'Buy Plus securely' }).getAttribute('href');
  const response = await page.context().request.get(href!, { maxRedirects: 0 });
  expect([302, 303, 307, 308]).toContain(response.status());
  expect(new URL(response.headers().location!).hostname).toBe('checkout.dodopayments.com');
});

test('@claim:plus-unlimited-csv unlocks another bundle and CSV with a verified license', async ({ page }) => {
  await page.route(`${billingOrigin}${verifyPath}`, (route) => route.fulfill({ json: { valid: true, reason: 'ok', expires_at: null } }));
  await page.goto('/demo?license=demo-license#settings');
  await expect(page.getByText('Plus is unlocked')).toBeVisible();
  await page.getByRole('link', { name: 'Bundles', exact: true }).click();
  await page.getByLabel('Assignment name').fill('A second quickwrite');
  await page.getByRole('button', { name: 'Create bundle' }).click();
  await expect(page.getByRole('heading', { name: 'A second quickwrite' })).toBeVisible();
  await page.getByLabel('Student name').fill('Jordan Lee');
  await page.getByText('Your central idea is clear and sustained.').click();
  await page.getByLabel('A note only you could write').fill('Your opening makes the topic easy to enter.');
  await page.getByRole('link', { name: 'Class summary' }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export CSV' }).click();
  const download = await downloadPromise;
  expect(await download.suggestedFilename()).toBe('a-second-quickwrite-summary.csv');
});

test('@claim:sociobot-billing sends checkout to the registered Sociobot billing service', async ({ page }) => {
  await openDemo(page);
  await page.getByRole('link', { name: 'Settings' }).click();
  const href = await page.getByRole('link', { name: 'Buy Plus securely' }).getAttribute('href');
  expect(new URL(href!).origin).toBe(billingOrigin);
  expect(new URL(href!).pathname).toBe('/api/v1/products/rubric-feedback-bundles/checkout');
});

test('@claim:free-one-bundle keeps one complete feedback bundle available without a license', async ({ page }) => {
  await openDemo(page);
  await page.getByRole('link', { name: 'Bundles', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Keep unlimited bundles' })).toBeVisible();
  await expect(page.getByText('The free edition keeps one complete bundle.')).toBeVisible();
  await expect(page.getByLabel('Assignment name')).toHaveCount(0);
});

test('@claim:core-not-gated lets free teachers export feedback pages and backups', async ({ page }) => {
  await openDemo(page);
  const feedbackDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download feedback page' }).click();
  expect((await feedbackDownload).suggestedFilename()).toBe('avery-chen-feedback.html');
  await page.getByRole('link', { name: 'Settings' }).click();
  const backupDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download JSON backup' }).click();
  expect((await backupDownload).suggestedFilename()).toMatch(/^rubric-feedback-backup-.*\.json$/);
});

test('@claim:no-tracking-or-sync sends no third-party or write requests during the demo flow', async ({ page }, testInfo) => {
  const requests: { url: string; method: string }[] = [];
  const origin = new URL(String(testInfo.project.use.baseURL)).origin;
  page.on('request', (request) => requests.push({ url: request.url(), method: request.method() }));
  await openDemo(page);
  await page.getByLabel('Student name').fill('Avery Chen');
  await page.getByRole('link', { name: 'Class summary' }).click();
  await page.getByRole('link', { name: 'Settings' }).click();
  expect(requests.filter((item) => item.url.startsWith('http')).every((item) => new URL(item.url).origin === origin)).toBe(true);
  expect(requests.some((item) => item.method === 'POST' || item.method === 'PUT')).toBe(false);
});

test('@claim:license-token-only sends only the license token to verification', async ({ page }) => {
  let verificationUrl = '';
  await page.route(`${billingOrigin}${verifyPath}`, (route) => {
    verificationUrl = route.request().url();
    return route.fulfill({ json: { valid: false, reason: 'revoked', expires_at: null } });
  });
  await page.goto('/demo?license=demo-license');
  await page.getByRole('link', { name: 'Settings' }).click();
  await expect(page.getByText('License no longer active.')).toBeVisible();
  const url = new URL(verificationUrl);
  expect(url.origin).toBe(billingOrigin);
  expect(url.pathname).toBe('/api/v1/products/rubric-feedback-bundles/verify');
  expect([...url.searchParams.entries()]).toEqual([['license', 'demo-license']]);
  const stored = await page.evaluate(() => ({ real: localStorage.getItem('sb_license:rubric-feedback-bundles'), demo: sessionStorage.getItem('sb_license:rubric-feedback-bundles') }));
  expect(stored).toEqual({ real: null, demo: 'demo-license' });
});
