# Architecture and runtime behavior

This document describes the implementation verified on `develop` before the planned `1.1.0` testing work. **Check the current code before relying on any status claim.** It records application behavior rather than information about an individual deployment.

## Runtime and pipeline

The application is a one-shot TypeScript CLI, built using `tsc` and executed on Node.js 20+ with NodeNext ESM. It can run manually or under an external scheduler. The repository includes `run-weekly-digest.sh` and `.github/workflows/weekly.yml`; deployment-specific scheduling is not part of the application contract.

`src/index.ts` calls `generateDigest()` in `src/digest.ts`:

1. Fetch Reddit, RSS/Atom and GitHub sources concurrently with `Promise.allSettled`. Failures in individual sources are logged and isolated.
2. Select the **previous complete UTC Monday–Sunday week**, through Sunday 23:59:59.999 UTC.
3. Apply a 100-item safety cap **before** scoring and enrichment, so collection order affects which entries survive.
4. Add tags, a relevance score, a section and a summary; `p-limit(3)` bounds simultaneous item enrichment tasks.
5. Sort by score descending and, on ties, publication date descending.
6. When not in dry-run mode, resolve/create the week's Notion database (if enabled), skip existing items by URL, persist entries and send an HTML/text digest email. An unhandled Notion failure may currently prevent email delivery.
7. With `DRY_RUN=true`, skip Notion writes and email but still fetch sources and, if configured, call the summarization API.

Shared `SourceItem` and `DigestItem` contracts are declared in `src/types.ts`.

## Sources

| Module | Configured sources | Behavior |
| --- | --- | --- |
| `src/sources/rss.ts` | Apple Developer News, Swift.org, SwiftLee, Point-Free, Ole Begemann, The.Swift.Dev, SwiftRocks | Parses RSS/Atom, skips invalid dates and isolates feed failures. |
| `src/sources/github.ts` | `apple/swift`, `apple/swift-package-manager`, `tuist/tuist`, `fastlane/fastlane`, `yonaskolb/XcodeGen` | Fetches releases and keeps the first returned release for each tracked repository. |
| `src/sources/reddit.ts` | `iOSProgramming`, `Swift`, `apple`, `macapps`, `TestFlight`, `visionosdev` | Fetches weekly top public JSON listings. Access errors can reduce coverage. |

Shared network utilities: `src/utils/fetchWithTimeout.ts` (`AbortController`), `src/utils/retry.ts` (status-aware backoff), `src/utils/logger.ts` (structured JSON logs).

## Enrichment

`src/utils/tags.ts`, `scoring.ts` and `sections.ts` implement deterministic heuristics. The verified `src/services/summarization/summary.ts` uses optional Hugging Face inference, with input cleanup, chunking and a local heuristic fallback when no key is configured or requests fail. A Gemini migration is planned; do not describe it as implemented until the source reflects it.

## Notion

`src/services/notion/client.ts` configures the SDK using `NOTION_API_KEY` and `NOTION_PARENT_PAGE_ID`. Persistence is optional and its absence should not disable email. `src/services/notion/service.ts` finds or creates a **separate database per week** containing Title, Date, Score, Section, Source, Summary, Tags and URL, then checks URL equality to avoid duplicate entries. The stored Summary is limited to 2,000 characters.

The desired title convention resembles `YYYY - Week NN - DD/MM to DD/MM`. The current formatter depends on the runtime locale, an open correctness risk. Do not replace the weekly database design with a single global database without a separate decision.

## Email

`src/email/template.ts` groups by section and conditionally adds an “Open in Notion” link. `src/email/send.ts` uses Nodemailer and Gmail SMTP (`smtp.gmail.com`:465, TLS) with `EMAIL_USER`, `EMAIL_PASS` and `TARGET_EMAIL` from the environment. Automated tests must mock SMTP.

## Code map and validation

- Entry/config/contracts: `src/index.ts`, `src/config.ts`, `src/types.ts`.
- Pipeline: `src/digest.ts`.
- Input collectors: `src/sources/`.
- External services: `src/services/`.
- Formatting and delivery: `src/email/`.
- Helpers: `src/utils/`.
- Build/runtime configuration: `package.json`, `tsconfig.json`, `.env.example`, `run-weekly-digest.sh`, `.github/workflows/weekly.yml`.

Install using `npm ci`, build with `npm run build`, run with `npm run start` or `npm run digest`. Test external integrations with mocks and fixtures; use deterministic clocks for week-boundary tests. Update this document alongside implementation changes.
