# Release roadmap

This records **planned scope**, not proof of what has shipped. Verify current `package.json`, source, PRs and GitHub settings before updating milestones. Mark a feature completed only when it is merged and validated.

| Release | Scope | Verified starting point |
| --- | --- | --- |
| **1.1.0** | Vitest tests, CI, Git hooks and local validation; `CODEOWNERS` and PR template | Concurrency and JSDoc PRs #2/#3 merged; tests/CI/hooks were not wired in the originally inspected `develop`. |
| **1.1.1** | Git policy checks, conditional review approvals, rulesets, Dependabot/security fixes | Process enforcement pending; existing Nodemailer major-upgrade PR requires review. |
| **1.2.0** | Gemini summarization | Verified baseline uses Hugging Face. |
| **1.3.0** | Reddit degraded-mode improvements | 403s have been observed. |
| **1.4.0** | Run and delivery failure alerts | Structured logs available. |

## `1.1.0` — testing, local prevention and PR quality

- Introduce Vitest configuration and scripts. Test deterministic rules (dates, tags, sections, scoring, retry classification, fallback summarization and email rendering).
- Mock HTTP, Notion, SMTP and summarization for source, orchestration, deduplication, partial-failure, cap, concurrency and dry-run tests. Do not use production credentials.
- Add a PR GitHub Actions workflow using Node.js 20, `npm ci`, `npm run build` and tests. Make statuses required only **after** they exist and pass.
- Add repository-managed `.githooks/pre-commit`, `.githooks/commit-msg`, `.githooks/pre-push`, a shared validation script and `scripts/install-hooks.sh`. Ensure early failures are fast; run build and tests before push; validate executable permissions and bypass-resistant CI parity.
- In the **hooks/validators PR**, add `.github/CODEOWNERS` and `.github/pull_request_template.md`, keeping required Summary, Testing, Risk / Impact and optional Additional Notes aligned with future CI checks. Neither file should be introduced in the initial context-only documentation PR.
- Update `README.md`, `CONTRIBUTING.md`, `docs/architecture.md`, `docs/roadmap.md` and any other impacted docs in the implementation PR.

**Done when:** tests and build pass locally and in PR CI, hooks can be installed and block invalid operations, and tests cannot write to production systems.

## `1.1.1` — policy checks, protection and dependencies

- Validate branch prefixes/flows (including short-lived branches into active `release/vX.Y.Z`), commit/PR title format and required PR description sections in CI, sharing rules with local hooks.
- Add trusted required `validate-pr-approval`: maintainer-authored PRs pass without an external approval; others, including bots, require a current maintainer approval. Ensure review/commit changes re-evaluate the check and external forks cannot run privileged code.
- Configure target-aware protected-branch rulesets for `develop`, `main` and release branches; block direct/force pushes and unsafe deletion; require successful existing checks. Preserve squash into integration/release and merge commits for production publication.
- Configure Dependabot for npm and Actions; investigate alerts and assess major dependency updates separately.
- Confirm the squash title defaults to the PR title, and production release PR title/merge commit/tag use `release: vX.Y.Z` / `vX.Y.Z` consistently.

**Done when:** valid self-authored PRs are not blocked by self-approval requirements, external PRs need maintainer approval, and mandatory CI still applies to all authors.

## `1.2.0` — Gemini

Replace Hugging Face-specific summary integration and environment configuration. Preserve graceful fallback, cost awareness and bounded concurrency; mock success, bad responses, quota exhaustion and timeouts. Update all user-facing configuration references in the same PR.

## `1.3.0` — Reddit resilience

Handle blocked API responses without retry storms or verbose logs, and maintain useful digest output from other collectors. Prefer permitted sources; verify degraded-mode behavior with tests.

## `1.4.0` — monitoring

Detect missed/failed executions and terminal delivery failures, define a notification and deduplication strategy and test classification without sending real alerts in CI.

## Backlog

Evaluate locale-stable Notion week titles and year boundaries, HTML escaping, source payload validation, the pre-ranking 100-item cap, and the behavior when Notion persistence fails before email. Scope these as separate tested changes.

**Maintenance rule:** the implementer updates affected documentation in the same PR; update this roadmap when scope or completion status changes, not merely to record a date.
