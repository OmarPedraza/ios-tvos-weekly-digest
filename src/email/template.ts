import type { DigestItem } from "../types.js";

export function renderHTMLDigest(items: DigestItem[], notionDatabaseID?: string) {
  const sections = groupBy(items, "section");

  const sectionBlocks = Object.entries(sections)
    .map(([section, itemsInSection]) => {
      const rows = itemsInSection
        .sort((a, b) => (b.score ?? 0) - (a.score ?? 0)) // safe score fallback
        .map(item => `
          <tr>
            <td style="padding:12px 0;">
              <a href="${item.url ?? '#'}" 
                  style="color:#2563eb;text-decoration:none;font-weight:600;font-size:15px;">
                ${item.title ?? 'No title'}
              </a>
              <div style="color:#374151;font-size:14px;margin-top:4px;">
                ${item.summary ?? ''}
              </div>
              <div style="color:#6b7280;font-size:12px;margin-top:4px;">
                ${(item.tags ?? []).join(" · ")}
              </div>
            </td>
          </tr>
        `)
        .join("");

      return `
        <h2 style="margin-top:32px;font-size:18px;">${section ?? 'Uncategorized'}</h2>
        <table width="100%" cellpadding="0" cellspacing="0">
          ${rows}
        </table>
      `;
    })
    .join("");

  const notionButton = notionDatabaseID
    ? `<a href="https://www.notion.so/${notionDatabaseID.replace(/-/g, "")}"
          style="display:inline-block;background:#000;color:#fff;padding:10px 16px;border-radius:8px;
                text-decoration:none;font-weight:600;font-size:14px;margin-bottom:12px;">
        🔎 Open in Notion
      </a>`
    : '';

  return `
    <html>
      <body style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif;background:#f9fafb;padding:24px;">
        <table width="100%" style="max-width:680px;margin:auto;background:white;border-radius:12px;padding:24px;">
          <tr>
            <td>
              <h1 style="margin-top:0;">📱 iOS & tvOS Weekly Digest</h1>
              <p style="color:#374151;margin-bottom:16px;">
                Curated highlights from the iOS ecosystem — tooling, releases, Apple news and community gems.
              </p>

              ${notionButton}

              ${sectionBlocks}

              <hr style="margin:32px 0;border:none;border-top:1px solid #e5e7eb;" />
              <p style="font-size:12px;color:#9ca3af;">
                Generated automatically · Open-source · No tracking
              </p>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

// Generic, safe groupBy
function groupBy<T>(items: T[], key: keyof T): Record<string, T[]> {
  return items.reduce((groups: Record<string, T[]>, item) => {
    const groupKey = String(item[key] ?? 'Uncategorized');
    groups[groupKey] ??= [];
    groups[groupKey].push(item);
    return groups;
  }, {});
}
