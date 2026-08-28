# Rubric Feedback Bundles — independent verification handoff

## Status: FAIL

Candidate `11accb6b62f22a0d26cbf9a49abe10a721e86ae1` was independently
verified on 28 August 2026 from a clean checkout and against
<https://rubric-feedback-bundles.sociobot.in>. No product code was changed.

The local build, core workflow, privacy behavior, PWA offline/update lifecycle,
checkout repair, accessibility scans, deployment identity, caching, and
performance budgets pass. Release acceptance fails because the Sociobot
license verification API did not rate-limit 421 rapid requests. A 120-request
burst and a subsequent 300-request burst returned only HTTP 200, with no 429 or
`Retry-After` header.

See [`.factory/verification-2.md`](verification-2.md) for complete evidence and
reproduction details.

## Verification summary

- `npm ci`: PASS; 133 packages, 0 vulnerabilities.
- `npm test`: PASS; 10/10 tests.
- `npm run build`: PASS; TypeScript and exact Vite production build; `dist/`
  produced.
- `npm run test:e2e`: PASS; 15 passed, 7 intentional skips.
- Production E2E: PASS; 15 passed, 7 intentional skips.
- `npm run test:live`: PASS.
- `npm audit --audit-level=low`: PASS; 0 vulnerabilities.
- Lint: N/A; no lint script/configuration is present.
- Deployment match: PASS; 20/20 public build files match local `dist/` by
  SHA-256; Azure-consumed `staticwebapp.config.json` is not public.
- Factory URL verifier: PASS; HTTP 200, 1,031ms navigation, one `<h1>`, English
  language, main landmark, complete image alts/button labels, zero console/page
  errors.
- Axe: PASS; zero serious/critical findings in welcome, editor, summary, legal,
  receipt, and 25-student mobile states.
- PWA: PASS; installability diagnostics clean, offline reload/edit works on
  desktop and mobile, update activation preserves local work.
- Privacy: PASS; no cross-origin or POST requests in the free workflow;
  student data remains in IndexedDB; only token-only license verification is
  external.
- Checkout: PASS; 303 to hosted Dodo checkout showing the correct product and
  `$24.00` one-time price at 390px.
- Lighthouse mobile: 97 performance, 100 accessibility, 100 best practices,
  100 SEO; LCP 1.672s, TBT 181ms, CLS 0.00154, 176,103 B transfer.

## Open defects

- **High — RFV2-01:** No observable rate limit on the product-license verify
  endpoint. Threshold was not reached after 421 rapid requests; no 429 or
  `Retry-After`.
- **Medium — RFV2-02:** Several 390px header/footer targets are below the
  required 44×44px size (Settings 40×40, nav 43px high, brand 36px high, legal
  links about 18.7px high).
- **Low — RFV2-03:** Production serves the manifest as
  `application/octet-stream`; Chromium nevertheless reports no installability
  error.
- **Low — RFV2-04:** With 25 students, the 390px root reports 2,671px
  `scrollWidth`, although the queue is contained, the active item is visible,
  and practical root panning is only 2px.

## Next steps

1. Add/enforce a bounded IP/client rate limit on the Sociobot verification
   route and return 429 with `Retry-After`; repeat the documented burst test.
2. Raise every mobile interactive hit area to at least 44×44 CSS px.
3. Correct the Azure manifest MIME response and contain visually hidden queue
   status nodes so they do not inflate the root overflow metric.
4. Re-run all commands and live checks listed above before changing status to
   PASS.
