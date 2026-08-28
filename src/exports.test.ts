import { describe, expect, it } from 'vitest';
import { escapeHtml, misconceptionSummary, studentFeedbackHtml, summaryCsv } from './exports';
import { createBundle } from './types';

describe('feedback exports', () => {
  it('escapes student-authored content in standalone HTML', () => {
    const bundle = createBundle('Argument <script>', 'Period 2');
    const student = bundle.students[0];
    student.name = 'Avery & Co.';
    student.personalNote = '<img src=x onerror=alert(1)>';
    student.feedback.ideas = [{ fragmentId: 'ideas-focus', text: 'Clear & specific.' }];
    const html = studentFeedbackHtml(bundle, student);

    expect(html).toContain('Avery &amp; Co.');
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
    expect(html).not.toContain('<script>');
    expect(html).toContain('<main>');
    expect(html).toContain('lang="en"');
  });

  it('creates an anonymized class summary', () => {
    const bundle = createBundle('Flash fiction', 'Workshop');
    const first = bundle.students[0];
    first.name = 'Named student';
    first.feedback.ideas = [{ fragmentId: 'ideas-depth', text: 'Explain why the final image matters to this claim.' }];
    const second = structuredClone(first);
    second.id = 'second';
    second.name = 'Another student';
    second.feedback.ideas[0].text = 'Explain why the repeated door image matters.';
    bundle.students.push(second);

    expect(misconceptionSummary(bundle)[0]).toMatchObject({ criterion: 'Ideas & evidence', count: 2 });
    const csv = summaryCsv(bundle);
    expect(csv).toContain('Push this idea one step further by explaining why it matters.');
    expect(csv).not.toContain('final image');
    expect(csv).not.toContain('door image');
    expect(csv).not.toContain('Named student');
    expect(csv).not.toContain('Another student');
  });

  it('escapes all HTML-sensitive characters', () => {
    expect(escapeHtml(`<>&'"`)).toBe('&lt;&gt;&amp;&#39;&quot;');
  });
});
