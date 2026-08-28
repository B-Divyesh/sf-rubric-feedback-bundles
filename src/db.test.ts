import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it } from 'vitest';
import { db, importBackup, listBundles } from './db';
import { createBundle } from './types';

afterEach(async () => {
  await db.bundles.clear();
});

describe('backup import', () => {
  it('imports a complete local backup', async () => {
    const bundle = createBundle('Quickwrite', '8A');
    const count = await importBackup(JSON.stringify({ version: 1, bundles: [bundle] }));

    expect(count).toBe(1);
    expect((await listBundles())[0].title).toBe('Quickwrite');
  });

  it('rejects malformed nested data without writing any bundles', async () => {
    const bundle = createBundle('Damaged', '');
    const malformed = { ...bundle, students: [{ id: 'student-only' }] };

    await expect(importBackup(JSON.stringify({ version: 1, bundles: [malformed] })))
      .rejects.toThrow('incomplete or invalid');
    expect(await listBundles()).toEqual([]);
  });
});
