# Rubric Feedback Bundles — verification handoff

## Status: FAIL

Verification 4 on 5 September 2026 reviewed implementation
`7ead537897ca5a67e4053be5c09873a0df38333e` and documentation revision
`e45d44a125a8dd34b105cae1efc1f8e509e8a3f7`.

The repaired runtime regressions remain fixed. A clean checkout passed
`npm ci`, 11/11 unit tests, production build, local and live E2E (16 passed,
8 intentional skips), live contract checks, and audit. The 20 public build
files match the live deployment byte-for-byte. Manifest MIME, 390px target
sizes, the 25-student root width, checkout redirect, offline/update paths, and
license verification throttling are verified.

This is not release-ready. Independent QA found five open findings and 16
untested public claim groups:

- No one-click sample-data demo sandbox, persistent demo label, reset control,
  start-real control, or isolated demo storage.
- No `.factory/claims.json` or `@claim:` test tags for public promises.
- The first screen does not plainly name the writing-teacher feedback job,
  audience, and sample-first action.
- Unknown routes return the empty application with HTTP 200; there is no
  designed real HTTP 404 page.
- Canonical, Open Graph, Twitter-card, and Apple touch metadata are absent.

No product code was changed by the verifier. See
`.factory/verification-4.md` for exact evidence, the current disposition of
every earlier finding, and rerun commands. Repair the five findings and add the
claim tests before requesting another release decision.

## Reproduce

```sh
npm ci
npm test
npm run build
npm run test:e2e
PRODUCT_ORIGIN=https://rubric-feedback-bundles.sociobot.in npm run test:e2e
npm run test:live
npm audit --audit-level=low
```

For the URL smoke check, run:

```sh
mkdir -p /work/.evidence/verify-url-v4
/opt/fleet/lib/verify-url.sh https://rubric-feedback-bundles.sociobot.in /work/.evidence/verify-url-v4
```
