# Independent product verification — FAIL

**Tested candidate:** `fb2048a5d36b644fc76faf329b49368ea0489a0d`  
**Tested URL:** <https://rubric-feedback-bundles.sociobot.in>  
**Verification date:** 28 August 2026 (UTC)  
**Environment:** Node.js 22.23.2, npm 10.9.8, Chromium 145 / Playwright 1.58.2

## Verdict

**FAIL.** The core free teacher workflow is useful, local-first, accessible,
and works offline. The live deployment also matches the candidate production
build byte for byte. Release acceptance nevertheless fails because the paid
checkout advertised in the shipped UI is unavailable: the production checkout
URL returns HTTP 404. Three medium-severity product/operations defects are also
recorded below.

No product code was changed during verification.

## Clean-checkout quality gates

The worktree was clean and `HEAD` was the candidate before installation.

| Gate | Result | Exact evidence |
| --- | --- | --- |
| Locked install | PASS | `npm ci`: 133 packages installed; 0 vulnerabilities |
| Unit/integration tests | PASS | `npm test`: 3 files, 7/7 tests passed |
| Type check + exact production build | PASS | `npm run build`: `tsc --noEmit && vite build`; `dist/` produced |
| Repository E2E suite | PASS | `npm run test:e2e`: 9 passed, 3 intentional project-specific skips |
| Dependency audit | PASS | `npm audit --audit-level=low`: 0 vulnerabilities |
| Lint | N/A | No lint script or separate lint configuration exists |
| Library/CLI consumer install | N/A | This is a browser PWA, not a package or CLI |

Production output was 134,067 B app JS + 11,474 B shared JS, 25,031 B CSS,
100,752 B total fonts, and 12,052 B mobile artwork. These are within the
200/50/120/300 KB contract budgets.

## Deployment identity and browser policies

- HTTPS root, privacy, and terms pages returned 200.
- Every one of the 20 files in local `dist/` was downloaded from production
  and compared with SHA-256. All 20 matched, including `index.html`, the hashed
  JS/CSS, fonts, images, manifest, icons, legal pages, and `sw.js`.
- The factory URL verifier reported one `<h1>`, `lang="en"`, a main landmark,
  no missing image alt text, no unlabeled buttons, and zero console/page errors.
- Present response protections: HSTS, `strict-origin-when-cross-origin`,
  `X-Content-Type-Options: nosniff`, and DNS prefetch disabled.
- The manifest is served as `application/octet-stream`, but Chromium parsed it
  successfully and CDP reported no manifest or installability errors.
- Hashed assets are incorrectly served with
  `Cache-Control: public, must-revalidate, max-age=30`; see RFV-04.
- No Content-Security-Policy or Permissions-Policy is present; see RFV-05.

## Independent functional coverage

The live app was exercised outside the repository's E2E suite.

- Whitespace-only assignment title produced a bound, announced validation
  error. Missing student name, empty tailored feedback, and missing personal
  note each blocked finish/export and moved focus to a recovery control.
- Created a normal bundle, retained a private submission through reload,
  selected and tailored feedback, added the required personal note, finished
  via `Ctrl+Enter`, and downloaded the student HTML receipt.
- The 600-character personal-note boundary was enforced at exactly 600.
- Names, notes, and tailored feedback containing HTML/script-like text were
  escaped in the receipt. The receipt contained no submission text or external
  URL, had one `<h1>`, a `<main>`, `lang="en"`, and no serious/critical axe issue.
- The class summary contained the canonical feedback pattern/count but no
  student name, submission, or student-specific tailored wording.
- Added 25 ordinary named students at 390×844, retained the 25th student's
  state, and confirmed core grading actions remained available. The queue has
  a current-item visibility defect described in RFV-02.
- Student removal was tested with cancel and confirm. `Alt+ArrowLeft` changed
  students, and adding a student focused the new student form after render.
- JSON backup downloaded valid sensitive data as disclosed. A structurally
  invalid backup was rejected with “Nothing was imported,” and the original
  bundle count remained unchanged.
- Invalid license return handling stripped `license` from the URL, stored the
  token/verdict under the documented localStorage keys, called only the
  Sociobot verify URL, and displayed “License no longer active.”

