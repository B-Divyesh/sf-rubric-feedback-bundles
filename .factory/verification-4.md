# Verify rubric feedback bundles

**Verdict: FAIL**

**Live URL:** <https://rubric-feedback-bundles.sociobot.in>
**Implementation reviewed:** `7ead537897ca5a67e4053be5c09873a0df38333e`
**Documentation/report revision:** `e45d44a125a8dd34b105cae1efc1f8e509e8a3f7`
**Verification date:** 5 September 2026 (UTC)

The repaired implementation is sound on its tested teacher workflow, but this
is not a release PASS. There are five findings, including two high-severity
contract failures, and 16 untested public-claim groups. No product code was
changed during this verification.

## Scope and first screen

The job is to help writing teachers give specific feedback on many short
submissions without retyping generic rubric comments. The audience is writing
teachers handling many short submissions. The required first action is **Try it
with sample data**, so a teacher can see a finished, realistic feedback bundle
without entering classroom data.

I opened fresh desktop Chromium and a fresh 390 by 844 touch context before
scrolling. The live page instead showed the product-name h1, the heading
“Reuse the repeated part. Keep the human part.”, two empty fields, and “Create
feedback bundle.” It has no sample-data action. `/?demo=1`, `/demo`, and
`/demo/` each returned the same empty application rather than a demo state.

## Clean-checkout gates

A detached clean checkout at documentation revision `e45d44a` was installed
and built independently. Its production output is byte-identical to live.

| Check | Result | Evidence |
| --- | --- | --- |
| Locked install | PASS | `npm ci`: 133 packages installed; 0 vulnerabilities. |
| Unit tests | PASS | `npm test`: 4 files, 11/11 tests passed. |
| Production build | PASS | `npm run build`: strict TypeScript check and Vite build passed; `dist/index.html` exists. |
| Local E2E | PASS | `npm run test:e2e`: 16 passed, 8 intentional device/project skips. |
| Live E2E | PASS | `PRODUCT_ORIGIN=https://rubric-feedback-bundles.sociobot.in npm run test:e2e`: 16 passed, 8 intentional device/project skips. |
| Live deployment contract | PASS | `npm run test:live` passed identity, legal routes, security/cache policy, manifest MIME, worker policy, and checkout redirect. |
| URL/accessibility smoke | PASS | `/opt/fleet/lib/verify-url.sh` reported HTTP 200 in 904 ms, title, `lang=en`, one h1, main landmark, no missing image alt, no unlabeled buttons, and no console/page errors. |
| Dependency audit | PASS | `npm audit --audit-level=low`: 0 vulnerabilities. |
| Deployment identity | PASS | SHA-256 comparison: 20/20 public `dist` files match live exactly. `staticwebapp.config.json` is deployment metadata, not a public file. |
| Library/CLI consumer check | N/A | This is a browser PWA, not a package, CLI, or desktop artifact. |

The Playwright axe integration reported no serious or critical issues in the
welcome/editor states at desktop and 390px and on the legal pages. The live
E2E suite also passed keyboard validation/recovery, reduced motion, offline
reload and local edit, service-worker update preservation, touch-target
measurements, and the 25-student 390px queue-width check.

## Product-path evidence

The normal and recovery paths exercised by the live suite pass: blank
assignment recovery; missing rubric-feedback and personal-note validation;
tailored fragment selection; Ctrl+Enter completion; accessible feedback-page
download; reload persistence; blank custom-fragment recovery; backup validation;
license-return handling; legal pages; and the free/Plus boundary. The receipt
escapes user content and omits the private submission; the class summary keeps
the canonical feedback pattern but omits student-specific wording.

The earlier findings are currently disposed as follows:

