# Rubric Feedback Bundles

Rubric Feedback Bundles is a private, offline-capable workspace for writing
teachers who need to respond to many short submissions without reducing their
feedback to boilerplate. Teachers select fragments from an editable rubric,
tailor them for the current piece, add a required personal note, and export an
accessible feedback page that a student can keep.

Live: <https://rubric-feedback-bundles.sociobot.in>

## What it does

- Keeps assignments, student work, reusable fragments, and progress in local
  IndexedDB—no account or AI service involved.
- Provides a focused student queue with editable criterion feedback and a
  required personal note.
- Exports standalone, print-friendly student HTML pages and a name-free class
  pattern summary.
- Exports and imports a full JSON backup so teachers own their data.
- Installs as a PWA and reloads the complete grading workspace offline.
- Offers an optional $24 one-time Plus license for unlimited bundles and CSV
  class summaries. Checkout and verification use only the Sociobot billing API.

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
```

`npm run build` is the deployment command. It writes the static app, legal
pages, manifest, icons, and generated service worker to `dist/`, with
`dist/index.html` at the root. The E2E suite is pinned to Playwright 1.58.2 and
uses the preinstalled Chromium browser in the factory worker.

Set `VITE_BILLING_BASE` at build time only when testing against a different
Sociobot environment. Production defaults to `https://api.sociobot.in/api/v1`.
No product ID or payment-provider SDK is embedded.

## Privacy and data handling

Student data is stored only in the browser unless a teacher exports it. There
is no analytics, tracking, remote sync, CDN script, or LLM integration. A Plus
license token is kept in localStorage and sent only to the Sociobot verification
endpoint. See `/privacy/` and `/terms/` in the built app.

## Project notes

- [.factory/brief.json](.factory/brief.json) records product scope.
- [.factory/design.md](.factory/design.md) records the visual system and image
  provenance.
- [.factory/handoff.md](.factory/handoff.md) records verification results and
  operational notes.

Licensed under the MIT License.
