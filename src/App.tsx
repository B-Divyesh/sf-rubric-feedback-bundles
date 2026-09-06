import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import type { JSX } from 'preact';
import { clearDemoBundles, db, demoDb, deleteBundle, exportBackup, importBackup, listBundles, saveBundle } from './db';
import { downloadFile, exportStudent, misconceptionSummary, studentFeedbackHtml, summaryCsv } from './exports';
import { cachedUnlock, captureReturnedLicense, checkoutUrl, storeLicense, storedLicense, verifyLicense, type LicenseState } from './license';
import { createBundle, createDemoBundle, createStudent, newId, type Bundle, type Fragment, type Student } from './types';

type View = 'grade' | 'summary' | 'bundles' | 'settings';
type SaveState = 'saved' | 'saving' | 'error';

function isDemoLocation(): boolean {
  const url = new URL(location.href);
  return url.pathname.replace(/\/$/, '') === '/demo' || url.searchParams.get('demo') === '1';
}

function Mark({ small = false }: { small?: boolean }) {
  return <svg className={small ? 'mark mark--small' : 'mark'} viewBox="0 0 48 48" aria-hidden="true">
    <path className="mark__paper" d="M6 4h36v40H6z" />
    <path className="mark__rule" d="M13 14h22M13 21h22M13 28h13" />
    <path className="mark__pencil" d="m25 38 12-12 5 5-12 12-7 2z" />
  </svg>;
}

function Icon({ name }: { name: 'plus' | 'arrow' | 'export' | 'check' | 'bundle' | 'lock' | 'trash' }) {
  const paths = {
    plus: <path d="M12 5v14M5 12h14" />,
    arrow: <path d="m9 5 7 7-7 7" />,
    export: <><path d="M12 3v12m0-12 5 5m-5-5L7 8" /><path d="M5 13v7h14v-7" /></>,
    check: <path d="m4 12 5 5L20 6" />,
    bundle: <><path d="M5 3h14v18H5z" /><path d="M8 8h8M8 12h8M8 16h5" /></>,
    lock: <><path d="M6 10h12v11H6z" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
    trash: <><path d="M6 7h12M9 7V4h6v3M8 10v9h8v-9" /></>
  };
  return <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>;
}

function AppFooter() {
  return <footer className="site-footer">
    <p>Writing feedback stored in your browser until you export it.</p>
    <nav aria-label="Legal"><a href="/privacy/">Privacy</a><a href="/terms/">Terms</a></nav>
    <p className="generated-disclosure">Original illustration generated for this product with Azure AI Foundry.</p>
  </footer>;
}

function Welcome({ onCreate }: { onCreate: (title: string, className: string) => void }) {
  const [title, setTitle] = useState('');
  const [className, setClassName] = useState('');
  const [attempted, setAttempted] = useState(false);
  const invalid = attempted && !title.trim();
  function submit(event: JSX.TargetedSubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setAttempted(true);
    if (title.trim()) onCreate(title, className);
  }
  return <main id="main" className="welcome">
    <div className="welcome__copy">
      <p className="eyebrow"><span className="shape shape--diamond" /> Writing teacher feedback</p>
      <h1 className="route-heading" tabIndex={-1}>Give personal feedback on short writing</h1>
      <p className="lede">For writing teachers responding to many short submissions, reuse your rubric and add a personal note.</p>
      <div className="sample-action">
        <a className="button button--primary" href="/demo">Try it with sample data <Icon name="arrow" /></a>
        <p>See a filled feedback bundle. Nothing is saved to your real data.</p>
      </div>
      <form className="start-form" onSubmit={submit} noValidate>
        <p className="form-intro">Or start a real feedback bundle</p>
        <div className="field">
          <label htmlFor="assignment-title">Assignment name <span aria-hidden="true">*</span></label>
          <input id="assignment-title" value={title} onInput={(e) => setTitle(e.currentTarget.value)} aria-invalid={invalid} aria-describedby={invalid ? 'title-error' : undefined} />
          {invalid && <p id="title-error" className="field-error" role="alert">Name the assignment to start a feedback bundle.</p>}
        </div>
        <div className="field">
          <label htmlFor="class-name">Class or section <span className="optional">Optional</span></label>
          <input id="class-name" value={className} onInput={(e) => setClassName(e.currentTarget.value)} />
        </div>
        <button className="button button--secondary start-button" type="submit">Create feedback bundle <Icon name="arrow" /></button>
      </form>
      <ul className="trust-list" aria-label="Product facts">
        <li><Icon name="check" /> Stored in this browser</li>
        <li><Icon name="check" /> Works offline after the first visit</li>
        <li><Icon name="check" /> Free core; Plus is $24 once</li>
      </ul>
    </div>
    <figure className="welcome__art">
      <div className="art-frame">
        <picture>
          <source media="(max-width: 700px)" srcSet="/assets/feedback-geometry-768.webp" />
          <img src="/assets/feedback-geometry-1280.webp" width="1536" height="1024" alt="Paper rubric pieces arranged around a single lined feedback sheet" fetchPriority="high" decoding="async" />
        </picture>
        <div className="art-caption"><span>01</span> Rubric fragments and a personal note make one student feedback page.</div>
      </div>
    </figure>
  </main>;
}

