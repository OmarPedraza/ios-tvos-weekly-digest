# Branching, commits, pull requests and releases

This is the **adopted strategy for this repository**. Automated rules and workflows may be introduced in stages; the presence of this document does not imply that every validation is already active. Inspect the actual settings and workflows before relying on enforcement.

## Branch model and allowed flows

- `main`: production-ready, tagged releases.
- `develop`: integration of completed changes.
- `release/vX.Y.Z`: release preparation and stabilization; a release branch can accept focused changes before production.
- Short-lived `feat/*`, `fix/*`, `docs/*`, `ci/*` and `chore/*`: feature work, fixes, docs, CI and maintenance. Typically branch from `develop`; for a release-specific correction, branch from the **target release branch**.
- `hotfix/*`: urgent production corrections, branched from `main`.

| Source branch | Allowed PR targets | Merge method |
| --- | --- | --- |
| `feat/*`, `fix/*`, `docs/*`, `ci/*`, `chore/*` | `develop` **or** `release/vX.Y.Z` | Squash |
| `release/vX.Y.Z` | `main`; then propagate release-only changes to `develop` | Merge commit into `main`; back-merge safely preserving history/version |
| `hotfix/*` | `main`; then propagate to `develop` and any affected active release | Merge commit into `main`; follow-up PR as appropriate |

Do not push directly to `main`, `develop` or release branches. Work through focused PRs, wait for checks and delete short-lived branches after merge. Only one active release branch should exist for a given version. **Avoid merging an arbitrary `develop` branch into a release:** prefer scoped PRs so unfinished work is not accidentally shipped.

GitHub repository-wide merge settings must permit both squash and merge commits. Use target-aware rulesets/review to enforce which method is appropriate.

## Branch naming

Use short lowercase kebab-case descriptions, normally three to five words:

```text
feat/add-reddit-fallback
fix/handle-invalid-feed-dates
docs/update-project-context
ci/add-vitest-validation
chore/update-dependencies
hotfix/restore-email-delivery
release/v1.1.0
release/v1.2.0-rc.1
```

```regex
^(feat|fix|docs|ci|chore|hotfix)/[a-z0-9]+(-[a-z0-9]+)*$
^release/v[0-9]+\.[0-9]+\.[0-9]+(-(rc|beta)\.[0-9]+)?$
```

## Commit subjects and PR titles

Use **one Conventional Commits convention** for both commit subjects and PR titles:

```text
<type>(optional-scope): concise description
```

Allowed types: `feat`, `fix`, `docs`, `ci`, `chore`, `test`, `refactor`, `perf`, `build`, `revert` and `release`. `release` is a repository-defined Conventional Commits type. Use `fix:` for urgent fixes, including hotfixes. For incompatible changes, document a `BREAKING CHANGE:` footer and explain impact in the PR.

```text
feat(reddit): add fallback source
fix: handle missing publication dates
ci: run tests on pull requests
docs: update agent context
chore(deps): update dependencies
chore(release): bump version to 1.1.0-rc.1
chore(release): bump version to 1.2.0-dev
release: v1.1.0
```

Validation of **all** ordinary subjects and PR titles uses this pattern, with **no separate version-bump exception**:

```regex
^(feat|fix|docs|ci|chore|test|refactor|perf|build|revert|release)(\([a-z0-9._/-]+\))?: .+$
```

Version bump commits must match `chore(release): bump version to X.Y.Z[-rc.N|-dev]` and modify version-related files only (e.g. `package.json`, `package-lock.json`). Production release PRs to `main` must have the PR title and **resulting merge commit subject** `release: vX.Y.Z`, matching the tag; patch hotfix publication follows the same rule.

In addition to the general pattern, enforce these **type-specific forms**:

```regex
^chore\(release\): bump version to [0-9]+\.[0-9]+\.[0-9]+(-rc\.[0-9]+|-dev)?$
^release: v[0-9]+\.[0-9]+\.[0-9]+$
```


