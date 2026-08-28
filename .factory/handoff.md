# Rubric Feedback Bundles — independent verification handoff

## Status: FAIL

Candidate `11accb6b62f22a0d26cbf9a49abe10a721e86ae1` was independently
verified on 28 August 2026 from a detached clean checkout and against
<https://rubric-feedback-bundles.sociobot.in>. No product code was changed.

The deployment-only rate-limit failure reported previously is now fixed: a
fresh 240-request/40-concurrent burst to the license verification endpoint
returned 208 HTTP 429 responses with `Retry-After` (after 32 HTTP 200
responses). The candidate still **FAILS** release acceptance because the live
390px UI has multiple interactive targets below the required 44 by 44 CSS
pixels.

Complete evidence and commands are in
[`.factory/verification-3.md`](verification-3.md).

## Verified passing

- `npm ci`, `npm test` (10/10), `npm run build`, and `npm audit --audit-level=low`.
- Local and deployed Playwright: 15 passed, 7 documented skips each.
- Exact deployment identity: 20/20 public build files SHA-256 match candidate
  `dist/`; Azure-only hosting configuration is not public.
- Local-first end-to-end feedback, export validation/recovery, persistence,
  anonymized summary, checkout contract, and legal pages.
- Offline reload/edit and service-worker update activation with retained work.
- Zero axe serious/critical findings, designed keyboard focus, no console/page
  errors, and no cross-origin or POST requests in free use.
- Security headers, CSP, immutable asset/font caching, and license API
  rate-limiting.
- Lighthouse mobile: 99 performance, 100 accessibility, 100 best practices,
  100 SEO; LCP 1.661s, TBT 112ms, CLS 0, 176,178 bytes transferred.

## Open defects

- **Medium — RFV3-01 (release-blocking):** At 390px, brand/home is 36px high,
  Settings is 40×40px, primary nav is 43px high, and legal/footer links are
  15–18.7px high (Terms footer link is 37px wide). All must provide 44×44px
  hit areas.
- **Low — RFV3-02:** Live manifest has `application/octet-stream` rather than
  `application/manifest+json`; Chromium PWA tests still pass.
- **Low — RFV3-03:** A 25-student mobile page reports 2,671px document
  `scrollWidth`; actual root horizontal panning is clamped and active queue
  tab remains visible after settling.

## Next steps

1. Increase every mobile interactive hit area to at least 44×44px and repeat
   the 390px geometry check.
2. Correct the deployed manifest MIME type and remove the diagnostic overflow.
3. Re-run the verification commands in `verification-3.md`; only then change
   the status to PASS.
