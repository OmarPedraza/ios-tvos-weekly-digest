import Parser from "rss-parser";

import {
  createHTTPRetryError,
  getErrorMessage,
  withRetry
} from "../utils/retry.js";
import { fetchWithTimeout } from "../utils/fetchWithTimeout.js";
import { logger } from "../utils/logger.js";
import type { SourceItem } from "../types.js";

const parser = new Parser();

const FEEDS = [
  "https://developer.apple.com/news/rss/news.rss",   // Apple Developer News
  "https://www.swift.org/atom.xml",                  // Swift.org Blog (Atom)
  "https://avanderlee.com/feed",                     // SwiftLee Blog
  "https://pointfree.co/feed/atom.xml",              // Point-Free Blog (Atom)
  "https://oleb.net/blog/atom.xml",                  // Ole Begemann’s Blog (Atom)
  "https://theswiftdev.com/rss.xml",                 // The.Swift.Dev
  "https://swiftrocks.com/rss.xml"                   // SwiftRocks Blog
];

export async function fetchRSS() {
  logger.info("RSS fetch started", { feeds: FEEDS.length });

  const items: SourceItem[] = [];

  for (const url of FEEDS) {
    try {
      const feed = await parseFeed(url);
      let addedCount = 0;

      feed.items.forEach(item => {
        const rawDate = item.pubDate;
        const date = rawDate ? new Date(rawDate) : null;

        if (!date || isNaN(date.getTime())) {
          logger.warn(`Skipping item with invalid date in feed ${url}: ${item.title}`);
  
          return;
        }

        items.push({
          title: item.title,
          url: item.link,
          date,
          source: "RSS",
          excerpt: item.contentSnippet
        });
        addedCount += 1;
      });

      logger.info("RSS feed processed", {
        url,
        count: addedCount
      });
    } catch (error: unknown) {
      logger.error("Failed to fetch feed", {
        url,
        error: getErrorMessage(error)
      });

      continue;
    }
  }

  logger.info("RSS fetch completed", { total: items.length });

  return items;
}

async function parseFeed(url: string) {
  const text = await withRetry(async () => {
    const response = await fetchWithTimeout(
      url,
      {},
      10000
    );

    if (!response.ok) {
      throw await createHTTPRetryError(`RSS feed fetch failed (${url})`, response);
    }

    return response.text();
  });

  const startIndex = text.indexOf("<");
  const clean = startIndex >= 0 ? text.substring(startIndex) : text;
  return parser.parseString(clean);
}
