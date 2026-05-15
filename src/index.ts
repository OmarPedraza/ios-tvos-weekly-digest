import { generateDigest } from "./digest.js";
import { logger } from "./utils/logger.js";

generateDigest().catch((error: unknown) => {
  logger.error("Digest run failed", {
    error: getErrorMessage(error)
  });

  process.exit(1);
});

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;

  try {
    return JSON.stringify(error);
  } catch {
    return "Unknown error";
  }
}
