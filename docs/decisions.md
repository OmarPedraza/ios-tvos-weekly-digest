# Architectural and process decisions

Record **durable decisions** here, not transcripts, local Git state or personal deployment details. An accepted plan is not proof of a merged implementation. Change this record in the same PR that changes a decision; update `architecture.md` when the implementation changes.

## Adopted

1. **Simple, free-to-run CLI.** Node.js >=20, npm >=10, strict TypeScript/NodeNext ESM and compiled JavaScript. Keep the runtime portable; do not require containers or paid infrastructure.
2. **UTC weekly selection and source resilience.** Cover the previous full Monday–Sunday UTC week, isolate independent source failures, log actionable errors, use bounded retries/timeouts, cap the digest at 100 items and bound enrichment concurrency (currently 3).
3. **Separate Notion database per week.** Find/create a weekly database beneath the configured parent, deduplicate by URL and keep email available if Notion is not configured. A global database or persistent week-ID map is deferred.
4. **Optional summarization.** Preserve the local fallback and avoid mandatory expenditure. The source verified before `1.1.0` uses Hugging Face; migration to Gemini remains a planned change until implemented.
5. **Safe local validation.** `DRY_RUN=true` prevents Notion writes and email but can still make network/LLM calls. Automated tests must be offline and isolated from production credentials.
6. **Small observable operations.** Prefer structured logs, clear failure reporting and predictable single-run execution. Treat source warnings differently from failures that stop delivery.
7. **Git strategy.** `main` is production, `develop` is integration, `release/vX.Y.Z` is for stabilization. Short-lived `feat`, `fix`, `docs`, `ci` and `chore` branches may merge into `develop` or an active release. Squash into integration/release; merge commit for production releases. See [`branching-strategy.md`](branching-strategy.md).
8. **Uniform Conventional Commits.** Commit subjects and PR titles share a convention including `feat:`, `fix:`, `docs:`, `chore(release): bump version to X.Y.Z[-rc.N|-dev]` and `release: vX.Y.Z`; no separate nonconforming version-bump messages. PR squash commits take the PR title.
9. **Approvals appropriate to repository ownership.** `CODEOWNERS` will auto-request the maintainer's review. A planned conditional approval check will require current maintainer approval only for PRs opened by others, including bots, while all PRs must pass mandatory CI. Do not enable a global approval requirement that blocks the maintainer's own PRs.
10. **Documentation is part of a change.** The contributor or coding agent implementing a change must update the relevant context, README/configuration and contributor instructions in that same PR. The maintainer reviews these updates.
11. **Already completed:** concurrency limits and JSDoc documentation were merged in PRs #2 and #3. Do not recreate those changes without cause.

## Agreed, not necessarily implemented

12. **`1.1.0`: tests, CI and local hooks.** Vitest, deterministic fixtures/mocks, PR build/test validation, fast `pre-commit`, `commit-msg`, `pre-push`, shared validation logic and a hook installer. Include `.github/CODEOWNERS` and a focused PR template in the automation PR; these files alone do not enforce approval.
13. **`1.1.1`: protection and dependency hygiene.** PR/branch validation in CI, conditional `validate-pr-approval`, rulesets and Dependabot. Review major upgrades (including the proposed Nodemailer 8→10 change) before merging.
14. **`1.2.0`: Gemini.** Replace Hugging Face while preserving quota awareness, fallbacks and no required paid plan.
15. **`1.3.0`: Reddit reliability.** Degrade gracefully on persistent 403s and prefer permitted alternatives without bypassing access controls.
16. **`1.4.0`: monitoring.** Identify missing runs and terminal delivery errors without excessive warnings or alerts.

## Deferred until justified

- A single global Notion database or persistent weekly database cache.
- Changes to the 100-item cap selection order, Notion-to-email coupling or date formatting without scoped requirements and tests.
- Automation of release preparation/changelogs/back-merges before the manual process warrants it.

[`branching-strategy.md`](branching-strategy.md) defines the detailed current Git policy and takes precedence over this summary.