## Privacy and outbound traffic

- During the complete free workflow, all observed requests stayed on
  `rubric-feedback-bundles.sociobot.in`; there were no POST requests, analytics,
  LLM calls, CDN scripts/fonts, or sync calls.
- Classroom data was present only in the `rubric-feedback-bundles` IndexedDB.
  localStorage remained empty until the explicit invalid-license test.
- With a license present, the only cross-origin browser request was the token-
  only Sociobot verification GET. The production API returned CORS for the live
  origin, `Cache-Control: no-store`, and `{valid:false, reason:"invalid"}` for
  the test token. No student value appeared in that request.

## Accessibility, mobile, and motion

- Axe Playwright scans found zero serious/critical violations in welcome,
  editor, summary, settings, legal, exported-receipt, and 390px/25-student
  states.
- Keyboard validation, native disclosure controls, student shortcuts, and
  cancel/confirm paths were operable. Keyboard focus rendered a 3px solid coral
  outline; no trap was observed.
- `prefers-reduced-motion: reduce` was active and reduced transitions and
  animations to effectively instant (`0.000001s`).
- There were no console/page errors on desktop or mobile. RFV-02 and RFV-03
  cover the remaining mobile target/current-state issues.

## PWA and performance

- Manifest name, icons (192/512/maskable), standalone display, versioned start
  URL, scope, and theme/background colors parsed without installability errors.
- After a controlled first visit, the live saved workspace reloaded offline,
  remained under service-worker control, showed the offline banner, and kept
  its IndexedDB state.
- A query-distinct service-worker registration exercised the update lifecycle:
  “An update is ready” appeared, “Update now” activated the waiting worker, the
  controller changed, and the app reloaded.
- Fresh Lighthouse 12.8.2 mobile run: performance 96, accessibility 100, best
  practices 100, SEO 100; FCP 1.1s, LCP 1.7s, TBT 230ms, CLS 0, 171 KiB total
  transfer. No field INP was available in this isolated run.

## Defects

### RFV-01 — High — Production Plus checkout is unavailable

The shipped “Buy Plus securely” link points to
`https://api.sociobot.in/api/v1/products/rubric-feedback-bundles/checkout`.
On 28 August 2026 it returned HTTP 404 with
`{"error":"enabled factory product","status":404}`. A buyer cannot begin the
advertised $24 one-time purchase, so the paid-unlock flow cannot work end to
end. License verification itself is live and returns a valid structured
response. This appears to require factory billing registration/enablement, not
a client-code change.

### RFV-02 — Medium — The active student disappears from view in a 25-student mobile queue

At 390px with 25 ordinary names, the student strip had a 306px visible width
and 2,745px scrollable width. Adding students updates the active record and
focuses its name input but does not scroll the active tab into view. At student
25, the visible strip remained at the first students, so no visible queue item
indicated the active state. The strip is manually scrollable and the rest of
the page remains usable, but this weakens current-state clarity in the exact
25-piece target workflow.

### RFV-03 — Medium — Invalid custom-fragment input has no error or status

Entering whitespace in “New reusable fragment” and activating “Save and
select” does nothing: the editor stays open, there is no alert/live message,
and the user is not told how to recover. The same live control also renders
“Save and select” and “Cancel” at 38px high, below the required 44px touch
target. Valid text works immediately afterward.

### RFV-04 — Medium — Production caching misses the immutable-asset contract

Hashed JS/CSS and static fonts all return `public, must-revalidate, max-age=30`
instead of long-lived immutable caching. The service worker mitigates repeat
loads after control, but first-load and non-controlled browser caching still
revalidates immutable files every 30 seconds.

### RFV-05 — Low — Sensitive local app lacks modern containment headers

Production sends useful baseline headers but no Content-Security-Policy or
Permissions-Policy. A restrictive policy would materially limit exfiltration
impact if a future client-side injection is introduced in this student-data
application.

## Release decision

Do not mark this candidate PASS until RFV-01 is enabled and retested through a
real hosted checkout redirect. RFV-02 through RFV-04 should also be corrected
before claiming the full mobile/design/performance contract.
