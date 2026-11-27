# iOS & tvOS Weekly Digest

A TypeScript CLI that collects public iOS/tvOS development news, enriches it and produces a weekly digest delivered by email and optionally saved to Notion.

## How it works

1. Collect articles and releases from RSS/Atom, GitHub and Reddit.
2. Filter to the **previous complete Monday–Sunday week (UTC)**.
3. Score, tag, categorize and optionally summarize the selected items.
4. In normal mode, save entries in the week's Notion database (when configured) and send an HTML/text email.
5. With `DRY_RUN=true`, skip Notion writes and email delivery.

The main pipeline lives in `src/digest.ts`. Individual collection failures are isolated, and optional summarization has a local fallback.

## Requirements

- Node.js 20+
- npm 10+

## Install and run

```bash
npm ci
npm run digest       # compile and execute once
```

Other commands:

```bash
npm run build        # TypeScript compilation to dist/
npm run start        # execute previously built output
DRY_RUN=true npm run digest
```

**Dry run is not an offline mode:** source requests and configured summary API calls can still occur. Use mocked tests when network-free validation is required.

## Environment configuration

Copy `.env.example` to an ignored `.env` or supply equivalent environment variables at runtime.

| Variable | Purpose |
| --- | --- |
| `EMAIL_USER` | SMTP account; required for normal email delivery. |
| `EMAIL_PASS` | SMTP credential; required for normal email delivery. |
| `TARGET_EMAIL` | Digest recipient; required for normal email delivery. |
| `NOTION_API_KEY` | Optional Notion integration credential. |
| `NOTION_PARENT_PAGE_ID` | Optional parent page; needed together with `NOTION_API_KEY`. |
| `HF_API_KEY` | Optional Hugging Face summary key in the currently verified implementation; a different provider is planned. |
| `DRY_RUN` | Set to `true` to skip Notion writes and email. |

Never commit credentials or real `.env` values. When Notion credentials are missing, persistence is disabled, but normal email delivery remains available.

## Scheduling

The CLI runs once and exits, so it can be invoked manually or from any supported external scheduler. `run-weekly-digest.sh` is an optional wrapper that uses a lock and appends output to an ignored log. The repository also contains `.github/workflows/weekly.yml`. If using scheduled runs, **enable only the intended delivery path(s)** to avoid duplicate emails.

## Repository layout

```text
src/
  config.ts
  digest.ts
  index.ts
  types.ts
  email/                 # HTML/text rendering and SMTP
  services/notion/       # weekly database and entries
  services/summarization/# optional summaries and fallback
  sources/               # RSS, GitHub and Reddit
  utils/                 # timeouts, retry, logging and heuristics
```

## Development and contribution

The project uses pull requests and the Git workflow documented in [`docs/branching-strategy.md`](docs/branching-strategy.md). Read [`CONTRIBUTING.md`](CONTRIBUTING.md) for local development and validation.

More technical context:

- [Architecture](docs/architecture.md)
- [Decisions](docs/decisions.md)
- [Release roadmap](docs/roadmap.md)
- [Known issues](docs/known-issues.md)
- [Instructions for coding agents](AGENTS.md)

Automated tests, PR validation and repository-managed hooks are part of the planned `1.1.0` work; check `package.json` and `.github/workflows/` for their **actual current availability**.

## License

MIT
