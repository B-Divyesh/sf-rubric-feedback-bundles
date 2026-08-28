# Independent product verification 2 — FAIL

**Tested candidate:** `11accb6b62f22a0d26cbf9a49abe10a721e86ae1`

**Tested URL:** <https://rubric-feedback-bundles.sociobot.in>

**Verification date:** 28 August 2026, 07:16–07:29 UTC

**Environment:** Node.js 22.23.2, npm 10.9.8, Chromium 145, Playwright 1.58.2, Lighthouse 12.8.2

## Verdict

**FAIL.** The candidate builds cleanly, the deployed artifact matches it, the
core teacher workflow works locally and live, the earlier checkout failure is
fixed, and offline/update/privacy/accessibility/performance checks pass.

Release acceptance still fails because the only server API used by the app,
the Sociobot product-license verification endpoint, did not rate-limit either
of two rapid bursts. All 120 requests in 1.025 seconds and all 300 requests in
2.275 seconds returned HTTP 200. No request returned 429 or `Retry-After`.
This directly fails the work-order requirement for server-side endpoints.

A medium-severity mobile target-size defect and two low-severity deployment or
layout defects are also recorded below. No product code was changed during
verification.

## Clean-checkout gates

Verification ran from a new detached checkout in `/tmp/rfb-qa-nrpODD`, checked
out exactly at the candidate commit. The source checkout was clean before
installation.

| Gate | Result | Evidence |
| --- | --- | --- |
| Locked install | PASS | `npm ci`: 133 packages installed; 0 vulnerabilities |
| Unit/integration tests | PASS | `npm test`: 4 files, 10/10 tests passed |
| Type check + production build | PASS | `npm run build`: `tsc --noEmit && vite build`; `dist/` produced |
| Repository E2E, local preview | PASS | `npm run test:e2e`: 15 passed, 7 intentional product/device skips |
| Repository E2E, production | PASS | `PRODUCT_ORIGIN=https://rubric-feedback-bundles.sociobot.in npx playwright test`: 15 passed, 7 intentional skips |
| Live contract script | PASS | `npm run test:live`: identity, legal pages, headers, caching, service worker, and checkout passed |
| Dependency audit | PASS | `npm audit --audit-level=low`: 0 vulnerabilities |
| Lint | N/A | No lint script or lint configuration exists; strict TypeScript checking is part of the build |
| Package consumer test | N/A | Browser PWA, not a published library or CLI |

## Deployment identity and response policy

- All 20 publicly served files from local `dist/` matched production
  byte-for-byte by SHA-256. `staticwebapp.config.json` was the only excluded
  build file because Azure consumes it instead of serving it.
- `/`, `/privacy/`, `/terms/`, `/offline.html`, the manifest, service worker,
  fonts, icons, image assets, and hashed application chunks returned HTTP 200.
- The factory URL verifier measured a 1,031ms navigation, one `<h1>`,
  `lang="en"`, a main landmark, no missing image alt text, no unlabeled
  buttons, and zero console/page errors.
- Root and subresources send restrictive CSP, Permissions-Policy, HSTS,
  `nosniff`, DENY framing, and strict-origin referrer policy. CSP permits only
  this origin plus `https://api.sociobot.in` for connections.
- Hashed JS/CSS and fonts return
  `Cache-Control: public, max-age=31536000, immutable`; `/sw.js` returns
  `Cache-Control: no-cache`; HTML returns 30-second revalidation.
- The manifest still returns `application/octet-stream`, despite the deployment
  file requesting `application/manifest+json`; see RFV2-03.

## End-to-end product coverage

The following were exercised independently in addition to the repository's
tests, on both the clean local build and the matching live deployment where
applicable:

- Rejected a whitespace-only assignment title with a bound alert, then
  recovered and created a bundle.
- Verified missing student name, missing rubric feedback, and missing personal
  note each block finish/export and move focus to the relevant recovery field.