function DemoBanner({ onReset, onStartReal }: { onReset: () => void; onStartReal: () => void }) {
  return <aside className="demo-banner" aria-label="Demo status" role="status">
    <strong>Demo — sample data, nothing is saved</strong>
    <div>
      <button className="button button--quiet button--small" type="button" onClick={onReset}>Reset demo</button>
      <button className="button button--primary button--small" type="button" onClick={onStartReal}>Start for real</button>
    </div>
  </aside>;
}

interface WorkspaceProps {
  bundle: Bundle;
  onChange: (bundle: Bundle) => void;
  onMessage: (message: string) => void;
}

function Workspace({ bundle, onChange, onMessage }: WorkspaceProps) {
  const [studentIndex, setStudentIndex] = useState(0);
  const [customFor, setCustomFor] = useState<string | null>(null);
  const [customText, setCustomText] = useState('');
  const [customError, setCustomError] = useState('');
  const [validation, setValidation] = useState('');
  const studentQueueRef = useRef<HTMLDivElement>(null);
  const student = bundle.students[Math.min(studentIndex, bundle.students.length - 1)];
  const completed = bundle.students.filter((item) => item.completed).length;
  const progress = bundle.students.length ? Math.round((completed / bundle.students.length) * 100) : 0;

  useEffect(() => {
    setStudentIndex((index) => Math.min(index, bundle.students.length - 1));
  }, [bundle.id, bundle.students.length]);

  useEffect(() => {
    const queue = studentQueueRef.current;
    const active = queue?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!queue || !active) return;
    const target = active.offsetLeft - (queue.clientWidth - active.offsetWidth) / 2;
    queue.scrollTo({
      left: Math.max(0, target),
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
    });
  }, [bundle.id, bundle.students.length, studentIndex]);

  useEffect(() => {
    function keys(event: KeyboardEvent) {
      if (!event.altKey || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
      event.preventDefault();
      setStudentIndex((index) => Math.max(0, Math.min(bundle.students.length - 1, index + (event.key === 'ArrowRight' ? 1 : -1))));
    }
    window.addEventListener('keydown', keys);
    return () => window.removeEventListener('keydown', keys);
  }, [bundle.students.length]);

  function updateStudent(change: (draft: Student) => void) {
    const next = structuredClone(bundle);
    const current = next.students[studentIndex];
    change(current);
    current.updatedAt = new Date().toISOString();
    if (current.completed) current.completed = false;
    onChange(next);
  }

  function toggleFragment(criterionId: string, fragment: Fragment, checked: boolean) {
    updateStudent((draft) => {
      const selected = draft.feedback[criterionId] ?? [];
      draft.feedback[criterionId] = checked
        ? [...selected, { fragmentId: fragment.id, text: fragment.text }]
        : selected.filter((item) => item.fragmentId !== fragment.id);
    });
  }

  function addCustom(criterionId: string) {
    const text = customText.trim();
    if (!text) {
      setCustomError('Write a reusable fragment before saving.');
      requestAnimationFrame(() => document.querySelector<HTMLTextAreaElement>(`#custom-${criterionId}`)?.focus());
      return;
    }
    const next = structuredClone(bundle);
    const fragment = { id: newId('fragment'), text };
    const criterion = next.criteria.find((item) => item.id === criterionId);
    if (!criterion) return;
    criterion.fragments.push(fragment);
    const current = next.students[studentIndex];
    current.feedback[criterionId] = [...(current.feedback[criterionId] ?? []), { fragmentId: fragment.id, text }];
    onChange(next);
    setCustomFor(null);
    setCustomText('');
    setCustomError('');
    onMessage('Fragment saved to this bundle and selected.');
  }

  function addStudent() {
    const next = structuredClone(bundle);
    next.students.push(createStudent());
    onChange(next);
    setStudentIndex(next.students.length - 1);
    requestAnimationFrame(() => document.querySelector<HTMLInputElement>('#student-name')?.focus());
  }

  function removeStudent() {
    if (bundle.students.length === 1) return;
    const label = student.name.trim() || `Student ${studentIndex + 1}`;
    if (!window.confirm(`Remove ${label} and all feedback for this student? This cannot be undone.`)) return;
    const next = structuredClone(bundle);
    next.students.splice(studentIndex, 1);
    next.history.unshift({ id: newId('event'), at: new Date().toISOString(), label: `${label} removed` });
    onChange(next);
    setStudentIndex(Math.max(0, studentIndex - 1));
    onMessage(`${label} removed.`);
  }

  function markComplete() {
    if (!validateResponse('finishing')) return;
    const next = structuredClone(bundle);
    next.students[studentIndex].completed = true;
    next.history.unshift({ id: newId('event'), at: new Date().toISOString(), label: `Feedback finished for ${student.name}` });
    next.history = next.history.slice(0, 30);
    onChange(next);
    setValidation('');
    onMessage(`Feedback for ${student.name} is ready to export.`);
  }

  function validateResponse(action: 'finishing' | 'exporting'): boolean {
    if (!student.name.trim()) {
      setValidation(`Add the student’s name before ${action}.`);
      document.querySelector<HTMLInputElement>('#student-name')?.focus();
      return false;
    }
    const hasFeedback = Object.values(student.feedback).some((items) => items.some((item) => item.text.trim()));
    if (!hasFeedback) {
      setValidation(`Select or write at least one rubric fragment before ${action}.`);
      document.querySelector<HTMLElement>('.criteria-list input, .add-fragment')?.focus();
      return false;
    }
    if (!student.personalNote.trim()) {
      setValidation(`Write one personal note before ${action}. This keeps every response unmistakably yours.`);
      document.querySelector<HTMLTextAreaElement>('#personal-note')?.focus();
      return false;
    }
    setValidation('');
    return true;
  }

  function exportCurrent() {
    if (!validateResponse('exporting')) return;
    exportStudent(bundle, student);
    const next = structuredClone(bundle);
    next.history.unshift({ id: newId('event'), at: new Date().toISOString(), label: `Feedback exported for ${student.name}` });
    onChange(next);
    onMessage(`Downloaded ${student.name}’s private feedback page.`);
  }

  function preview() {
    const url = URL.createObjectURL(new Blob([studentFeedbackHtml(bundle, student)], { type: 'text/html' }));
    const opened = window.open(url, '_blank', 'noopener,noreferrer');
    if (!opened) onMessage('Your browser blocked the preview. Use “Download feedback page” instead.');
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  function nav(index: number) {
    setStudentIndex(index);
    setValidation('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return <main id="main" className="workspace">
    <section className="assignment-bar" aria-labelledby="assignment-heading">
      <div>
        <p className="eyebrow"><span className="shape shape--square" /> Active bundle</p>
        <h1 id="assignment-heading" className="route-heading" tabIndex={-1}>{bundle.title}</h1>
        <p>{bundle.className || 'No class label'} · {completed} of {bundle.students.length} finished</p>
      </div>
      <div className="progress-wrap">
        <span>{progress}%</span>
        <div className="progress" role="progressbar" aria-label="Feedback completion" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}><span style={{ width: `${progress}%` }} /></div>
      </div>
    </section>

    <nav className="student-queue" aria-label="Student work queue">
      <div className="student-queue__list" ref={studentQueueRef}>
        {bundle.students.map((item, index) => <button key={item.id} className={`student-tab ${index === studentIndex ? 'is-current' : ''}`} aria-current={index === studentIndex ? 'page' : undefined} onClick={() => nav(index)}>
          <span className={`student-state ${item.completed ? 'is-complete' : ''}`} aria-hidden="true" />
          <span>{item.name.trim() || `Student ${index + 1}`}</span>
          <span className="sr-only">{item.completed ? 'Finished' : 'Draft'}</span>
        </button>)}
      </div>
      <button className="button button--quiet" onClick={addStudent}><Icon name="plus" /> Add student</button>
    </nav>

    <div className="grading-grid">
      <section className="submission-pane" aria-labelledby="submission-heading">
        <div className="section-number" aria-hidden="true">01</div>
        <div className="pane-heading">
          <div><p className="eyebrow">Student & submission</p><h3 id="submission-heading">Keep their words in view</h3></div>
          {bundle.students.length > 1 && <button className="icon-button danger-action" type="button" onClick={removeStudent} aria-label={`Remove ${student.name || `Student ${studentIndex + 1}`}`} title="Remove student"><Icon name="trash" /></button>}
        </div>
        <div className="field">
          <label htmlFor="student-name">Student name</label>
          <input id="student-name" value={student.name} onInput={(e) => updateStudent((draft) => { draft.name = e.currentTarget.value; })} autoComplete="off" />
        </div>
        <div className="field field--fill">
          <div className="label-row"><label htmlFor="submission">Submission</label><span>Stays on this device</span></div>
          <textarea id="submission" className="submission-input" value={student.submission} onInput={(e) => updateStudent((draft) => { draft.submission = e.currentTarget.value; })} spellcheck={true} />
          {!student.submission && <p className="field-hint">Paste the student’s short piece here, or leave it blank and grade from another window.</p>}
        </div>
      </section>

      <section className="feedback-pane" aria-labelledby="feedback-heading">
        <div className="section-number" aria-hidden="true">02</div>
        <div className="pane-heading"><div><p className="eyebrow">Your rubric library</p><h3 id="feedback-heading">Select, then make it specific</h3></div></div>
        <p className="pane-intro">Choose useful starting points. Every selected fragment remains editable for this student.</p>
        <div className="criteria-list">
          {bundle.criteria.map((criterion, criterionIndex) => {
            const selected = student.feedback[criterion.id] ?? [];
            return <details className="criterion" open={criterionIndex < 2 || selected.length > 0} key={criterion.id}>
              <summary>
                <span className="criterion__index">{String(criterionIndex + 1).padStart(2, '0')}</span>
                <span><strong>{criterion.name}</strong><small>{criterion.prompt}</small></span>
                <span className="selection-count">{selected.length} selected</span>
              </summary>
              <div className="fragment-list">
                {criterion.fragments.map((fragment) => {
                  const chosen = selected.find((item) => item.fragmentId === fragment.id);
                  return <div className={`fragment ${chosen ? 'is-selected' : ''}`} key={fragment.id}>
                    <label className="fragment-choice">
                      <input type="checkbox" checked={Boolean(chosen)} onChange={(e) => toggleFragment(criterion.id, fragment, e.currentTarget.checked)} />
                      <span>{fragment.text}</span>
                    </label>
                    {chosen && <div className="tailor-field">
                      <label htmlFor={`${student.id}-${fragment.id}`}>Tailor for {student.name || 'this student'}</label>
                      <textarea id={`${student.id}-${fragment.id}`} value={chosen.text} onInput={(e) => updateStudent((draft) => {
                        const item = draft.feedback[criterion.id]?.find((candidate) => candidate.fragmentId === fragment.id);
                        if (item) item.text = e.currentTarget.value;
                      })} />
                    </div>}
                  </div>;
                })}
                {customFor === criterion.id ? <div className="custom-fragment">
                  <label htmlFor={`custom-${criterion.id}`}>New reusable fragment</label>
                  <textarea id={`custom-${criterion.id}`} value={customText} onInput={(e) => { setCustomText(e.currentTarget.value); if (customError && e.currentTarget.value.trim()) setCustomError(''); }} aria-invalid={Boolean(customError)} aria-describedby={customError ? `custom-${criterion.id}-error` : undefined} autoFocus />
                  {customError && <p id={`custom-${criterion.id}-error`} className="field-error" role="alert">{customError}</p>}
                  <div className="button-row"><button className="button button--primary button--small" type="button" onClick={() => addCustom(criterion.id)}>Save and select</button><button className="button button--quiet button--small" type="button" onClick={() => { setCustomFor(null); setCustomText(''); setCustomError(''); }}>Cancel</button></div>
                </div> : <button className="add-fragment" type="button" onClick={() => { setCustomFor(criterion.id); setCustomError(''); }}><Icon name="plus" /> Write a fragment</button>}
              </div>
            </details>;
          })}
        </div>
        <div className="personal-note">
          <div className="note-heading"><span className="shape shape--coral" /><div><label htmlFor="personal-note">A note only you could write <span aria-hidden="true">*</span></label><p>Required before finishing; never reused.</p></div></div>
          <textarea id="personal-note" maxLength={600} value={student.personalNote} onInput={(e) => updateStudent((draft) => { draft.personalNote = e.currentTarget.value; })} onKeyDown={(e) => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') markComplete(); }} />
          <div className="note-meta"><span>{student.personalNote.length}/600</span><span>Ctrl/⌘ + Enter to finish</span></div>
        </div>
        {validation && <p className="validation" role="alert">{validation}</p>}
        <div className="finish-bar">
          <button className="button button--secondary" type="button" onClick={preview}>Preview</button>
          <button className="button button--secondary" type="button" onClick={exportCurrent}><Icon name="export" /> Download feedback page</button>
          <button className="button button--primary" type="button" onClick={markComplete}>{student.completed ? <><Icon name="check" /> Finished</> : 'Finish feedback'}</button>
        </div>
      </section>
    </div>
    <div className="queue-nav" aria-label="Move between students">
      <button className="button button--quiet" disabled={studentIndex === 0} onClick={() => nav(studentIndex - 1)}>← Previous <span>Alt + ←</span></button>
      <p>{studentIndex + 1} / {bundle.students.length}</p>
      <button className="button button--quiet" disabled={studentIndex === bundle.students.length - 1} onClick={() => nav(studentIndex + 1)}>Next <span>Alt + →</span> →</button>
    </div>
  </main>;
}

function Summary({ bundle, unlocked, onMessage }: { bundle: Bundle; unlocked: boolean; onMessage: (message: string) => void }) {
  const items = misconceptionSummary(bundle);
  const completed = bundle.students.filter((item) => item.completed).length;
  function downloadCsv() {
    downloadFile(summaryCsv(bundle), `${bundle.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-summary.csv`, 'text/csv');
    onMessage('Downloaded the anonymized CSV summary.');
  }
  return <main id="main" className="page-shell summary-page">
    <div className="page-heading"><p className="eyebrow"><span className="shape shape--diamond" /> Class patterns</p><h1 className="route-heading" tabIndex={-1}>Anonymized feedback summary</h1><p>See what the class may need next without exposing student names or submissions.</p></div>
    <div className="summary-stats" aria-label="Bundle statistics">
      <div><strong>{bundle.students.length}</strong><span>Students</span></div>
      <div><strong>{completed}</strong><span>Finished</span></div>
      <div><strong>{items.reduce((total, item) => total + item.count, 0)}</strong><span>Feedback selections</span></div>
    </div>
    {!items.length ? <section className="empty-panel"><span className="empty-glyph" aria-hidden="true" /><h3>No patterns yet</h3><p>Select feedback fragments for students, then return here to see recurring needs.</p><a className="button button--primary" href="#grade">Start grading</a></section> : <section className="pattern-section" aria-labelledby="pattern-heading">
      <div className="section-title-row"><div><p className="eyebrow">Across this bundle</p><h3 id="pattern-heading">Repeated feedback patterns</h3></div>{unlocked ? <button className="button button--secondary" onClick={downloadCsv}><Icon name="export" /> Export CSV</button> : <a className="button button--quiet" href="#settings"><Icon name="lock" /> CSV with Plus</a>}</div>
      <div className="pattern-table" role="table" aria-label="Anonymized feedback patterns">
        <div role="row" className="pattern-row pattern-head"><span role="columnheader">Criterion</span><span role="columnheader">Feedback pattern</span><span role="columnheader">Students</span></div>
        {items.map((item, index) => <div role="row" className="pattern-row" key={`${item.feedback}-${index}`}><span role="cell">{item.criterion}</span><span role="cell">{item.feedback}</span><strong role="cell">{item.count}</strong></div>)}
      </div>
      <p className="privacy-note"><Icon name="check" /> This summary counts feedback choices only. Names and submissions are never included.</p>
    </section>}
  </main>;
}

function BundleLibrary({ bundles, currentId, unlocked, onOpen, onCreate, onDelete, onMessage }: { bundles: Bundle[]; currentId: string; unlocked: boolean; onOpen: (id: string) => void; onCreate: (title: string, className: string) => void; onDelete: (id: string) => void; onMessage: (message: string) => void }) {
  const [title, setTitle] = useState('');
  const [className, setClassName] = useState('');
  const canCreate = unlocked || bundles.length === 0;
  return <main id="main" className="page-shell bundles-page">
    <div className="page-heading"><p className="eyebrow"><span className="shape shape--square" /> Your work</p><h1 className="route-heading" tabIndex={-1}>Feedback bundles</h1><p>Each bundle keeps its rubric fragments, student queue, and feedback history together.</p></div>
    <section className="bundle-grid" aria-label="Saved bundles">
      {bundles.map((bundle) => <article className={`bundle-card ${bundle.id === currentId ? 'is-current' : ''}`} key={bundle.id}>
        <div className="bundle-card__mark"><Mark small /></div>
        <p className="eyebrow">{bundle.id === currentId ? 'Open now' : 'Saved locally'}</p>
        <h3>{bundle.title}</h3><p>{bundle.className || 'No class label'}</p>
        <dl><div><dt>Students</dt><dd>{bundle.students.length}</dd></div><div><dt>Finished</dt><dd>{bundle.students.filter((item) => item.completed).length}</dd></div></dl>
        <div className="bundle-actions"><button className="button button--secondary" onClick={() => onOpen(bundle.id)}>Open bundle</button><button className="icon-button danger-action" onClick={() => onDelete(bundle.id)} aria-label={`Delete ${bundle.title}`} title="Delete bundle"><Icon name="trash" /></button></div>
      </article>)}
      {canCreate ? <form className="bundle-card bundle-card--new" onSubmit={(event) => { event.preventDefault(); if (!title.trim()) { onMessage('Name the assignment before creating a bundle.'); return; } onCreate(title, className); }}>
        <span className="new-geometry" aria-hidden="true"><i /><i /><i /></span><h3>Start another bundle</h3>
        <div className="field"><label htmlFor="new-title">Assignment name</label><input id="new-title" value={title} onInput={(e) => setTitle(e.currentTarget.value)} /></div>
        <div className="field"><label htmlFor="new-class">Class or section <span className="optional">Optional</span></label><input id="new-class" value={className} onInput={(e) => setClassName(e.currentTarget.value)} /></div>
        <button className="button button--primary" type="submit"><Icon name="plus" /> Create bundle</button>
      </form> : <article className="bundle-card bundle-card--locked"><Icon name="lock" /><p className="eyebrow">Plus feature</p><h3>Keep unlimited bundles</h3><p>The free edition keeps one complete bundle. A one-time Plus license lets you create and revisit as many as you need.</p><a className="button button--primary" href="#settings">See the one-time unlock</a></article>}
    </section>
  </main>;
}

function Settings({ license, onLicense, onImport, onExport, onMessage }: { license: LicenseState; onLicense: (token: string) => void; onImport: (file: File) => void; onExport: () => void; onMessage: (message: string) => void }) {
  const [token, setToken] = useState('');
  return <main id="main" className="page-shell settings-page">
    <div className="page-heading"><p className="eyebrow"><span className="shape shape--coral" /> Ownership & backup</p><h1 className="route-heading" tabIndex={-1}>Settings</h1><p>Your classroom data lives in IndexedDB on this device. Export a backup whenever you want a portable copy.</p></div>
    <div className="settings-grid">
      <section className="settings-section" aria-labelledby="backup-heading"><p className="section-kicker">01 / Data</p><h3 id="backup-heading">Keep your own backup</h3><p>The JSON backup includes bundle settings, student names and submissions, so store it as carefully as your gradebook.</p><div className="button-stack"><button className="button button--secondary" onClick={onExport}><Icon name="export" /> Download JSON backup</button><label className="button button--quiet file-button"><input type="file" accept="application/json,.json" onChange={(event) => { const file = event.currentTarget.files?.[0]; if (file) onImport(file); event.currentTarget.value = ''; }} /> Import a backup</label></div></section>
      <section className="settings-section plus-section" aria-labelledby="plus-heading"><p className="section-kicker">02 / Plus</p><h3 id="plus-heading">{license.unlocked ? 'Plus is unlocked' : 'A private tool, once—not forever'}</h3>
        {license.unlocked ? <><p className="license-status success"><Icon name="check" /> License active on this device</p><p>You can keep unlimited bundles and export class patterns as CSV. Core feedback pages and backups always remain available.</p></> : <><p><strong>$24 one-time.</strong> Unlock unlimited saved bundles and CSV class summaries. No subscription, per-student fee, or tracking.</p><a className="button button--primary" href={checkoutUrl()}>Buy Plus securely</a><p className="merchant-note">Checkout and refunds are handled by Sociobot/Dodo, the merchant of record. A refunded license is revoked automatically.</p></>}
        {license.notice && <p className="license-notice" role="status">{license.notice}</p>}
        <div className="restore-form"><label htmlFor="license-token">Have a license? Paste it here</label><div><input id="license-token" value={token} onInput={(e) => setToken(e.currentTarget.value)} autoComplete="off" spellcheck={false} /><button className="button button--secondary" disabled={!token.trim() || license.checking} onClick={() => { onLicense(token); onMessage('Checking your license…'); }}>{license.checking ? 'Checking…' : 'Restore purchase'}</button></div></div>
        <p className="legal-line">By purchasing, you agree to the <a href="/terms/">terms</a>. Read how license checks work in our <a href="/privacy/">privacy policy</a>.</p>
      </section>
      <section className="settings-section" aria-labelledby="shortcuts-heading"><p className="section-kicker">03 / Keyboard</p><h3 id="shortcuts-heading">Move without breaking focus</h3><dl className="shortcut-list"><div><dt><kbd>Alt</kbd> + <kbd>←</kbd>/<kbd>→</kbd></dt><dd>Previous or next student</dd></div><div><dt><kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>Enter</kbd></dt><dd>Finish current feedback</dd></div></dl></section>
    </div>
  </main>;
}

export function App() {
  const [demo] = useState(isDemoLocation);
  const storage = demo ? demoDb : db;
  const licenseStorage = demo ? sessionStorage : localStorage;
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [currentId, setCurrentId] = useState('');
  const [view, setView] = useState<View>('grade');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saveState, setSaveState] = useState<SaveState>('saved');
  const [message, setMessage] = useState('');
  const [online, setOnline] = useState(navigator.onLine);
  const [updateReady, setUpdateReady] = useState<ServiceWorker | null>(null);
  const [license, setLicense] = useState<LicenseState>(() => ({
    unlocked: cachedUnlock(licenseStorage), checking: Boolean(storedLicense(licenseStorage)), notice: ''
  }));
  const [installPrompt, setInstallPrompt] = useState<Event | null>(null);
  const messageTimer = useRef<number | undefined>();
  const hasMountedRoute = useRef(false);
  const current = bundles.find((item) => item.id === currentId) ?? bundles[0];

  function announce(text: string) {
    setMessage(text);
    window.clearTimeout(messageTimer.current);
    messageTimer.current = window.setTimeout(() => setMessage(''), 5000);
  }

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        let saved = await listBundles(storage);
        if (demo && !saved.length) {
          const sample = createDemoBundle();
          await saveBundle(sample, storage);
          saved = [sample];
        }
        if (!active) return;
        setBundles(saved);
        setCurrentId(saved[0]?.id ?? '');
        setLoading(false);
      } catch {
        setLoadError('Local storage could not open. Check private-browsing or storage settings, then reload.');
        setLoading(false);
      }
    }
    void load();
    captureReturnedLicense(licenseStorage);
    setLicense((state) => ({ ...state, checking: Boolean(storedLicense(licenseStorage)) }));
    verifyLicense(false, licenseStorage).then((result) => active && setLicense(result));
    const onOnline = () => { setOnline(true); verifyLicense(false, licenseStorage).then(setLicense); };
    const onOffline = () => setOnline(false);
    const onInstall = (event: Event) => { event.preventDefault(); setInstallPrompt(event); };
    const onUpdate = (event: Event) => setUpdateReady((event as CustomEvent<ServiceWorker>).detail);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    window.addEventListener('beforeinstallprompt', onInstall);
    window.addEventListener('feedback-app-update', onUpdate);
    return () => { active = false; window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOffline); window.removeEventListener('beforeinstallprompt', onInstall); window.removeEventListener('feedback-app-update', onUpdate); };
  }, [demo, licenseStorage, storage]);

  useEffect(() => {
    const hashView = location.hash.slice(1) as View;
    if (['grade', 'summary', 'bundles', 'settings'].includes(hashView)) setView(hashView);
    const hash = () => { const next = location.hash.slice(1) as View; if (['grade', 'summary', 'bundles', 'settings'].includes(next)) setView(next); };
    window.addEventListener('hashchange', hash);
    return () => window.removeEventListener('hashchange', hash);
  }, []);

  useEffect(() => {
    if (loading) return;
    const pageTitle = demo ? 'Demo — Rubric Feedback Bundles'
      : view === 'summary' ? 'Class summary — Rubric Feedback Bundles'
        : view === 'bundles' ? 'Feedback bundles — Rubric Feedback Bundles'
          : view === 'settings' ? 'Settings — Rubric Feedback Bundles'
            : current ? `${current.title} — Rubric Feedback Bundles`
              : 'Rubric Feedback Bundles — Writing feedback for teachers';
    document.title = pageTitle;
  }, [current, demo, loading, view]);

  useEffect(() => {
    if (loading) return;
    if (!hasMountedRoute.current) { hasMountedRoute.current = true; return; }
    const frame = requestAnimationFrame(() => document.querySelector<HTMLElement>('#main .route-heading')?.focus({ preventScroll: true }));
    return () => cancelAnimationFrame(frame);
  }, [currentId, loading, view]);

  async function persist(next: Bundle) {
    const stamped = { ...next, updatedAt: new Date().toISOString() };
    setBundles((saved) => saved.map((item) => item.id === stamped.id ? stamped : item));
    setSaveState('saving');
    try { await saveBundle(stamped, storage); setSaveState('saved'); }
    catch { setSaveState('error'); announce('Changes could not be saved. Export a backup and check browser storage.'); }
  }

  async function create(title: string, className: string) {
    if (bundles.length && !license.unlocked) { location.hash = 'settings'; return; }
    const bundle = createBundle(title, className);
    try {
      await saveBundle(bundle, storage);
      setBundles((items) => [bundle, ...items]);
      setCurrentId(bundle.id);
      setView('grade');
      location.hash = 'grade';
      announce('Feedback bundle created and saved locally.');
    } catch { setLoadError('The bundle could not be saved. Check that browser storage is available.'); }
  }

  async function remove(id: string) {
    const item = bundles.find((bundle) => bundle.id === id);
    if (!item || !window.confirm(`Delete “${item.title}” and all its student feedback? This cannot be undone.`)) return;
    await deleteBundle(id, storage);
    const remaining = bundles.filter((bundle) => bundle.id !== id);
    setBundles(remaining);
    if (currentId === id) setCurrentId(remaining[0]?.id ?? '');
    announce(`Deleted ${item.title}.`);
  }

  async function backup() {
    try { downloadFile(await exportBackup(storage), `rubric-feedback-backup-${new Date().toISOString().slice(0, 10)}.json`, 'application/json'); announce('Downloaded your complete local backup.'); }
    catch { announce('The backup could not be created. Try again.'); }
  }

  async function restore(file: File) {
    try { const count = await importBackup(await file.text(), storage); const refreshed = await listBundles(storage); setBundles(refreshed); setCurrentId(refreshed[0]?.id ?? ''); announce(`Imported ${count} ${count === 1 ? 'bundle' : 'bundles'}.`); }
    catch (error) { announce(error instanceof Error ? error.message : 'The backup could not be imported.'); }
  }

  async function checkLicense(token: string) {
    storeLicense(token, licenseStorage);
    setLicense((state) => ({ ...state, checking: true }));
    setLicense(await verifyLicense(true, licenseStorage));
  }

  async function install() {
    if (!installPrompt) return;
    const event = installPrompt as Event & { prompt: () => Promise<void> };
    await event.prompt();
    setInstallPrompt(null);
  }

  const title = useMemo(() => current?.title ?? 'Rubric Feedback Bundles', [current]);

  async function resetDemo() {
    await clearDemoBundles();
    const sample = createDemoBundle();
    await saveBundle(sample, demoDb);
    setBundles([sample]);
    setCurrentId(sample.id);
    setView('grade');
    location.hash = 'grade';
    announce('Sample feedback reset.');
  }

  async function startForReal() {
    await clearDemoBundles();
    location.assign('/');
  }

  if (loading) return <><header className="app-header"><a className="brand" href="/"><Mark /><span>Rubric Feedback Bundles</span></a></header><main id="main" className="loading-state"><span className="loading-geometry" aria-hidden="true" /><h1>Opening your local feedback library</h1></main></>;
  if (loadError) return <><header className="app-header"><a className="brand" href="/"><Mark /><span>Rubric Feedback Bundles</span></a></header><main id="main" className="error-state"><h1>Your local library didn’t open</h1><p>{loadError}</p><button className="button button--primary" onClick={() => location.reload()}>Try again</button></main></>;

  return <div className="app">
    <header className="app-header">
      <a className="brand" href={demo ? '/demo#grade' : '/'} aria-label="Rubric Feedback Bundles home"><Mark /><span>Rubric Feedback Bundles</span></a>
      <nav className="primary-nav" aria-label="Primary navigation">
        {!demo && <a href="/demo">Demo</a>}
        {bundles.length > 0 ? <><a href="#grade" className={view === 'grade' ? 'is-active' : ''} aria-current={view === 'grade' ? 'page' : undefined}>Grade</a>
          <a href="#summary" className={view === 'summary' ? 'is-active' : ''} aria-current={view === 'summary' ? 'page' : undefined}>Class summary</a>
          <a href="#bundles" className={view === 'bundles' ? 'is-active' : ''} aria-current={view === 'bundles' ? 'page' : undefined}>Bundles</a></> : <a href="/privacy/">Privacy</a>}
      </nav>
      <div className="header-actions">
        <span className={`connection-status ${online ? '' : 'is-offline'}`} title={online ? 'Online; all student data still stays local' : 'Offline'}><i />{online ? 'Local' : 'Offline'}</span>
        {saveState !== 'saved' && <span className={`save-state save-state--${saveState}`} role="status">{saveState === 'saving' ? 'Saving…' : 'Save failed'}</span>}
        {installPrompt && <button className="text-button" onClick={install}>Install app</button>}
        <a className="settings-link" href="#settings" aria-label="Settings" aria-current={view === 'settings' ? 'page' : undefined}><span aria-hidden="true">⚙</span></a>
      </div>
    </header>
    {demo && <DemoBanner onReset={() => { void resetDemo(); }} onStartReal={() => { void startForReal(); }} />}
    {!online && <div className="offline-banner" role="status"><strong>Offline.</strong> Keep working—changes are saving on this device. License checks and checkout need a connection.</div>}
    {view === 'settings' ? <Settings license={license} onLicense={checkLicense} onImport={restore} onExport={backup} onMessage={announce} /> : !bundles.length ? <Welcome onCreate={create} /> : view === 'grade' && current ? <Workspace bundle={current} onChange={persist} onMessage={announce} /> : view === 'summary' && current ? <Summary bundle={current} unlocked={license.unlocked} onMessage={announce} /> : <BundleLibrary bundles={bundles} currentId={current?.id ?? ''} unlocked={license.unlocked} onOpen={(id) => { setCurrentId(id); location.hash = 'grade'; }} onCreate={create} onDelete={remove} onMessage={announce} />}
    <AppFooter />
    <div className={`toast ${message ? 'is-visible' : ''}`} role="status" aria-live="polite">{message}</div>
    {updateReady && <div className="update-toast" role="status"><div><strong>An update is ready</strong><span>Your local work is safe.</span></div><button className="button button--primary button--small" onClick={() => updateReady.postMessage({ type: 'SKIP_WAITING' })}>Update now</button></div>}
    <span className="sr-only" aria-live="polite">{saveState === 'saved' ? `All changes to ${title} saved locally.` : ''}</span>
  </div>;
}
