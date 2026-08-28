import Dexie, { type EntityTable } from 'dexie';
import type { Bundle } from './types';

class FeedbackDatabase extends Dexie {
  bundles!: EntityTable<Bundle, 'id'>;

  constructor() {
    super('rubric-feedback-bundles');
    this.version(1).stores({ bundles: 'id, updatedAt, title' });
  }
}

export const db = new FeedbackDatabase();

export async function listBundles(): Promise<Bundle[]> {
  return db.bundles.orderBy('updatedAt').reverse().toArray();
}

export async function saveBundle(bundle: Bundle): Promise<void> {
  await db.bundles.put({ ...bundle, updatedAt: new Date().toISOString() });
}

export async function deleteBundle(id: string): Promise<void> {
  await db.bundles.delete(id);
}

export async function exportBackup(): Promise<string> {
  return JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), bundles: await listBundles() }, null, 2);
}

function isBundle(value: unknown): value is Bundle {
  if (!value || typeof value !== 'object') return false;
  const bundle = value as Partial<Bundle>;
  return typeof bundle.id === 'string' && typeof bundle.title === 'string' &&
    Array.isArray(bundle.criteria) && Array.isArray(bundle.students);
}

export async function importBackup(raw: string): Promise<number> {
  const parsed: unknown = JSON.parse(raw);
  if (!parsed || typeof parsed !== 'object' || !Array.isArray((parsed as { bundles?: unknown }).bundles)) {
    throw new Error('This file is not a Rubric Feedback Bundles backup.');
  }
  const bundles = (parsed as { bundles: unknown[] }).bundles;
  if (!bundles.length || !bundles.every(isBundle)) {
    throw new Error('The backup does not contain any valid bundles.');
  }
  await db.bundles.bulkPut(bundles);
  return bundles.length;
}
