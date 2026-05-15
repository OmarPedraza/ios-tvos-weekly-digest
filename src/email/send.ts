import nodemailer from "nodemailer";

import { withRetry } from "../utils/retry.js";
import { config } from "../config.js";
import { logger } from "../utils/logger.js";
import { renderHTMLDigest } from "./template.js";
import type { DigestItem } from "../types.js";

export async function sendEmail(items: DigestItem[], databaseID?: string) {
  logger.info("Preparing digest email", {
    to: config.email.target,
    count: items.length,
    hasNotionDatabaseID: Boolean(databaseID)
  });

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: config.email.user,
      pass: config.email.pass
    }
  });

  const html = renderHTMLDigest(items, databaseID);
  const text = items
    .sort((a, b) => b.score - a.score)
    .map(item => `• ${item.title}\n  ${item.url}`)
    .join("\n\n");

  try {
    const response = await withRetry(() => 
      transporter.sendMail({
        from: config.email.user,
        to: config.email.target,
        subject: "📱 iOS & tvOS Weekly Digest",
        html,
        text
      })
    );

    logger.info("Digest email sent", {
      messageID: response.messageId,
      accepted: response.accepted.length,
      rejected: response.rejected.length
    });
  } catch (error: unknown) {
    logger.error("Failed to send digest email", {
      to: config.email.target,
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
