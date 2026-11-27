# Known issues and technical risks

This file tracks actionable current or historically observed risks. Check recent source and runtime evidence before concluding that an older incident is still active. Remove or revise entries in the PR that resolves them.

| Area | Risk | Handling / next step |
| --- | --- | --- |
| Reddit API access | Public JSON endpoints have returned HTTP 403, reducing coverage. | Individual collector failures should not abort the digest. Improve graceful fallback in `1.3.0`; do not bypass access restrictions. |
| Summary provider quotas | Hugging Face requests have exhausted free credit or timed out; multi-chunk summaries amplify calls. | Keep local fallback and bounded concurrency; test quota handling when migrating to Gemini in `1.2.0`. |
| Notion persistence and delivery | A Notion write error can prevent the subsequent email stage. | Investigate transient vs persistent failures; change sequencing only with a deliberate delivery policy and tests. |
| SMTP authentication | Revoked/expired application credentials can prevent delivery. | Report terminal email errors clearly, keep secrets out of logs and verify successful sends using deployment evidence. |
| Duplicate execution | More than one configured runner may deliver the same week's email. | Confirm enabled execution paths before changing scheduling; Notion URL deduplication does not deduplicate emails. |
| Weekly database title | The date formatter uses the host locale, possibly producing a different date order than intended. | Add deterministic locale and year-boundary tests before fixing. |
| Selection bias | The 100-item cap is applied before relevance scoring. | Revisit the ordering only in a tested, scoped improvement. |
| External HTTP errors | Raw error bodies can contain very large HTML responses. | Limit and sanitize logged error content. |
| Source parsing | Some collectors assume nested response fields exist. | Test malformed payloads and skip invalid entries safely. |
| Email HTML | External text and URLs are interpolated without comprehensive escaping. | Add escaping and security regression tests in a focused PR. |
| Dry-run expectations | `DRY_RUN=true` still performs some external requests. | Always mock dependencies for offline tests and CI. |

## Implementation gaps to verify

- Vitest dependencies may be installed without committed tests, scripts or PR CI; this is part of `1.1.0` until verified merged.
- The hooks, shared validator, `CODEOWNERS` and PR template are planned for the `1.1.0` automation PR, not assumed present today.
- The conditional maintainer-approval status check, rulesets and Dependabot policy are planned for `1.1.1`.

## Incident triage

Distinguish collector warnings from fatal errors by process exit status and structured events such as `Digest started`, `Source fetch failed`, `Notion sync completed`, `Digest email sent` and `Digest generated`. Log reproducible status codes and relevant stage information, never credentials or private deployment information.
