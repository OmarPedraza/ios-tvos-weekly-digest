import {
  isFullDatabase,
  isFullDataSource,
  CreateDatabaseResponse,
  DataSourceObjectResponse,
  SearchResponse
} from "@notionhq/client";

import { withRetry } from "../../utils/retry.js";
import { logger } from "../../utils/logger.js";
import { createNotionClient } from "./client.js";
import type { DigestItem } from "../../types.js";

const notion = createNotionClient();
let hasLoggedNotionUnavailableForSave = false;
let hasLoggedMissingDatabaseIDForSave = false;

// -------------------- Weekly helper functions --------------------

function buildWeekTitle(date: Date) {
  const { week, year, start, end } = getWeekInfo(date);

  const formatter = new Intl.DateTimeFormat(undefined, {
    day: "2-digit",
    month: "2-digit"
  });

  return `${year} - Week ${week} - ${formatter.format(start)} to ${formatter.format(end)}`;
}

function getWeekInfo(date: Date) {
  const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = utcDate.getUTCDay() || 7;
  utcDate.setUTCDate(utcDate.getUTCDate() + 4 - day);

  const yearStart = new Date(Date.UTC(utcDate.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((utcDate.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  const year = utcDate.getUTCFullYear();

  const start = new Date(utcDate);
  start.setUTCDate(utcDate.getUTCDate() - 3);

  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);

  return { week, year, start, end };
}

// -------------------- Notion functions --------------------

// Finds the weekly database by title
async function findWeeklyDatabase(title: string): Promise<string | null> {
  if (!notion) return null;

  logger.info("Searching weekly Notion database", { title });

  let cursor: string | undefined = undefined;

  do {
    const response: SearchResponse = await notion.search({
      query: title,
      filter: { property: "object", value: "data_source" },
      start_cursor: cursor,
      page_size: 100
    });

    const dataSource = response.results.find(
      (r): r is DataSourceObjectResponse =>
        r.object === "data_source" &&
        isFullDataSource(r) &&
        r.title?.[0]?.plain_text === title &&
        r.parent.type === "database_id"
    );

    if (dataSource) {
      logger.info("Weekly Notion database found", {
        title,
        databaseID: dataSource.parent.database_id
      });
      return dataSource.parent.database_id;
    }

    cursor = response.has_more ? response.next_cursor ?? undefined : undefined;
  } while (cursor);

  logger.info("Weekly Notion database not found", { title });
  return null;
}

// Checks whether an item already exists in the database by URL
async function itemExistsInDatabaseByURL(databaseID: string, url: string): Promise<boolean> {
  if (!notion) return false;

  const database = await notion.databases.retrieve({ database_id: databaseID });
  if (!isFullDatabase(database)) {
    throw new Error(`Unable to read full database metadata for ${databaseID}.`);
  }

  const dataSourceID = database.data_sources[0]?.id;
  if (!dataSourceID) {
    throw new Error(`No data sources found for database ${databaseID}.`);
  }

  let cursor: string | undefined = undefined;

  do {
    const response = await notion.dataSources.query({
      data_source_id: dataSourceID,
      filter: {
        property: "URL",
        url: { equals: url }
      },
      page_size: 100,
      start_cursor: cursor
    });

    if (response.results.length > 0) return true;

    cursor = response.has_more ? response.next_cursor ?? undefined : undefined;
  } while (cursor);

  return false;
}

// Returns the weekly database ID (creates it if missing)
export async function getWeeklyDatabaseID(date: Date): Promise<string | undefined> {
  if (!notion) {
    logger.info("Skipping Notion database lookup because Notion is disabled");
    return undefined;
  }

  const title = buildWeekTitle(date);

  let databaseID = await findWeeklyDatabase(title);

  if (!databaseID) {
    const newDatabase: CreateDatabaseResponse = await notion.databases.create({
      parent: { type: "page_id", page_id: notion.parentPageID },
      title: [{ type: "text", text: { content: title } }],
      initial_data_source: {
        properties: {
          Title: { title: {} },
          Date: { date: {} },
          Score: { number: {} },
          Section: { select: { options: [] } },
          Source: { select: { options: [] } },
          Summary: { rich_text: {} },
          Tags: { multi_select: { options: [] } },
          URL: { url: {} }
        }
      }
    });

    databaseID = newDatabase.id;
    logger.info(`Weekly database created: ${title}`);
  } else {
    logger.info("Reusing existing weekly Notion database", {
      title,
      databaseID
    });
  }

  return databaseID;
}

// Saves an item to the weekly database
export async function saveItem(item: DigestItem, weeklyDatabaseID: string | undefined) {
  if (!notion) {
    if (!hasLoggedNotionUnavailableForSave) {
      logger.info("Skipping Notion item saves because Notion is disabled");
      hasLoggedNotionUnavailableForSave = true;
    }
    return;
  }

  if (!weeklyDatabaseID) {
    if (!hasLoggedMissingDatabaseIDForSave) {
      logger.warn("Skipping Notion item saves because weekly database ID is missing");
      hasLoggedMissingDatabaseIDForSave = true;
    }
    return;
  }

  if (item.url && await itemExistsInDatabaseByURL(weeklyDatabaseID, item.url)) {
    logger.info(`Skipping duplicate item: ${item.url}`);
    return;
  }

  const properties: Record<string, any> = {};

  if (item.title) {
    properties.Title = { title: [{ text: { content: item.title } }] };
  }

  if (item.date) {
    properties.Date = { date: { start: item.date.toISOString() } };
  }

  if (item.score != null) {
    properties.Score = { number: item.score };
  }

  if (item.section) {
    properties.Section = { select: { name: item.section } };
  }

  if (item.source) {
    properties.Source = { select: { name: item.source } };
  }

  if (item.summary) {
    properties.Summary = { rich_text: [{ text: { content: item.summary.trim().slice(0,2000) } }] };
  }

  if (item.tags?.length) {
    properties.Tags = { multi_select: item.tags.map(t => ({ name: t })) };
  }

  if (item.url) {
    properties.URL = { url: item.url };
  }

  try {
    const response = await withRetry(() => 
      notion.pages.create({
        parent: { database_id: weeklyDatabaseID },
        properties
      })
    );

    logger.info("Notion item saved", {
      pageID: response.id,
      url: item.url ?? "none"
    });
  } catch (error: unknown) {
    logger.error("Failed to save item to Notion", {
      url: item.url ?? "none",
      error: getErrorMessage(error)
    });
    throw error;
  }
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