For normal squash merges into `develop` or `release/*`, use the PR title as the squash commit subject (configure GitHub's default squash title accordingly). For production merge commits into `main`, explicitly set the merge commit subject to the release title. Auto-generated dependency PRs must use compliant titles or a narrowly scoped, verified bot validation policy; bots are not exempt from testing or required reviews.

## Pull request description and review

Keep PRs focused. The repository's PR template, once introduced, requires:

1. **Summary** — what changed and why.
2. **Testing** — actual checks performed, results or reasons checks were not run.
3. **Risk / Impact** — compatibility, migration, operational impact, or `None` if justified.
4. **Additional Notes** — optional evidence or review context.

A PR-body validator should reject missing required sections, unchanged placeholders and empty descriptions.

### Review ownership

A future `.github/CODEOWNERS` entry will identify `@OmarPedraza` as the code owner to request reviews. **Review requests do not enforce approvals.** A future required, trusted `validate-pr-approval` status check must pass automatically when the PR is authored by the maintainer, but require a current valid approval from the maintainer when the author is anyone else, including a bot. All PRs must still pass build/tests and other required checks. Do not enable blanket native code-owner approval requirements that would make self-authored PRs unmergeable.

When implementing this check, ensure it responds to new commits, reviews and dismissals; evaluates the current head safely; uses trusted code and minimum permissions; and does not run untrusted fork code in a privileged workflow. Do not mark the check required until both self-authored and external PR scenarios have been tested.

## Versioning and release lifecycle

Follow SemVer and immutable tags (`v1.1.0`, `v1.2.0-rc.1`).

1. Create `release/vX.Y.Z` from `develop` when scope is ready. Stabilize with focused PRs into that release branch, using squash merges.
2. Use a dedicated `chore(release): bump version to X.Y.Z-rc.N` commit when producing a release candidate. Tag that commit `vX.Y.Z-rc.N`.
3. Before production release, use a version-only `chore(release): bump version to X.Y.Z` commit if needed.
4. Open the release PR to `main` with title `release: vX.Y.Z`. Merge using a **merge commit** with the same subject; tag that commit `vX.Y.Z`.
5. Propagate any release-only changes back to `develop` through a PR, using a history-preserving method where necessary. After the release, optionally bump development version in a separate commit using `chore(release): bump version to X.Y.Z-dev` if that versioning approach is adopted.
6. Delete the release branch after follow-up merges. Never move an existing release tag.

A production hotfix is prepared from `main` on `hotfix/*`, bumps the patch number, and is published with a release-style PR/merge commit subject and tag. Merge its fix back to integration (and any active release that needs it).

Version-bump commits must contain **only version-related changes**. No special non-Conventional-Commits format is permitted for bumps or production releases.

## Validation and adoption

| Validation | Where | Target |
| --- | --- | --- |
| Fast staged-file checks | `pre-commit` | `1.1.0` |
| Conventional Commit subject checks | `commit-msg` | `1.1.0` |
| Branch naming, TypeScript build and tests | `pre-push` | `1.1.0` |
| Shared validation script and hook installer | Local hooks and CI | `1.1.0` |
| Deterministic Vitest tests and build | PR GitHub Actions | `1.1.0` |
| Branch flow, title/body and release-format validation | PR CI | `1.1.1` |
| Conditional maintainer approval check | PR CI | `1.1.1` |
| Rulesets, dependency/security automation | GitHub settings and Dependabot | `1.1.1` |
| Release/tag protection and optional automation | GitHub settings/workflows | Before production publishing, once checks are ready |

Suggested assets: `.githooks/pre-commit`, `.githooks/commit-msg`, `.githooks/pre-push`, `.github/scripts/validate-standards.sh`, `scripts/install-hooks.sh`. Use a single source of truth for regex and validation semantics across hooks and CI. Hooks provide local feedback but can be bypassed, so build/test and policy CI remain authoritative. Apply **only existing, passing checks** as required ruleset statuses to avoid blocking all PRs.

When changing this policy, update the relevant instructions, roadmap and decision record **in the same PR**.
