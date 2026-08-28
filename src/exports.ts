import type { Bundle, Student } from './types';

export function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  })[character] ?? character);
}

function safeFileName(value: string): string {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'feedback';
}

export function studentFeedbackHtml(bundle: Bundle, student: Student): string {
  const criteria = bundle.criteria.map((criterion) => {
    const selected = student.feedback[criterion.id] ?? [];
    if (!selected.length) return '';
    return `<section><h2>${escapeHtml(criterion.name)}</h2>${selected.map((item) => `<p>${escapeHtml(item.text)}</p>`).join('')}</section>`;
  }).join('');
  const personal = student.personalNote.trim()
    ? `<section class="personal"><h2>A note just for you</h2><p>${escapeHtml(student.personalNote)}</p></section>`
    : '';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Feedback for ${escapeHtml(student.name || 'student')} — ${escapeHtml(bundle.title)}</title><style>:root{color-scheme:light}*{box-sizing:border-box}body{margin:0;background:#f6f1e7;color:#172b34;font:18px/1.58 Georgia,serif}main{width:min(720px,calc(100% - 32px));margin:32px auto 64px;background:#fffdf7;padding:clamp(24px,6vw,64px);border-top:8px solid #225b6a;box-shadow:0 12px 32px #172b3418}h1{font-size:clamp(32px,6vw,48px);line-height:1.08;margin:0 0 8px}h2{font:700 18px/1.3 system-ui,sans-serif;color:#225b6a;margin:32px 0 8px}p{white-space:pre-wrap}.meta{font:15px/1.4 system-ui,sans-serif;color:#52636a;border-bottom:1px solid #b9cfd2;padding-bottom:24px}.personal{border-left:5px solid #b94535;padding-left:20px}.privacy{font:14px/1.4 system-ui,sans-serif;color:#52636a;margin-top:48px}@media print{body{background:white}main{box-shadow:none;margin:0 auto;padding:16mm}}</style></head><body><main><h1>Writing feedback</h1><p class="meta">${escapeHtml(student.name || 'Student')} · ${escapeHtml(bundle.title)}${bundle.className ? ` · ${escapeHtml(bundle.className)}` : ''}</p>${criteria || '<p>No criterion feedback was selected.</p>'}${personal}<p class="privacy">Prepared by your teacher with Rubric Feedback Bundles. No student work was sent to an AI service.</p></main></body></html>`;
}

export function downloadFile(content: string, name: string, type: string): void {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportStudent(bundle: Bundle, student: Student): void {
  downloadFile(studentFeedbackHtml(bundle, student), `${safeFileName(student.name || 'student')}-feedback.html`, 'text/html');
}

export interface SummaryItem { criterion: string; feedback: string; count: number }

export function misconceptionSummary(bundle: Bundle): SummaryItem[] {
  const counts = new Map<string, { criterionId: string; fragmentId: string; fallbackText: string; count: number }>();
  bundle.students.forEach((student) => {
    Object.entries(student.feedback).forEach(([criterionId, items]) => {
      items.forEach((item) => {
        const key = `${criterionId}::${item.fragmentId}`;
        const current = counts.get(key);
        counts.set(key, {
          criterionId,
          fragmentId: item.fragmentId,
          fallbackText: current?.fallbackText ?? item.text,
          count: (current?.count ?? 0) + 1
        });
      });
    });
  });
  return [...counts.values()].map(({ criterionId, fragmentId, fallbackText, count }) => {
    const criterion = bundle.criteria.find((item) => item.id === criterionId);
    const feedback = criterion?.fragments.find((item) => item.id === fragmentId)?.text ?? fallbackText;
    return { criterion: criterion?.name ?? 'Other', feedback, count };
  }).sort((a, b) => b.count - a.count || a.criterion.localeCompare(b.criterion));
}

export function summaryCsv(bundle: Bundle): string {
  const quote = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`;
  return [['Criterion', 'Feedback pattern', 'Students'], ...misconceptionSummary(bundle).map((item) => [item.criterion, item.feedback, item.count])]
    .map((row) => row.map(quote).join(',')).join('\n');
}
