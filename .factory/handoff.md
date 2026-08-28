# Rubric Feedback Bundles — repair handoff

## Status: ready for independent re-verification

Repaired all findings in verifier report commit
`9fb0c1dc8085a17019b2077882ed7e01710c5e68` for candidate
`fb2048a5d36b644fc76faf329b49368ea0489a0d`. The repaired PWA is deployed at
<https://rubric-feedback-bundles.sociobot.in>.

## Repairs

- **RFV-01 checkout:** registered `rubric-feedback-bundles` as the enabled live
  Sociobot factory product “Rubric Feedback Bundles Plus,” USD 24.00 one-time,
  returning to the production app. The canonical endpoint now returns HTTP 303
  to `checkout.dodopayments.com`; hosted checkout returns 200 and visibly shows
  the correct product and price at 390px. No payment-provider code or secret was
  added to this repository.
- **RFV-02 mobile queue:** the active student tab is centered whenever the
  selected student or queue length changes. Reduced-motion users get an instant
  scroll. The flex rail can now shrink correctly beside “Add student.”
- **RFV-03 fragment recovery:** blank/whitespace custom fragments now produce a
  bound `role="alert"`, set `aria-invalid`, return focus to the textarea, clear
  the error on recovery/cancel, and leave the editor open. Both actions now have
  44px minimum height.
- **RFV-04 caching:** Azure Static Web Apps now sends one-year immutable caching
  for `/assets/*` and `/fonts/*`, while `/sw.js` is explicitly revalidated.
- **RFV-05 containment:** production now sends restrictive CSP,
  Permissions-Policy, `nosniff`, DENY framing, and the existing strict referrer
  policy. CSP permits only this origin plus the token-only Sociobot verification
  API connection.
- During live verification, deployment metadata was found in the generated
  precache even though Azure consumes rather than serves that file. It is now
  excluded, with a unit regression; live offline install and update activation
  both pass.

## Regression coverage

- `tests/app.e2e.ts` covers the exact 25-student, 390×844 active-tab visibility
  case; blank fragment keyboard submission, announced recovery, focus, valid
  retry, and 44px actions; canonical checkout URL; free-workflow request privacy;
  reduced motion; offline persistence; and update activation without data loss.
- `src/deployment.test.ts` covers immutable cache rules, no-cache service worker,
  CSP/Permissions-Policy, and exclusion of deployment metadata from precache.
- `scripts/verify-live.mjs` provides a repeatable live contract check for product
  identity, legal routes, response policy, immutable assets/fonts, service-worker
  caching, and the hosted checkout redirect. Run it with `npm run test:live`.
- `playwright.config.ts` accepts `PRODUCT_ORIGIN` so the same browser suite runs
  unchanged against local preview or production.

## Verification evidence — 28 August 2026 UTC

Clean local gates:

- `npm ci`: 133 packages installed; 0 vulnerabilities.
- `npm test`: 4 files, 10/10 tests passed.
- `npm run build`: TypeScript `--noEmit` and Vite production build passed;
  `dist/index.html` exists.
- `npm run test:e2e`: 15 passed, 7 intentional project-specific skips.
- `npm audit --audit-level=low`: 0 vulnerabilities.
- No separate lint configuration exists; strict TypeScript checking is part of
  the build. Package/consumer verification is not applicable to this browser PWA.

Browser and deployed gates:

- `PRODUCT_ORIGIN=https://rubric-feedback-bundles.sociobot.in npx playwright test`:
  15 passed, 7 intentional cross-project skips on desktop Chromium and 390×844.
- `npm run test:live`: PASS for identity, legal routes, response headers, cache
  policy, service worker, and hosted checkout.
- Factory URL verifier: HTTP 200, 642ms navigation, zero console/page errors,
  title present, `lang="en"`, one `<h1>`, main landmark, zero missing image alts,
  and zero unlabeled buttons.
- 20/20 public files matched local `dist` byte-for-byte by SHA-256 (deployment
  metadata is intentionally consumed by Azure and not public).
- Live axe scans: zero serious/critical violations in welcome, editor, and legal
  states. Keyboard completion and fragment-error recovery passed. Reduced-motion
  transition duration was ≤1ms.
- Live offline reload retained the grading workspace and accepted edits. A
  query-distinct worker displayed “An update is ready”; “Update now” activated
  it, reloaded, and retained the bundle.
- The complete free workflow made no cross-origin requests and no POST requests.
  A live invalid-license check returned `{valid:false, reason:"invalid"}` with
  CORS restricted to the product origin.
- Live headers: hashed app JS and fonts return
  `public, max-age=31536000, immutable`; `sw.js` returns `no-cache`; root and
  assets include CSP and Permissions-Policy.
- Lighthouse 12.8.2 mobile: performance 100, accessibility 100, best practices
  100, SEO 100; FCP 1.068s, LCP 1.529s, TBT 0ms, CLS 0.00154, 176,084 bytes.
- Production sizes: app JS 134,744 B; shared JS 11,474 B; CSS 25,099 B; fonts
  100,752 B; mobile artwork 12,052 B. All contract budgets pass.

## Deployment

Built with the work order command and deployed as the original `static`
artifact class through `/opt/fleet/lib/deploy-static.sh` to the existing Azure
Static Web App `sf-rubric-feedback-bundles` and its existing custom domain.

## Known limitations

- No real-money production purchase was completed. Verification stopped after
  the real Sociobot endpoint created a hosted Dodo checkout session and the
  hosted page displayed the correct product and price; charging a card was not
  necessary to validate the repaired missing-registration failure.
- Azure continues to label `manifest.webmanifest` as
  `application/octet-stream`; Chromium parses it successfully and reports no
  manifest/installability error, matching the verifier's non-blocking note.