| Earlier finding | Current disposition |
| --- | --- |
| RFV-01 checkout unavailable | Fixed: the live contract test received the hosted checkout redirect. |
| RFV-02 active 25th student hidden | Fixed: the live 390px queue test passes. |
| RFV-03 custom-fragment invalid state and action size | Fixed: error, focus return, retry, and 44px actions pass. |
| RFV-04 immutable caching | Fixed: live hashed asset and font cache assertions pass. |
| RFV-05 containment headers | Fixed: live CSP and Permissions-Policy assertions pass. |
| RFV2-01 license verification rate limit | Fixed: a new 80-request invalid-license burst returned 30 HTTP 200 and 50 HTTP 429 responses; each 429 carried `Retry-After: 4`. |
| RFV2-02 / RFV3-01 mobile targets | Fixed: the live 390px target test passes. |
| RFV2-03 / RFV3-02 manifest MIME | Fixed: `HEAD /manifest.webmanifest` returns `application/manifest+json`. |
| RFV2-04 / RFV3-03 25-student root width | Fixed: the live E2E assertion observes exactly 390px document width. |

Normal free-workflow requests remained same-origin in the live E2E privacy
test, with no POST requests. The product is static, so tenant isolation,
restart persistence, and product-owned health checks are not applicable. The
only exercised server endpoint is the optional factory billing verification
endpoint; its rate limit and Retry-After behavior passed above.

## Findings

### RFV4-01 — High — No one-click demo sandbox exists

The page has no “Try it with sample data” action. Searches of the candidate
found no demo route, sample state, demo storage namespace, persistent
“Demo — sample data, nothing is saved” label, Reset demo action, or Start for
real action. Direct demo URLs load the empty real-data welcome view. Therefore
the required realistic sample, reset behavior, and proof that a demo cannot
alter real data could not be exercised.

This blocks the required try-before-entering-classroom-data path.

### RFV4-02 — High — Claims registry and claim tests are absent

`.factory/claims.json` does not exist, and a repository search found no
`@claim:` test tags. Consequently there were no declared claim commands to run
from the clean checkout. Existing unit and E2E tests are useful regression
coverage, but they do not meet the required one-entry/one-observable-test
claim contract.

I counted 16 distinct public claim groups in the landing page, README, and
privacy copy that have no registry entry or mapped claim test: reusable
fragment/personal-note feedback; student-page export; local IndexedDB storage;
no account; no AI access to student work; anonymized summary; JSON backup and
import; PWA install; offline reload; one-time $24 Plus; unlimited bundles/CSV;
Sociobot-only billing; one-free-bundle limit; core exports/privacy not gated;
no analytics/tracking/remote sync/CDN; and license-token-only verification.

**Untested public-claim count: 16.**

### RFV4-03 — Medium — The first screen does not state the job and audience in plain words

The only h1 is “Rubric Feedback Bundles,” not the user’s job. The prominent
heading is the metaphor “Reuse the repeated part. Keep the human part.” The
copy never names writing teachers on the first screen. Its first usable action
requires manually naming an assignment instead of the required one-click
sample. A cold visitor can infer parts of the purpose from the paragraph, but
the first screen does not meet the job/audience/first-action plain-words
contract.

### RFV4-04 — Medium — Unknown routes do not return a designed HTTP 404 page

`/not-a-real-route` and `/404` both return HTTP 200 and the empty application
shell. There is no `404.html` in `dist` and no Static Web Apps 404 response
override. This is neither an intentional HTTP 404 page nor a useful recovery
view, and it makes broken links indistinguishable from the real welcome page.

### RFV4-05 — Low — Required route metadata is incomplete

The live, byte-matched HTML lacks a canonical link, Open Graph metadata,
Twitter-card metadata, and an Apple touch icon. Privacy and Terms do have
route-specific titles, language, descriptions, one h1, and main landmarks, but
the required shared metadata set is incomplete.

## Other checks

- `/`, `/privacy/`, `/terms/`, `/offline.html`, manifest, service worker,
  robots, and sitemap returned expected 200 responses. The real internal links
  found on the public pages also returned 200; `mailto:` links were treated as
  explicit non-HTTP links.
- The manifest MIME repair is live. The PWA offline/update E2E paths pass.
- The live checkout is reachable, and no payment was attempted.
- No backend, account, or CLI/desktop surface exists beyond the optional
  billing endpoint; those inapplicable checks are not counted as untested
  product claims.

## Required decision

**FAIL — 5 findings and 16 untested public claims.**

Do not declare this product PASS until the demo sandbox, claims registry and
observable claim tests, first-screen plain wording, and designed HTTP 404 path
are added and verified. The metadata gap should be completed in the same
release.
