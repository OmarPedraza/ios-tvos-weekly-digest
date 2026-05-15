# Contributing to iOS & tvOS Weekly Digest

Thanks for your interest in contributing!

## Project principles

- Keep the project free to run.
- Prefer simple, maintainable solutions.
- Keep failures isolated so one source/service does not crash the full run.
- Preserve safe local development via `DRY_RUN=true`.

## Current architecture

- Main orchestrator: `src/digest.ts`
- Entry point: `src/index.ts`
- Source collectors: `src/sources/`
- External services: `src/services/`
- Email output: `src/email/`
- Shared logic: `src/utils/`

## Local setup

```bash
npm install
```

Build:

```bash
npm run build
```

Run in dry-run mode (recommended while developing):

```bash
DRY_RUN=true npm run digest
```

In dry-run mode, email environment variables are optional.

## Adding a new source

1. Add a new module under `src/sources/`.
2. Export an async fetcher that returns `SourceItem[]`.
3. Reuse resilience helpers (for example `withRetry` and `fetchWithTimeout`) where appropriate.
4. Register the source in `SOURCE_FETCHERS` inside `src/digest.ts`.

Expected source item shape:

```ts
export interface SourceItem {
  date: Date;
  excerpt?: string;
  source?: string;
  title?: string;
  url?: string;
}
```

## Code guidelines

- TypeScript with clear types.
- Keep modules focused and small.
- Avoid introducing paid or mandatory external services.
- Keep behavior deterministic where possible.
- Do not couple source-specific logic into unrelated modules.

## Reliability guidelines

- Handle partial failures gracefully.
- Log actionable context in error paths.
- Prefer fallback behavior over hard failure when external APIs are optional.

## Validation checklist for PRs

- `npm run build` passes.
- Manual dry-run completed (`DRY_RUN=true npm run digest`).
- Docs updated if behavior/config changed.
- PR description includes what changed and how it was validated.

## Testing

There is no automated test suite yet. For now, use:
- TypeScript build for static validation.
- Dry-run execution for integration-level checks.

## Pull requests

- Keep changes focused.
- Explain rationale, not only implementation details.
- Call out trade-offs and follow-up work when relevant.

## Questions

Open an issue or discussion in the repository.
