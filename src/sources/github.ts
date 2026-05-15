import {
  createHTTPRetryError,
  getErrorMessage,
  withRetry
} from "../utils/retry.js";
import { fetchWithTimeout } from "../utils/fetchWithTimeout.js";
import { logger } from "../utils/logger.js";
import type { SourceItem } from "../types.js";

const REPOS = [
  "apple/swift",
  "apple/swift-package-manager",
  "tuist/tuist",
  "fastlane/fastlane",
  "yonaskolb/XcodeGen"
];

interface GitHubRelease {
  tag_name: string;
  html_url: string;
  published_at: string;
  body: string;
}

export async function fetchGitHub() {
  logger.info("GitHub fetch started", { repos: REPOS.length });

  const items: SourceItem[] = [];

  for (const repo of REPOS) {
    try {
      const response = await withRetry(async () => {
        const reply = await fetchWithTimeout(
          `https://api.github.com/repos/${repo}/releases`,
          {
            headers: {
              Accept: "application/vnd.github+json",
              "User-Agent": "ios-tvos-weekly-digest"
            }
          }
        );

        if (!reply.ok) {
          throw await createHTTPRetryError("GitHub repo fetch failed", reply);
        }

        return reply;
      });

      const releases = await response.json() as GitHubRelease[];
      if (!Array.isArray(releases)) {
        logger.warn("GitHub repo payload is invalid", { repo });
        continue;
      }

      const latestRelease = releases[0];
      if (!latestRelease) {
        logger.info("GitHub repo has no releases", { repo });
        continue;
      }

      items.push({
        title: `${repo} ${latestRelease.tag_name}`,
        url: latestRelease.html_url,
        date: new Date(latestRelease.published_at),
        source: "GitHub",
        excerpt: latestRelease.body
      });

      logger.info("GitHub repo fetch completed", {
        repo,
        count: 1
      });
    } catch (error: unknown) {
      logger.error("GitHub repo fetch error", {
        repo,
        error: getErrorMessage(error)
      });
    }
  }

  logger.info("GitHub fetch completed", { total: items.length });

  return items;
}