- Selected and tailored a reusable rubric fragment, entered private submission
  text, added a personal note, finished with `Ctrl+Enter`, downloaded the
  student receipt, reloaded, and confirmed IndexedDB persistence.
- Confirmed the personal-note boundary truncates 601 typed characters to the
  declared 600-character maximum and displays `600/600`.
- Used HTML/script-like strings in assignment, student, tailored feedback, and
  note values. The receipt escaped them, had `lang="en"`, one `<h1>`, and a
  `<main>`, and omitted the private submission. Its axe scan had zero
  serious/critical findings.
- Confirmed the class summary contains the canonical reusable pattern/count,
  but not student names, submissions, or student-specific tailored wording.
- Added 25 students at 390×844. The selected 25th student settles fully inside
  the queue, remains editable, and core actions remain visible.
- Tested blank custom-fragment submission and recovery. Its alert,
  `aria-invalid`, focus return, valid retry, and 44px action heights pass.
- Tested `Alt+ArrowLeft`/`Alt+ArrowRight`, keyboard form submission, the visible
  3px focus treatment, cancel/confirm student deletion, and cancel/confirm
  bundle deletion.
- Downloaded a JSON backup and confirmed it contains the explicitly disclosed
  private data. A structurally invalid backup reported “Nothing was imported”
  and left existing data intact.
- Confirmed the genuinely useful free tier allows a complete bundle and all
  student/backup exports while preventing a second saved bundle.
- The production checkout endpoint returns 303 to
  `checkout.dodopayments.com`. At 390px, the hosted page has no horizontal
  overflow and displays “Rubric Feedback Bundles Plus,” `$24.00`, and the
  one-time unlimited-bundles/CSV description. No purchase was completed.
- An actual invalid license return was stripped from the app URL, stored under
  `sb_license:rubric-feedback-bundles`, verified once against the Sociobot API,
  and resulted in “License no longer active.” A valid response path is covered
  by the repository's network-stubbed test; no real paid token was available.

## Privacy and outbound requests

- The complete free workflow made no cross-origin requests and no POST
  requests. Source inspection found no analytics, tracking, LLM, sync,
  third-party script, or CDN-font integration.
- Classroom data was stored in the `rubric-feedback-bundles` IndexedDB.
  `localStorage` remained empty in the free workflow and is used only for the
  optional license token and cached verdict.
- With a license present, the only cross-origin browser request was a GET to
  the documented Sociobot verification URL containing the license token only.
  The response used `Cache-Control: no-store`.
- CORS returned `Access-Control-Allow-Origin` for the product origin and did
  not return it for `https://evil.example` or `Origin: null`.
- Sign-in/Entra validation is N/A: the product has no account or sign-in flow.

## Accessibility, mobile, and motion

- Axe Playwright scans of welcome, editor, summary, legal, exported-receipt,
  and 25-student mobile states found zero serious or critical violations.
- Title, language, landmarks, heading count, form labels, validation alerts,
  native controls, escape-safe output, and keyboard shortcuts passed.
- `prefers-reduced-motion: reduce` is honored; measured transition duration was
  at most 0.001 seconds. There are no ambient loops or flashing content.
- Desktop and 390×844 visual inspection showed the product-specific paper,
  rubric, and ink system described in `.factory/design.md`; the welcome image
  is original and its provenance is documented.
- Several mobile links remain below the contract's 44×44 CSS-pixel target; see
  RFV2-02. At the 25-student state the root reports a pathological scroll width
  despite the queue itself being correctly contained; see RFV2-04.

## PWA and offline behavior

- CDP parsed the manifest with no manifest or installability errors. It
  contains the required name/short name, standalone display, versioned start
  URL, 192px/512px icons, and maskable icon.
- The production service worker controlled the page and used versioned cache
  `feedback-bundles-03d9713fb3`.
- On desktop and 390px mobile, a saved workspace reloaded offline, retained its
  IndexedDB data, displayed the offline state, and accepted further edits.
