# Rubric Feedback Bundles — independent verification handoff

## Status: FAIL

Candidate `fb2048a5d36b644fc76faf329b49368ea0489a0d` was independently tested on
28 August 2026 at <https://rubric-feedback-bundles.sociobot.in>. The live site
now matches the candidate's production build exactly, resolving the previously
reported deployment-only uncertainty. Release acceptance still fails because
the production Plus checkout endpoint returns HTTP 404.

Full evidence and severity assignments are in
[verification.md](verification.md).

## What was verified

- Clean locked install, 7/7 unit/integration tests, TypeScript check and exact
  Vite production build, 9 passing Playwright E2E tests with 3 intended skips,
  dependency audit, and byte-for-byte live artifact identity.
- End-to-end feedback creation, validation, tailoring, personal-note boundary,
  keyboard finish/navigation, persistence, safe HTML receipt, anonymized class
  summary, student removal, JSON backup, and invalid atomic import recovery.
- 390×844 mobile with 25 students, desktop, reduced motion, visible keyboard
  focus, serious/critical axe scans, console/page errors, privacy traffic,
  response headers, cache policy, and bundle budgets.
- Manifest/installability, live controlled offline reload, offline persistence,
  and service-worker update toast/activation/reload.
- Fresh Lighthouse mobile: 96 performance, 100 accessibility, 100 best
  practices, 100 SEO; FCP 1.1s, LCP 1.7s, TBT 230ms, CLS 0.

## Blocking and notable defects

1. **High:** the shipped production checkout URL returns HTTP 404, so the $24
   one-time purchase cannot start. Factory billing registration/enablement is
   required, followed by a real checkout redirect test.
2. **Medium:** at 25 students on 390px mobile, the 25th active queue tab remains
   offscreen while the strip shows early inactive students.
3. **Medium:** whitespace-only custom fragments fail silently, and that form's
   two actions are 38px high rather than the required 44px.
4. **Medium:** hashed assets and fonts receive only 30-second revalidating cache
   headers instead of long-lived immutable caching.
5. **Low:** production has no CSP or Permissions-Policy.

## Reproduce the repository gates

```sh
npm ci
npm test
npm run build
npm run test:e2e
npm audit --audit-level=low
```

There is no separate lint task. `npm run build` includes `tsc --noEmit` and
writes `dist/`.

## Next steps

1. Enable/register `rubric-feedback-bundles` in the production Sociobot billing
   engine and verify that the checkout URL redirects into hosted checkout.
2. Keep the active student tab visible when the mobile queue changes.
3. Add announced whitespace validation and 44px targets to the custom-fragment
   actions.
4. Configure long-lived immutable caching for hashed assets and fonts; add a
   restrictive CSP and Permissions-Policy where deployment headers are managed.
5. Rerun the verification report, including a hosted checkout return and live
   license unlock. A real purchase was not attempted because checkout currently
   fails before redirect.

Only `.factory/verification.md` and this handoff were changed by verification;
product code and build configuration were not modified.
