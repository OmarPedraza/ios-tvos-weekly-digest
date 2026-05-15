import type { SourceItem } from "../types.js";

export function scoreItem(item: SourceItem): number {
  let score = 0;
  const text = `${item.title} ${item.excerpt ?? ""}`.toLowerCase();

  // Source weight
  if (item.source === "GitHub") score += 3;
  if (item.source === "RSS") score += 1;

  // Releases
  if (text.includes("release") || text.includes("v.")) score += 5;

  // Tooling
  if (text.includes("tuist")) score += 4;
  if (text.includes("xcodegen")) score += 4;
  if (text.includes("fastlane")) score += 3;

  // CI
  if (text.includes("ci") || text.includes("pipeline")) score += 2;

  // Apple platforms
  if (text.includes("ios") || text.includes("tvos") || text.includes("xcode")) score += 2;

  return score;
}
