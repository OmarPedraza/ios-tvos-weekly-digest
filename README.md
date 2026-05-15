# iOS & tvOS Weekly Digest

Automated weekly digest generator for iOS and tvOS developers, intended to be run manually or from an external scheduler such as cron.

## What it does

This project collects weekly content from public sources, enriches it, and produces a curated digest.

Current pipeline:
1. Fetches items from Reddit, RSS feeds, and selected GitHub repositories.
2. Filters to the previous calendar week (Monday-Sunday, UTC).
3. Scores, tags, and assigns sections.
4. Optionally summarizes longer excerpts (Hugging Face API if configured, fallback otherwise).
5. In normal mode, saves items to a weekly Notion database and sends an HTML email.
6. In dry run mode, performs fetch/enrichment only and logs results.

Main orchestrator: `src/digest.ts`.

## Requirements

- Node.js 20+
- npm 10+

## Install

```bash
npm install
```

## Run

Build and run once:

```bash
npm run digest
```

Run compiled output directly:

```bash
npm run start
```

Build only:

```bash
npm run build
```

## Cron / NAS usage

A helper script [`run-weekly-digest.sh`](run-weekly-digest.sh) is included. It uses a lockfile to prevent overlapping runs and pipes output to `digest.log`.

Typical setup:
1. Clone the repo to the NAS.
2. Run `npm install` once.
3. Run `npm run build` after each code update.
4. Schedule `run-weekly-digest.sh` from cron, or call `npm run start` directly.

Example crontab entry using the helper script (every Monday at 09:00):

```cron
0 9 * * 1 /path/to/ios-tvos-weekly-digest/run-weekly-digest.sh
```

Or scheduling `npm run start` directly:

```cron
0 9 * * 1 cd /path/to/ios-tvos-weekly-digest && /usr/bin/env -i PATH=/usr/local/bin:/usr/bin:/bin NODE_ENV=production NOTION_API_KEY=... NOTION_PARENT_PAGE_ID=... EMAIL_USER=... EMAIL_PASS=... TARGET_EMAIL=... HF_API_KEY=... npm run start >> /path/to/logs/ios-tvos-weekly-digest.log 2>&1
```

If your NAS already loads environment variables from a file or scheduler UI, keep the cron command to:

```bash
cd /path/to/ios-tvos-weekly-digest && npm run start
```

## Dry run mode

```bash
DRY_RUN=true npm run digest
```

When `DRY_RUN=true`:
- Source collection, filtering, scoring, tagging, and summarization still run.
- Notion writes are skipped.
- Email sending is skipped.

## Environment variables

Required for normal runs:
- `EMAIL_USER`
- `EMAIL_PASS`
- `TARGET_EMAIL`

Optional:
- `DRY_RUN` (set to `true` for safe local runs — email variables are not required when enabled)
- `HF_API_KEY` (enables Hugging Face summarization API)
- `NOTION_API_KEY` (enables Notion integration when paired with `NOTION_PARENT_PAGE_ID`)
- `NOTION_PARENT_PAGE_ID` (required with `NOTION_API_KEY` to create/find weekly databases)

If Notion variables are missing, the pipeline runs with Notion disabled.

For cron jobs, make sure these variables are available in the cron environment. Cron usually runs with a much smaller environment than an interactive shell.

## Project layout

```text
src/
    config.ts
    digest.ts
    index.ts
    types.ts
    email/
        send.ts
        template.ts
    services/
        notion/
            client.ts
            service.ts
        summarization/
            summary.ts
    sources/
        github.ts
        reddit.ts
        rss.ts
    utils/
        fetchWithTimeout.ts
        logger.ts
        retry.ts
        scoring.ts
        sections.ts
        tags.ts
```

## Notes on current behavior

- Source failures are isolated: one failing source does not stop digest generation.
- Summarization gracefully falls back when `HF_API_KEY` is absent or API calls fail.
- Weekly data in Notion is organized by auto-created weekly databases under a parent page.

## License

MIT
