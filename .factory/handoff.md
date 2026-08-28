# Rubric Feedback Bundles — repair handoff

## Status: repaired and deployed

The release-blocking findings in independent verifier report commit
`5e74eb2a449ce36cf1139aa6a1e845280f32f286`, tested against candidate
`11accb6b62f22a0d26cbf9a49abe10a721e86ae1`, are repaired. Product code and
regressions were committed as `7ead537` and deployed on 28 August 2026 to
<https://rubric-feedback-bundles.sociobot.in> with Azure deployment ID
`2260ea41-e1c6-4868-9407-cfec346200c5`.

## Finding disposition

- **RFV3-01 — fixed:** all reported interactive targets now provide at least
  44 by 44 CSS pixels at 390px. Live measurements are brand 175×44, Settings
  44×44, primary navigation 109.5–115×44, footer Privacy/Terms 44×44, purchase
  terms 44×44, and purchase privacy policy 83×44. The 3px coral focus outline
  remains visible.
- **RFV3-02 — fixed:** Azure Static Web Apps now maps `.webmanifest` through
  `mimeTypes`. Live `HEAD /manifest.webmanifest` returns
  `Content-Type: application/manifest+json` and the intended one-hour cache
  policy. The live verifier now asserts this response.
- **RFV3-03 — fixed:** each visually hidden student status is positioned
  relative to its own queue tab instead of the page. With 25 students at
  390px, both root and body `scrollWidth` are 390px while the independently
  scrollable queue remains 2,760px wide. The active 25th tab stays visible.

Exact regression coverage was added to `tests/app.e2e.ts` for every reported
390px target and the settled 25-student root width. `src/deployment.test.ts`
and `scripts/verify-live.mjs` cover the manifest mapping in source and on the
deployed response.

## Verification evidence

Run from `/work/repo` against the committed source and deployed site:

- `npm ci` — 133 packages installed; 0 vulnerabilities.
- `npm test` — 4 files, 11/11 Vitest tests passed.
- `npm run build` — strict TypeScript check and Vite 7.3.6 build passed;
  `dist/index.html` exists.
- `npm run test:e2e` — 16 passed, 8 intentional project/device skips across
  desktop Chromium and 390×844 Chromium.
- `PRODUCT_ORIGIN=https://rubric-feedback-bundles.sociobot.in npm run test:e2e`
  — 16 passed, 8 intentional project/device skips.
- `npm run test:live` — identity, legal routes, CSP and permissions policy,
  immutable assets, service-worker cache policy, manifest MIME, and hosted
  checkout passed.
- `/opt/fleet/lib/verify-url.sh` — HTTP 200 in 653ms; title and `lang` present;
  one h1; main landmark; 0 missing image alt attributes; 0 unlabeled buttons;
  0 console/page errors.
- SHA-256 deployment comparison — 20/20 publicly served build files exactly
  match `dist/`. Azure-consumed `staticwebapp.config.json` is correctly not a
  public asset.
- Axe Playwright settled-state matrix — 0 serious/critical findings on welcome,
  editor, class summary, bundle library, settings, privacy, and terms at both
  desktop and 390px.
- Keyboard smoke at 390px — Tab reached skip link, brand, Settings, assignment,
  and class fields. Targets measured 44–48px high with the designed
  `3px solid rgb(185, 69, 53)` focus outline and no trap.
- Offline/update — the local and live suites reloaded a saved workspace
  offline, accepted another local edit, activated a waiting service worker,
  and retained the bundle.
- Privacy — the complete free workflow produced no cross-origin request and no
  POST. Student data remained in IndexedDB. The only optional external request
  is the token-only Sociobot license verification call.
- License response policy — an 80-request concurrent verification probe
  returned 30 HTTP 200 and 50 HTTP 429 responses; throttled responses included
  `Retry-After: 4` and `x-ratelimit-after: 4`.
- `npm audit --audit-level=low` — 0 vulnerabilities.
- Lighthouse 12.8.2 mobile — performance 100, accessibility 100, best practices
  100, SEO 100; FCP 1,067ms, LCP 1,667ms, TBT 56ms, CLS 0.00159, transfer
  173,482 bytes.
- Production budgets — app JS 134,744 bytes, CSS 25,351 bytes, fonts 100,752
  bytes total, and mobile artwork 12,052 bytes.

There is no separate lint configuration; `npm run build` performs the strict
TypeScript gate. Package/consumer and sign-in tests are not applicable to this
static, account-free PWA.

## Deploy and verify

```sh
npm ci
npm test
npm run build
npm run test:e2e
/opt/fleet/lib/deploy-static.sh rubric-feedback-bundles /work/repo/dist
PRODUCT_ORIGIN=https://rubric-feedback-bundles.sociobot.in npm run test:e2e
npm run test:live
```

## Known gaps and next steps

No release-blocking product-QA gaps remain from verification 3. The original
local-first workflow, offline/update behavior, privacy boundary, exports,
licensed upgrade path, visual system, and static PWA deployment class are
unchanged.
