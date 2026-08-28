import { describe, expect, it } from 'vitest';
import { createBundle, STARTER_CRITERIA } from './types';

describe('bundle creation', () => {
  it('starts with a student and an editable writing rubric', () => {
    const bundle = createBundle('  Personal narrative  ', '  7B  ');
    expect(bundle.title).toBe('Personal narrative');
    expect(bundle.className).toBe('7B');
    expect(bundle.students).toHaveLength(1);
    expect(bundle.criteria).toHaveLength(4);
    expect(bundle.criteria[0].fragments.length).toBeGreaterThan(1);
  });

  it('does not mutate the shared starter criteria', () => {
    const one = createBundle('One', '');
    one.criteria[0].fragments[0].text = 'Changed';
    const two = createBundle('Two', '');
    expect(two.criteria[0].fragments[0].text).toBe(STARTER_CRITERIA[0].fragments[0].text);
  });
});
