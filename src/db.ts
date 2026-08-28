import Dexie, { type EntityTable } from 'dexie';
import type { Bundle, Criterion, HistoryEvent, Student } from './types';

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isCriterion(value: unknown): value is Criterion {
  if (!isRecord(value) || typeof value.id !== 'string' || typeof value.name !== 'string' ||
    typeof value.prompt !== 'string' || !Array.isArray(value.fragments)) return false;
  return value.fragments.every((fragment) => isRecord(fragment) &&
    typeof fragment.id === 'string' && typeof fragment.text === 'string');
}

function isStudent(value: unknown): value is Student {
  if (!isRecord(value) || typeof value.id !== 'string' || typeof value.name !== 'string' ||
    typeof value.submission !== 'string' || typeof value.personalNote !== 'string' ||
    typeof value.completed !== 'boolean' || typeof value.updatedAt !== 'string' || !isRecord(value.feedback)) return false;
  return Object.values(value.feedback).every((items) => Array.isArray(items) && items.every((item) =>
    isRecord(item) && typeof item.fragmentId === 'string' && typeof item.text === 'string'));
}

function isHistoryEvent(value: unknown): value is HistoryEvent {
  return isRecord(value) && typeof value.id === 'string' && typeof value.at === 'string' && typeof value.label === 'string';
}

function isBundle(value: unknown): value is Bundle {
  if (!isRecord(value)) return false;
  return typeof value.id === 'string' && typeof value.title === 'string' && typeof value.className === 'string' &&
    typeof value.createdAt === 'string' && typeof value.updatedAt === 'string' &&
    Array.isArray(value.criteria) && value.criteria.length > 0 && value.criteria.every(isCriterion) &&
    Array.isArray(value.students) && value.students.length > 0 && value.students.every(isStudent) &&
    Array.isArray(value.history) && value.history.every(isHistoryEvent);
}

export async function importBackup(raw: string): Promise<number> {
  const parsed: unknown = JSON.parse(raw);
  if (!parsed || typeof parsed !== 'object' || !Array.isArray((parsed as { bundles?: unknown }).bundles)) {
    throw new Error('This file is not a Rubric Feedback Bundles backup.');
  }
  const bundles = (parsed as { bundles: unknown[] }).bundles;
  if (!bundles.length || !bundles.every(isBundle)) {
    throw new Error('The backup contains incomplete or invalid bundle data. Nothing was imported.');
  }
  await db.bundles.bulkPut(bundles);
  return bundles.length;
}
