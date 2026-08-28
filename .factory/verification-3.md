# Independent verification 3 — Rubric Feedback Bundles

**Result: FAIL**

Verified on 28 August 2026 against candidate commit
`11accb6b62f22a0d26cbf9a49abe10a721e86ae1` from a detached clean checkout
at `/tmp/rubric-feedback-bundles-qa`, and against
<https://rubric-feedback-bundles.sociobot.in>. This report supersedes the
deployment-only API finding in `verification-2.md`: that endpoint now
rate-limits correctly. No product code was changed during this verification.

Release acceptance remains **FAIL** because the live 390px UI does not meet
the explicit 44 by 44 CSS-pixel touch-target requirement.

## Reproducible quality gates

| Check | Result | Evidence |
| --- | --- | --- |
| Clean install | PASS | `npm ci`: 133 packages installed; audit reported 0 vulnerabilities. |
| Unit/integration tests | PASS | `npm test`: 4 files, 10/10 Vitest tests passed. |
| Typecheck and exact production build | PASS | `npm run build` ran `tsc --noEmit` and Vite 7.3.6 successfully, producing `dist/`. |
| Repository lint | N/A | No lint script or lint configuration is present. |
| Local browser suite | PASS | `npm run test:e2e`: 15 passed, 7 documented project-specific skips. |
| Live browser suite | PASS | `PRODUCT_ORIGIN=https://rubric-feedback-bundles.sociobot.in npm run test:e2e`: 15 passed, 7 documented project-specific skips. |
| Live deployment verifier | PASS | `npm run test:live` passed identity, legal pages, CSP/permissions policy, immutable assets, worker cache policy, and hosted checkout redirect. |
| Dependency audit | PASS | `npm audit --audit-level=low`: 0 vulnerabilities. |

There is no library or CLI artifact, server-owned application endpoint, or
sign-in flow to pack, install, or test. The optional license endpoint is a
factory billing API and is covered below.

## Product and recovery exercise

The desktop and 390px Chromium workflows passed locally and live. They create
a bundle, enter a name and submission, reject an export with no selected
fragment, reject it again with no personal note, select and tailor a fragment,
finish with Ctrl+Enter, download `avery-feedback.html`, reload retained data,
and show an anonymized summary without tailored/student text. The suite also
checks blank custom-fragment validation and recovery, the one-time-license
return-token flow, backup import validation, checkout contract, and legal
pages.

At 390px, the 25-student queue eventually scrolls the active 25th student into
view. Fresh measurement after settling: active tab 203–314px within the queue
12–314px. The browser reports a 2,671px document `scrollWidth`, but setting
root horizontal scroll to its maximum leaves `scrollLeft` at 0; this is a DOM
overflow diagnostic rather than practical root panning.

Keyboard smoke testing at 390px reached the skip link, brand, Settings, and
both welcome inputs with Tab. Each showed the designed `rgb(185, 69, 53)` 3px
focus outline. The required visible focus state is therefore present.

`prefers-reduced-motion: reduce` is covered by the live suite and reduces
transition duration to at most 0.001 seconds. Offline reload/edit and the
in-app service-worker update activation both passed live; the update test
preserved local work. These exercise the required PWA lifecycle rather than
only checking its files.

## Accessibility and mobile evidence

`@axe-core/playwright` reported zero serious or critical findings on the live
welcome, editor, class summary, bundles, settings, privacy, and terms views,
at both the suite's desktop/mobile coverage and a separate 390px smoke pass.
The app has a language declaration, title, one h1 per page, main landmark,
skip link, labels, semantic legal pages, and no console or page errors in the
normal live workflow.

### RFV3-01 — Medium: 390px tap targets violate the 44px minimum

Fresh browser geometry from the live site found these interactive targets
below 44px in at least one dimension:

- Brand/home link: 175 by 36px.
- Settings icon link: 40 by 40px.
- Primary navigation links: 43px high.
- Terms and privacy links in the legal line: 15px high.
- Footer Privacy/Terms links: 18.7px high (Terms is also 37px wide).

This violates the explicit mobile/touch acceptance requirement in the work
order. It is a usability/accessibility defect even though axe does not flag
it. Increase the interactive hit areas to at least 44 by 44px without hiding
the focus indication, then rerun the 390px geometry check.

### RFV3-02 — Low: manifest response uses the wrong MIME type

`HEAD /manifest.webmanifest` returns `content-type: application/octet-stream`
on the live Azure deployment, despite the committed configuration requesting
`application/manifest+json; charset=utf-8`. Chromium emitted no
installability diagnostic and the PWA lifecycle passed, but the deployment
should serve the registered manifest with its intended MIME type.

### RFV3-03 — Low: diagnostic 390px document overflow with a long queue

With 25 named students, `document.documentElement.scrollWidth` is 2,671px for
a 390px viewport. Root scrolling remains clamped to 0 and the active queue
tab is visible, so there is no observed user-facing horizontal pan. Contain
the source of the reported DOM overflow to keep layout metrics truthful.

## Privacy, security, deployment, and rate-limit evidence

- The free normal workflow emitted no cross-origin requests and no POST
  requests. Student/bundle data was present in IndexedDB; no submissions were
  sent to an LLM, analytics service, or account service. The only designed
  external path is the token-only Sociobot license verification/checkout flow.
- No sign-in exists, so no identity provider (including Entra) is used.
- Root response policy: HSTS, `X-Content-Type-Options: nosniff`, `X-Frame-
  Options: DENY`, strict-origin referrer policy, restrictive CSP (including
  `connect-src 'self' https://api.sociobot.in`), and disabled
  camera/microphone/geolocation/payment/USB permissions.
- Caching: hashed assets and self-hosted fonts are immutable for one year;
  `sw.js` is `no-cache`; HTML is short-lived revalidating cache. The manifest
  is currently one-hour cacheable (and has the MIME defect above).
- Deployment identity: SHA-256 comparison of all 20 publicly served files
  from `dist/` found 20/20 exact matches. The 21st local build file,
  `staticwebapp.config.json`, is Azure deployment metadata and correctly is
  not served publicly (404).
- Rate limiting: a fresh 240-request burst at concurrency 40 to
  `GET https://api.sociobot.in/api/v1/products/rubric-feedback-bundles/verify?license=...`
  received 32 HTTP 200 and 208 HTTP 429 responses. Every throttled response
  had `Retry-After` (first captured value `3`) and `x-ratelimit-after: 3`.
  This demonstrates the required burst boundary (429 began within the burst,
  after at most 32 successes), replacing RFV2-01. A later paced ten-request
  sequence all returned 200, consistent with a short-window limiter.

## Performance and bundles

The exact build produces a 134,744-byte application JS entry and 25,099-byte
CSS entry; the two self-hosted fonts total 98,090 bytes. These are within the
200KB JS, 50KB CSS, and 120KB font budgets. The 768px illustration is 12,052
bytes and the 1280px source is 49,834 bytes.

Fresh Lighthouse mobile against the live URL: **99 performance, 100
accessibility, 100 best practices, 100 SEO**; LCP 1,661ms, TBT 112ms, CLS 0,
and 176,178 bytes transferred. A desktop control run scored 100 in all four
categories (LCP 450ms, TBT 3ms, CLS 0.00050).

## Required disposition

Do not release this candidate as PASS until RFV3-01 is repaired and rechecked
at 390px. RFV2-01 is verified fixed in deployment. RFV3-02 and RFV3-03 should
also be addressed before the next release.
