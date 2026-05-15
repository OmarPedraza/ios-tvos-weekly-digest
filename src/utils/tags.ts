import type { SourceItem } from "../types.js";

export function extractTags(item: SourceItem): string[] {
  const text = `${item.title} ${item.excerpt ?? ""}`.toLowerCase();
  const tags: string[] = [];

  if (text.includes("swift")) tags.push("Swift");
  if (text.includes("xcode")) tags.push("Xcode");
  if (text.includes("xcodegen")) tags.push("XcodeGen");
  if (text.includes("tuist")) tags.push("Tuist");
  if (text.includes("fastlane")) tags.push("Fastlane");
  if (text.includes("ci")) tags.push("CI");
  if (text.includes("github actions")) tags.push("GitHub Actions");

  return tags;
}
