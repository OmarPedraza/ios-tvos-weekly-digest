import type { SourceItem } from "../types.js";

export type Section =
  | "🛠 Tooling"
  | "🍎 Apple"
  | "📦 OSS"
  | "🧪 CI"
  | "💬 Community";

export function sectionForItem(item: any): Section {
  const tags: string[] = item.tags ?? [];
  const text = `${item.title} ${item.excerpt ?? ""}`.toLowerCase();

  if (tags.includes("Tuist") || tags.includes("XcodeGen") || tags.includes("Fastlane")) {
    return "🛠 Tooling";
  }

  if (tags.includes("CI") || tags.includes("GitHub Actions")) {
    return "🧪 CI";
  }

  if (text.includes("apple") || text.includes("ios") || text.includes("tvos") || text.includes("xcode")) {
    return "🍎 Apple";
  }

  if (item.source === "GitHub") {
    return "📦 OSS";
  }

  return "💬 Community";
}