# Rubric Feedback Bundles — build handoff

## Shipped

- A complete local-first grading flow: create a bundle, keep a student queue,
  paste short submissions, select or add reusable rubric fragments, tailor the
  selected language, and add a required personal note.
- Completion and student-page download are blocked until the response has a
  student name, non-empty criterion feedback, and a personal note.
- Standalone, escaped, print-friendly student HTML exports and an on-screen
  class pattern summary that never exposes names, submissions, or tailored
  student-specific wording.
- IndexedDB persistence plus validated, atomic JSON backup/import. Corrupt or
  incomplete nested backup records are rejected without partial writes.
- One complete free bundle. A $24 one-time Plus license unlocks unlimited new
  bundles and anonymized CSV summaries. Checkout, return-token capture, daily
  verification caching, offline cached access, and pasted-license restoration
  follow the Sociobot billing contract.
- Installable PWA assets, build-versioned app-shell caching, offline reload,
  offline/status messaging, and an in-app service-worker update action.
- Responsive 390px layout, keyboard shortcuts, semantic legal pages, local
  fonts, generated worktable artwork, and the product-specific geometric visual
  system in `design.md`.

## Run and verify

Requires Node.js 20 or newer.

```sh
npm ci
npm test
npm run build
npm run test:e2e
```

Deployment uses `npm run build`; output is `dist/`, with `dist/index.html` at
its root.

Verification on 28 August 2026:

- `npm test`: 7/7 passing.
- `npm run test:e2e`: 9 passing, 3 intentional project-specific skips across
  desktop Chromium and a 390×844 mobile viewport.
- Offline Playwright check: after the first visit, the full grading workspace
  reloaded with the browser offline and accepted a locally saved edit.
- Axe Playwright scans: no serious or critical issues on welcome, editor,
  privacy, or terms pages.
- Factory URL verifier: HTTP 200; one `<h1>`; `lang="en"`; main landmark;
  zero missing image alt attributes; zero unlabeled buttons; zero console or
  page errors.
- Lighthouse mobile: performance 99, accessibility 100, best practices 100,
  SEO 100. FCP 1.4s, LCP 1.8s, total blocking time 0ms, CLS 0.
- Production payload: initial app JS 134.1KB plus 11.5KB shared runtime,
  CSS 25.0KB, fonts 100.8KB total, mobile hero WebP 12.1KB. All are below the
  specified budgets.
- `npm audit`: 0 vulnerabilities.

## Privacy and operations

Student work stays in browser IndexedDB unless the teacher explicitly exports
it. There is no analytics, tracking, remote sync, LLM call, CDN asset, or
third-party runtime script. Only a teacher-supplied Plus token is sent to the
Sociobot license verification endpoint.

The factory must register `rubric-feedback-bundles` in the billing engine before
live purchase testing. The verify path is covered with a mocked valid service
response; no real checkout was attempted from this disposable build worker.
Production defaults to `https://api.sociobot.in/api/v1`; staging can set
`VITE_BILLING_BASE=https://pilot-api.sociobot.in/api/v1` at build time.

## Intentional non-goals

No essay generation, plagiarism scoring, automated marks, accounts, or cloud
sync were added. Device-to-device movement uses the teacher-controlled JSON
backup and license restoration flows.
