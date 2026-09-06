import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function createBundle(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.getByLabel('Assignment name').fill('Flash fiction');
  await page.getByLabel('Class or section').fill('Workshop 2');
  await page.getByRole('button', { name: 'Create feedback bundle' }).click();
  await expect(page.getByRole('heading', { name: 'Flash fiction' })).toBeVisible();
}

async function ensureServiceWorkerControl(page: import('@playwright/test').Page) {
  await page.evaluate(() => navigator.serviceWorker.ready);
  if (!await page.evaluate(() => Boolean(navigator.serviceWorker.controller))) await page.reload();
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
}

test('completes and exports specific student feedback', async ({ page }, testInfo) => {
  const consoleErrors: string[] = [];
  const unexpectedRequests: string[] = [];
  const posts: string[] = [];
  const expectedOrigin = new URL(String(testInfo.project.use.baseURL)).origin;
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.protocol.startsWith('http') && url.origin !== expectedOrigin) unexpectedRequests.push(request.url());
    if (request.method() === 'POST') posts.push(request.url());
  });
  await createBundle(page);
  await page.getByLabel('Student name').fill('Avery');
  await page.getByLabel('Submission').fill('The clock in the empty station began moving backward.');
  await page.getByRole('button', { name: 'Download feedback page' }).click();
  await expect(page.getByText(/Select or write at least one rubric fragment before exporting/)).toBeVisible();
  const fragment = page.getByText('Choose one specific detail and explain how it supports your claim.');
  await fragment.click();
  await page.getByLabel('Tailor for Avery').fill('Choose the station clock detail and explain why its backward movement changes the scene.');
  await page.getByRole('button', { name: 'Download feedback page' }).click();
  await expect(page.getByText(/Write one personal note before exporting/)).toBeVisible();
  await page.getByLabel('A note only you could write').fill('The quiet station image stayed with me; your restraint made the strange moment believable.');
  await page.getByLabel('A note only you could write').press('Control+Enter');
  await expect(page.getByText('1 of 1 finished')).toBeVisible();

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download feedback page' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('avery-feedback.html');

  await page.reload();
  await expect(page.getByLabel('Student name')).toHaveValue('Avery');
  await expect(page.getByLabel('A note only you could write')).toHaveValue(/quiet station/);
  await page.getByRole('link', { name: 'Class summary' }).click();
  await expect(page.getByText('Anonymized feedback summary')).toBeVisible();
  await expect(page.getByText('Choose one specific detail and explain how it supports your claim.')).toBeVisible();
  await expect(page.getByText('Choose the station clock detail')).toHaveCount(0);
  expect(consoleErrors).toEqual([]);
  expect(unexpectedRequests).toEqual([]);
  expect(posts).toEqual([]);
});

test('keeps the sample sandbox separate from real classroom data', async ({ page }) => {
  await createBundle(page);
  await page.getByLabel('Student name').fill('Real writer');
  await expect(page.getByLabel('Student name')).toHaveValue('Real writer');

  await page.goto('/demo');
  await expect(page.getByText('Demo — sample data, nothing is saved', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Flash fiction: a turn at the station' })).toBeVisible();
  await page.getByLabel('A note only you could write').fill('A changed demo note.');
  await page.getByRole('button', { name: 'Reset demo' }).click();
  await expect(page.getByLabel('A note only you could write')).toHaveValue(/quiet station image/);

  await page.getByRole('button', { name: 'Start for real' }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('heading', { name: 'Flash fiction' })).toBeVisible();
  await expect(page.getByLabel('Student name')).toHaveValue('Real writer');
});

test('has no serious accessibility violations in welcome and editor states', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Give personal feedback on short writing' })).toBeVisible();
  let results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((item) => ['serious', 'critical'].includes(item.impact ?? ''))).toEqual([]);
  await createBundle(page);
  results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((item) => ['serious', 'critical'].includes(item.impact ?? ''))).toEqual([]);
});

test('respects reduced motion', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const motion = await page.getByRole('button', { name: 'Create feedback bundle' }).evaluate((button) => ({
    reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
    transitionSeconds: Math.max(...getComputedStyle(button).transitionDuration.split(',').map((value) => Number.parseFloat(value)))
  }));
  expect(motion.reduced).toBe(true);
  expect(motion.transitionSeconds).toBeLessThanOrEqual(0.001);
});

test('reloads the grading workspace offline after first visit', async ({ page, context }) => {
  await createBundle(page);
  await ensureServiceWorkerControl(page);
  await expect.poll(() => page.evaluate(async () => {
    const appUrl = [...document.scripts].find((script) => script.type === 'module')?.src ?? '';
    const key = (await caches.keys()).find((item) => item.startsWith('feedback-bundles-')) ?? '';
    const response = await (await caches.open(key)).match(appUrl);
    return response ? (await response.text()).length : 0;
  })).toBeGreaterThan(1000);
  await context.setOffline(true);
  const cachedAppSize = await page.evaluate(async () => {
    const appUrl = [...document.scripts].find((script) => script.type === 'module')?.src ?? '';
    return (await (await fetch(appUrl)).text()).length;
  });
  expect(cachedAppSize).toBeGreaterThan(1000);
  await page.reload();
  await expect(page.getByText('Offline.', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Flash fiction' })).toBeVisible();
  await page.getByLabel('Student name').fill('Offline student');
  await expect(page.getByLabel('Student name')).toHaveValue('Offline student');
});

test('activates an available service-worker update without losing local work', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium');
  await createBundle(page);
  await ensureServiceWorkerControl(page);
  await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.register(`/sw.js?qa-update=${Date.now()}`);
    const worker = registration.installing ?? registration.waiting;
    if (worker && worker.state !== 'installed') {
      await new Promise<void>((resolve) => worker.addEventListener('statechange', () => {
        if (worker.state === 'installed') resolve();
      }));
    }
  });
  await expect(page.getByText('An update is ready')).toBeVisible();
  await page.getByRole('button', { name: 'Update now' }).click();
  await expect(page.getByRole('heading', { name: 'Flash fiction' })).toBeVisible();
  await expect.poll(() => page.evaluate(() => navigator.serviceWorker.controller?.scriptURL.includes('qa-update=') ?? false)).toBe(true);
});

