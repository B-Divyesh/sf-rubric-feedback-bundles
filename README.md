# Rubric Feedback Bundles

Rubric Feedback Bundles helps writing teachers give personal feedback on many
short submissions. Select reusable rubric fragments, tailor them for one
student, add a personal note, and download a feedback page.

Live: <https://rubric-feedback-bundles.sociobot.in>

Try the isolated sample first: <https://rubric-feedback-bundles.sociobot.in/demo>.
It opens a filled Grade 9 flash-fiction bundle. The demo uses its own browser
database, so it never reads or writes real classroom data.

## What it does

- Stores assignments, student work, rubric fragments, and progress in local
  IndexedDB. No account or AI service is needed.
- Exports student HTML feedback pages, an anonymized class pattern summary,
  and a complete JSON backup that can be imported later.
- Provides an installable app shell and reloads the workspace offline after the
  first visit.
- Offers an optional $24 one-time Plus license for unlimited bundles and CSV
  class summaries. Checkout and verification use the Sociobot billing service.

The free edition supports one complete bundle and never gates accessible
student exports, backups, or privacy controls.

## Develop and verify

Requires Node.js 20 or newer.

```sh
npm ci
npm run dev
npm test
npm run build
npm run test:e2e
npm run test:claims
npm run test:live
```

`npm run build` is the deployment command. It writes the static app, legal
pages, manifest, icons, and generated service worker to `dist/`, with
`dist/index.html` at the root. The E2E suite is pinned to Playwright 1.58.2 and
uses the preinstalled Chromium browser in the factory worker.

`npm run test:live` checks the deployed identity, legal routes, containment
headers, immutable asset policy, service-worker revalidation, and the hosted
Sociobot checkout redirect. Set `PRODUCT_ORIGIN` to verify another deployment.

`.factory/claims.json` lists every public product claim and its isolated
browser check. `npm run test:claims` runs all of them from the demo entry
point; each listed command can also run alone after `npm ci`.

Set `VITE_BILLING_BASE` at build time only when testing against a different
Sociobot environment. Production defaults to `https://api.sociobot.in/api/v1`.
No product ID or payment-provider SDK is embedded.

## Privacy and data handling

Student data is stored only in the browser unless a teacher exports it. The
free workflow has no analytics, tracking, remote sync, CDN script, or LLM
integration. A Plus license token is sent only to the Sociobot verification
endpoint. See `/privacy/` and `/terms/` in the built app.

## Project notes

- [.factory/brief.json](.factory/brief.json) records product scope.
- [.factory/design.md](.factory/design.md) records the visual system and image
  provenance.
- [.factory/demo.md](.factory/demo.md) describes the sample sandbox and its
  separate storage namespace.
- [.factory/claims.json](.factory/claims.json) maps public promises to browser
  checks.
- [.factory/handoff.md](.factory/handoff.md) records verification results and
  operational notes.

Licensed under the MIT License.
