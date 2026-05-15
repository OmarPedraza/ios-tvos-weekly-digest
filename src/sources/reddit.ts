import {
  createHTTPRetryError,
  getErrorMessage,
  withRetry
} from "../utils/retry.js";
import { fetchWithTimeout } from "../utils/fetchWithTimeout.js";
import { logger } from "../utils/logger.js";
import type { SourceItem } from "../types.js";

const SUBREDDITS = [
  "iOSProgramming", 
  "Swift", 
  "apple",
  "macapps",
  "TestFlight",
  "visionosdev"
];

interface RedditPostData {
  title: string;
  permalink: string;
  created_utc: number;
  selftext: string;
}

interface RedditPost {
  data: RedditPostData;
}

interface RedditListing {
  data: {
    children: RedditPost[];
  };
}

export async function fetchReddit() {
  logger.info("Reddit fetch started", { subreddits: SUBREDDITS.length });

  const items: SourceItem[] = [];

  for (const subreddit of SUBREDDITS) {
    try {
      const response = await withRetry(async () => {
        const reply = await fetchWithTimeout(
          `https://www.reddit.com/r/${subreddit}/top.json?limit=5&t=week`
        );

        if (!reply.ok) {
          throw await createHTTPRetryError("Subreddit fetch failed", reply);
        }

        return reply;
      });

      const json = await response.json() as RedditListing;
      const posts = json?.data?.children;

      if (!Array.isArray(posts)) {
        logger.warn("Subreddit payload is invalid", { subreddit });
        continue;
      }

      posts.forEach((post: RedditPost) => {
        items.push({
          title: post.data.title,
          url: `https://reddit.com${post.data.permalink}`,
          date: new Date(post.data.created_utc * 1000),
          source: "Reddit",
          excerpt: post.data.selftext
        });
      });

      logger.info("Subreddit fetch completed", {
        subreddit,
        count: posts.length
      });
    } catch (error: unknown) {
      logger.error("Subreddit fetch error", {
        subreddit,
        error: getErrorMessage(error)
      });
    }
  }

  logger.info("Reddit fetch completed", { total: items.length });

  return items;
}
