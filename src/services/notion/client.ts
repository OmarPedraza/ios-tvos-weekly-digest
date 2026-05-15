import { Client } from "@notionhq/client";

import { config } from "../../config.js";
import { logger } from "../../utils/logger.js";

type NotionClient = Client & {
  parentPageID: string;
};

export function createNotionClient(): NotionClient | undefined {
  if (config.notion.apiKey && config.notion.parentPageID) {
    const client = new Client({ auth: config.notion.apiKey }) as NotionClient;
    client.parentPageID = config.notion.parentPageID;

    return client;
  } else {
    logger.info("⚠️ Notion disabled (missing environment variables)");

    return undefined;
  } 
}