- A query-distinct service worker reached waiting state, displayed “An update
  is ready,” activated through “Update now,” changed the controller, reloaded,
  and preserved the bundle.
- The precache contains the application shell, legal pages, fonts, icons,
  artwork, offline page, manifest, robots, and sitemap, and excludes deployment
  metadata.

## Performance and budgets

Production output is within every static/PWA budget:

| Asset class | Measured | Budget | Result |
| --- | ---: | ---: | --- |
| Initial JS (`app` + shared module) | 146,218 B | 200 KB | PASS |
| All built JS, including legal-only entry | 152,254 B | 200 KB | PASS |
| CSS | 25,099 B | 50 KB | PASS |
| Fonts | 100,752 B | 120 KB | PASS |
| Mobile artwork | 12,052 B | 300 KB | PASS |

Fresh Lighthouse 12.8.2 mobile results against production:

- Performance 97, accessibility 100, best practices 100, SEO 100.
- FCP 1.186s, LCP 1.672s, TBT 181ms, CLS 0.00154, speed index 1.236s.
- Total transfer 176,103 B across 10 requests. No field INP is available from
  this isolated lab run.

## API rate-limit evidence

Endpoint tested:
`GET https://api.sociobot.in/api/v1/products/rubric-feedback-bundles/verify?license=<unique-invalid-token>`

- Baseline response: HTTP 200,
  `{"expires_at":null,"reason":"invalid","valid":false}`,
  `Cache-Control: no-store`.
- Burst 1: 120 concurrent unique invalid-token requests in 1.025s; 120 HTTP
  200, 0 HTTP 429.
- Burst 2: 300 concurrent unique invalid-token requests in 2.275s; 300 HTTP
  200, 0 HTTP 429.
- Including the baseline probe, 421 rapid requests were accepted. No limiting
  threshold was observed and no `Retry-After` header could be recorded.

## Defects

### RFV2-01 — High — License verification API has no observable rate limit

The required rapid-request test never produced 429. A 120-request burst and a
subsequent 300-request burst both returned only HTTP 200. The observed
threshold is therefore **greater than 421 aggregate requests / not observed**,
and `Retry-After` is absent because the service never rejects the burst. This
is an external Sociobot billing-API/deployment defect rather than a repository
client-code defect, but it is explicitly part of this product's acceptance
contract.

### RFV2-02 — Medium — Several 390px mobile targets are below 44×44 CSS px

In the populated live editor at 390×844, the Settings control measured 40×40,
primary navigation links measured 43px high, the brand/home link measured 36px
high, and footer legal links measured about 18.7px high (`Privacy` was 44px
wide; `Terms` was 37px wide). The fragment checkboxes were excluded from this
finding because their enclosing labels provide larger hit areas. The repaired
custom-fragment buttons do meet 44px.

### RFV2-03 — Low — Manifest MIME override is not applied in production

`/manifest.webmanifest` returns `Content-Type: application/octet-stream`
instead of `application/manifest+json`, even though the checked-in Azure config
requests the latter. Chromium 145 still parsed the manifest and reported zero
manifest/installability errors, so this is not currently blocking installation.

### RFV2-04 — Low — The 25-student mobile document reports extreme root overflow

At 390px after adding 25 students, `document.documentElement.scrollWidth` was
2,671px for a 390px viewport. The cause is off-screen queue descendants,
including absolutely positioned `.sr-only` status text. The queue's selected
student settles fully in view after its smooth scroll, screenshots remain
visually contained, and an attempted 2,000px root pan moved only 2px, so impact
is limited; however, the document still fails a standard root-overflow metric.

## Release decision

Do not mark candidate `11accb6b62f22a0d26cbf9a49abe10a721e86ae1`
PASS until RFV2-01 is fixed and a bounded burst produces HTTP 429 with a valid
`Retry-After` header. RFV2-02 should also be corrected to satisfy the stated
mobile interaction contract. RFV2-03 and RFV2-04 are low-risk follow-ups.
