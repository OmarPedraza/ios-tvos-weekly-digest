# Instructions for coding agents

These instructions apply to the entire repository, regardless of the tool or agent used. **The checked-out source code and active repository configuration determine what is implemented.** Documentation records intended behavior and decisions; it does not prove that a planned change has shipped.

## Read relevant context

- [`docs/architecture.md`](docs/architecture.md): data flow, integrations and runtime behavior.
- [`docs/branching-strategy.md`](docs/branching-strategy.md): branching, commits, pull requests, reviews and releases. **Read before performing Git operations.**
- [`docs/decisions.md`](docs/decisions.md): enduring design and workflow decisions.
- [`docs/roadmap.md`](docs/roadmap.md): release scope and pending milestones.
- [`docs/known-issues.md`](docs/known-issues.md): unresolved risks and known mitigations.

Also consult [`README.md`](README.md), [`CONTRIBUTING.md`](CONTRIBUTING.md) and relevant configuration files. Read the context that applies to the task; verify any status assertions against the current branch.

## Engineering principles

- Use Node.js >=20, npm >=10, strict TypeScript and NodeNext ESM. Source imports use `.js` extensions; compile via `npm run build` to `dist/`.
- Preserve the previous complete **Monday–Sunday UTC week**, independent source failure handling, bounded timeouts/retries and concurrency, the 100-item safety cap and optional Notion persistence unless a scoped change explicitly revises them.
- Keep the tool free to run. Do not introduce required paid services, containers or deployment-specific assumptions.
- `DRY_RUN=true` prevents Notion writes and email sends, but can still fetch live sources and call the configured summarization provider. **Tests must mock external I/O.** Do not send real email or write real Notion data in CI.
- Do not commit or log secrets, local `.env` values, private paths or personal identifiers. Use `.env.example` for configuration keys.
- Prefer small, typed, testable modules; deterministic tests; structured logs; and graceful degradation for optional services. Known HTTP 4xx errors should not be retried unless explicitly appropriate (e.g. 429), while transient errors may be retried with limits.

## Development workflow

- Install: `npm ci`. Build: `npm run build`. Execute: `npm run digest` (build + start) or `npm run start` (already built). A `DRY_RUN=true npm run digest` smoke test makes network requests and is not an offline unit test.
- `src/digest.ts` orchestrates; `src/sources/` fetches; `src/utils/` contains heuristics and resilient network helpers; `src/services/` wraps external integrations; `src/email/` renders and sends; `src/types.ts` defines shared types.
- Automated Vitest tests, CI and repository-managed Git hooks are targeted for `1.1.0`. Check the actual repository state before claiming they are present. Once available, add or update tests for each behavior change and run the relevant checks.
- Changes to Git-related tooling must use the same validation rules locally and in CI where practical. Local hooks provide immediate feedback; CI remains authoritative because hooks can be bypassed.

## Git and pull requests

- Use `main` for released code and `develop` for integration. Work on short-lived branches, including `feat/`, `fix/`, `docs/`, `ci/` and `chore/`; these can target `develop` or an active `release/vX.Y.Z` branch as appropriate. See the **full** allowed branch flow in [`docs/branching-strategy.md`](docs/branching-strategy.md).
- Use **the same Conventional Commit subject format** for commit subjects and PR titles: e.g. `feat: add fallback source`, `fix: handle invalid dates`, `chore(release): bump version to 1.1.0`, `release: v1.1.0`. A normal PR squash commit should adopt its PR title; production releases use the documented merge strategy.
- Never commit directly to protected branches or merge, tag, publish or deploy without authorization.
- `CODEOWNERS` can request maintainer review but is not conditional enforcement. A future trusted `validate-pr-approval` check should require maintainer approval for external/bot PRs while allowing maintainer-authored PRs without a self-review. Do not activate blanket mandatory code-owner approvals that would prevent maintainers from merging their own PRs.
- When the pull request template is introduced, use its Summary, Testing, Risk / Impact and optional Additional Notes sections.

## Keep documentation current

**Whoever implements a change is responsible for updating its affected documentation in the same PR.** Update `architecture.md` for implementation/integration changes; `decisions.md` for decisions; `roadmap.md` for scope/status; `known-issues.md` for confirmed/resolved issues; `branching-strategy.md` for workflow changes; and README, CONTRIBUTING or `.env.example` when user-facing instructions/configuration change. Do not edit unrelated documents merely to update timestamps.

Before work, inspect the actual branch, working tree, source and relevant settings. After work, report changes, checks run, failures and follow-up actions accurately. Avoid adding transient debugging or personal environment details to repository documentation.