test('mobile layout keeps core actions reachable', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-390');
  await createBundle(page);
  await page.getByLabel('Student name').fill('Mobile writer');
  await page.getByRole('button', { name: 'Add student' }).click();
  await expect(page.getByLabel('Student name')).toBeFocused();
  await expect(page.getByRole('button', { name: 'Download feedback page' })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflow).toBe(false);
});

test('mobile navigation and legal links provide 44px touch targets', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-390');
  await createBundle(page);

  const targets = [
    page.getByRole('link', { name: 'Rubric Feedback Bundles home' }),
    page.getByRole('link', { name: 'Grade', exact: true }),
    page.getByRole('link', { name: 'Class summary' }),
    page.getByRole('link', { name: 'Bundles', exact: true }),
    page.getByRole('link', { name: 'Settings' }),
    page.locator('.site-footer').getByRole('link', { name: 'Privacy' }),
    page.locator('.site-footer').getByRole('link', { name: 'Terms' })
  ];

  for (const target of targets) {
    const box = await target.boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(44);
    expect(box?.height).toBeGreaterThanOrEqual(44);
  }

  await page.getByRole('link', { name: 'Settings' }).click();
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
  for (const target of [
    page.locator('.legal-line').getByRole('link', { name: 'terms' }),
    page.locator('.legal-line').getByRole('link', { name: 'privacy policy' })
  ]) {
    const box = await target.boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(44);
    expect(box?.height).toBeGreaterThanOrEqual(44);
  }
});

test('mobile queue keeps the active student visible with 25 students', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-390');
  test.setTimeout(60_000);
  await createBundle(page);
  for (let index = 2; index <= 25; index += 1) {
    await page.getByRole('button', { name: 'Add student' }).click();
    await page.getByLabel('Student name').fill(`Writer ${index}`);
  }

  const activeTab = page.locator('.student-tab[aria-current="page"]');
  await expect(activeTab).toContainText('Writer 25');
  await expect.poll(() => activeTab.evaluate((tab) => {
    const queue = tab.parentElement!;
    const tabBox = tab.getBoundingClientRect();
    const queueBox = queue.getBoundingClientRect();
    return tabBox.left >= queueBox.left && tabBox.right <= queueBox.right;
  })).toBe(true);
  await expect.poll(() => page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth
  }))).toEqual({ clientWidth: 390, scrollWidth: 390 });
});

test('blank custom fragment reports an error and keeps touch actions accessible', async ({ page }) => {
  await createBundle(page);
  await page.getByRole('button', { name: 'Write a fragment' }).first().click();
  const editor = page.getByLabel('New reusable fragment');
  await editor.fill('   ');
  await page.getByRole('button', { name: 'Save and select' }).press('Enter');

  await expect(page.locator('[role="alert"]', { hasText: 'Write a reusable fragment before saving.' })).toBeVisible();
  await expect(editor).toBeFocused();
  await expect(editor).toHaveAttribute('aria-invalid', 'true');
  for (const name of ['Save and select', 'Cancel']) {
    const box = await page.getByRole('button', { name }).boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);
  }

  await editor.fill('Name the precise image that makes the ending resonate.');
  await page.getByRole('button', { name: 'Save and select' }).click();
  await expect(page.getByText('Fragment saved to this bundle and selected.')).toBeVisible();
  await expect(page.getByLabel('Tailor for this student', { exact: true })).toHaveValue('Name the precise image that makes the ending resonate.');
});

test('restores a one-time Plus license without blocking the free experience', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium');
  await page.route('https://api.sociobot.in/api/v1/products/rubric-feedback-bundles/verify?license=test-license', (route) => route.fulfill({ json: { valid: true, reason: 'ok', expires_at: null } }));
  await page.goto('/?license=test-license#settings');
  await expect(page).not.toHaveURL(/license=/);
  await expect(page.getByText('Plus is unlocked')).toBeVisible();
  await expect(page.getByText('License active on this device')).toBeVisible();
});

test('uses the registered Sociobot checkout contract', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium');
  await page.goto('/#settings');
  await expect(page.getByRole('link', { name: 'Buy Plus securely' })).toHaveAttribute(
    'href',
    'https://api.sociobot.in/api/v1/products/rubric-feedback-bundles/checkout'
  );
});

test('legal pages are semantic and accessible', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium');
  for (const path of ['/privacy/', '/terms/']) {
    await page.goto(path);
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('h1')).toHaveCount(1);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.filter((item) => ['serious', 'critical'].includes(item.impact ?? ''))).toEqual([]);
  }
});
