import { config } from "./config.js";
import { sendEmail } from "./email/send.js";
import {
  getWeeklyDatabaseID,
  saveItem
} from "./services/notion/service.js";
import { summarize } from "./services/summarization/summary.js";
import { fetchGitHub } from "./sources/github.js";
import { fetchReddit } from "./sources/reddit.js";
import { fetchRSS } from "./sources/rss.js";
import { logger } from "./utils/logger.js";
import { scoreItem } from "./utils/scoring.js";
import { sectionForItem } from "./utils/sections.js";
import { extractTags } from "./utils/tags.js";
import type { DigestItem } from "./types.js";

const SOURCE_FETCHERS = [
  { name: "Reddit", run: fetchReddit },
  { name: "RSS", run: fetchRSS },
  { name: "GitHub", run: fetchGitHub }
] as const;

/**
 * Returns the previous calendar week's range
 * (Monday 00:00 → Sunday 23:59:59.999)
 */
function getPreviousWeekRange(now = new Date()) {
  const current = new Date(now.toISOString());
  current.setUTCHours(0, 0, 0, 0);

  const day = current.getUTCDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;

  const thisWeekMonday = new Date(current);
  thisWeekMonday.setUTCDate(current.getUTCDate() + diffToMonday);

  const previousWeekMonday = new Date(thisWeekMonday);
  previousWeekMonday.setUTCDate(thisWeekMonday.getUTCDate() - 7);

  const previousWeekSunday = new Date(thisWeekMonday);
  previousWeekSunday.setUTCMilliseconds(-1);

  return {
    start: previousWeekMonday,
    end: previousWeekSunday
  };
}

export async function generateDigest() {
  const startedAt = Date.now();
  logger.info("Digest started", { dryRun: config.dryRun });

  const results = await Promise.allSettled(
    SOURCE_FETCHERS.map(source => source.run())
  );

  results.forEach((result, index) => {
    const sourceName = SOURCE_FETCHERS[index].name;

    if (result.status === "fulfilled") {
      logger.info("Source fetch completed", {
        source: sourceName,
        count: result.value.length
      });
      return;
    }

    logger.warn("Source fetch failed", {
      source: sourceName,
      error: getErrorMessage(result.reason)
    });
  });

  const items = results.flatMap(result =>
    result.status === "fulfilled" ? result.value : []
  );

  logger.info("Items aggregated", { total: items.length });

  // 🔹 Filter by previous calendar week
  const { start, end } = getPreviousWeekRange();
  logger.info("Using previous week range", {
    start: start.toISOString(),
    end: end.toISOString()
  });

  const weeklyItems = items.filter(item => {
    return item.date >= start && item.date <= end;
  });

  // 🔹 Defensive safety cap
  const MAX_SAFETY = 100;
  const limited = weeklyItems.slice(0, MAX_SAFETY);

  logger.info("Items processed", {
    afterFilter: weeklyItems.length,
    afterLimit: limited.length
  });

  // 🔹 Enrich only what is needed
  const enrichmentStartedAt = Date.now();
  logger.info("Enrichment started", { count: limited.length });

  const enriched: DigestItem[] = await Promise.all(
    limited.map(async item => {
      const tags = extractTags(item);
      return {
        date: item.date,
        score: scoreItem(item),
        section: sectionForItem({ ...item, tags }),
        source: item.source,
        summary: await summarize(item.excerpt),
        title: item.title,
        url: item.url,
        tags: tags
      };
    })
  );

  logger.info("Enrichment completed", {
    count: enriched.length,
    elapsedMs: Date.now() - enrichmentStartedAt
  });

  // 🔹 Sort enriched items (descending by score for consistency with email rendering)
  enriched.sort((a, b) => b.score - a.score || b.date.getTime() - a.date.getTime());

  if (!config.dryRun) {
    logger.info("Sending to Notion", { count: enriched.length });

    // 🔹 Create the database only once
    const currentDatabaseID = await getWeeklyDatabaseID(start);
    logger.info("Notion database resolved", {
      databaseID: currentDatabaseID ?? "none"
    });

    // 🔹 Save all items in the same database
    for (const item of enriched) {
      await saveItem(item, currentDatabaseID);
    }
    logger.info("Notion sync completed", { count: enriched.length });
    
    // 🔹 Send email with the correct URL
    logger.info("Sending email", {
      count: enriched.length,
      hasNotionDatabaseID: Boolean(currentDatabaseID)
    });

    await sendEmail(enriched, currentDatabaseID);
    logger.info("Email sent successfully", { count: enriched.length });
  } else {
    logger.info("Dry run mode enabled", { count: enriched.length });
  }

  logger.info("Digest generated", {
    total: enriched.length,
    start: start.toISOString(),
    end: end.toISOString(),
    elapsedMs: Date.now() - startedAt
  });
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;

  try {
    return JSON.stringify(error);
  } catch {
    return "Unknown error";
  }
}