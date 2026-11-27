# Contributing

Contributions should keep the weekly digest simple, reliable and free to run. The application uses TypeScript, native NodeNext ESM and independent integrations to minimize the impact of external failures.

Before starting, read:

- [`README.md`](README.md) for setup and configuration.
- [`docs/architecture.md`](docs/architecture.md) for the pipeline and integration boundaries.
- [`docs/branching-strategy.md`](docs/branching-strategy.md) for branch flows, commit/PR titles, reviews and releases.
- [`AGENTS.md`](AGENTS.md) for repository-wide engineering instructions (also applicable to human contributors).

## Local setup

```bash
npm ci
npm run build
```

For a manual smoke run that does not write to Notion or send email:

```bash
DRY_RUN=true npm run digest
```

**This smoke run still fetches external data** and may use the configured summarization service. Do not use it as a substitute for mocked automated tests.

Vitest and Git hook automation are planned for `1.1.0`. When implemented, run the test scripts provided by `package.json` and install hooks using the repository installer. Check which scripts and hooks actually exist before relying on them.

## Branches, commits and PRs

Create a focused, short-lived branch using one of `feat/`, `fix/`, `docs/`, `ci/` or `chore/`, normally from `develop`. For release stabilization, changes may target an active `release/vX.Y.Z` branch; base new work on its intended target to avoid unrelated changes. Hotfixes are prepared from `main`.

Use Conventional Commit subjects for both commits and PR titles:

```text
feat: add another RSS source
fix(reddit): handle blocked responses
docs: clarify local setup
ci: add build validation
chore(release): bump version to 1.1.0
release: v1.1.0
```

Normal PRs into `develop` and release branches use squash merges; the PR title becomes the squash commit subject. Production release PRs into `main` use a merge commit. See the [branching strategy](docs/branching-strategy.md) for the exact allowed flows and versioning rules.

When the PR template is introduced, complete its Summary, Testing and Risk / Impact sections; Additional Notes is optional. Keep PRs narrowly scoped. Avoid leaking credentials, private paths or identifying runtime information in comments, logs and screenshots.

## Code and testing practices

- Use clear TypeScript types and `.js` extensions for relative runtime imports.
- Keep source collectors inside `src/sources/`, returning `SourceItem[]`; register new fetchers in `SOURCE_FETCHERS` in `src/digest.ts`.
- Reuse `withRetry`, `fetchWithTimeout` and structured logging, isolating individual source failures.
- Preserve UTC week selection, the safety cap, dry-run delivery protection and the ability to operate without Notion or a paid summary service.
- Test with deterministic time and fixture/mocked HTTP, Notion, SMTP and summary responses. Automated tests must not call production services.
- Once the test suite is in place, include relevant tests with every new feature or bug fix. Run `npm run build` and relevant available tests before requesting review.

## Documentation responsibilities

The contributor or coding agent implementing a change **must update the affected documentation in the same PR**. That includes code architecture, runtime instructions, configuration keys, release status, decisions and known issues when applicable. Do not rewrite unrelated documents or preserve temporary debugging notes.

If a check cannot be run, explain why in the PR rather than marking it as passed. Discuss risky behavioral changes before altering production delivery semantics.
