import {
  createHTTPRetryError,
  getErrorMessage,
  withRetry
} from "../../utils/retry.js";
import { fetchWithTimeout } from "../../utils/fetchWithTimeout.js";
import { logger } from "../../utils/logger.js";
import { config } from "../../config.js";

const HF_MODEL = "sshleifer/distilbart-cnn-12-6";
const HF_URL = `https://router.huggingface.co/hf-inference/models/${HF_MODEL}`;

const MAX_INPUT = 1200;
let hasLoggedMissingHFAPIKey = false;

interface HFResponse {
  error?: { message?: string };
  summary_text?: string;
}

export async function summarize(text?: string): Promise<string> {
  if (!text || text.length < 120) {
    logger.info("Skipping summarization for short text", {
      length: text?.length ?? 0
    });
    return text ?? "";
  }

  // 🧠 1. Basic pre-clean
  const cleaned = cleanText(text);

  // 🧠 2. Chunking
  const chunks = chunkText(cleaned, MAX_INPUT);
  logger.info("Summarization started", {
    inputLength: text.length,
    cleanedLength: cleaned.length,
    chunks: chunks.length,
    model: HF_MODEL,
    usingHF: Boolean(config.hfAPIKey)
  });

  // 🧠 3. Incremental summary
  const partials: string[] = [];

  for (const chunk of chunks) {
    const summary = await hfSummarize(chunk);
    partials.push(summary);
  }

  // 🧠 4. Final summary (reduces noise)
  const result = await hfSummarize(partials.join(" "));
  logger.info("Summarization completed", {
    chunks: chunks.length,
    outputLength: result.length
  });

  return result;
}

async function hfSummarize(text: string): Promise<string> {
  const apiKey = config.hfAPIKey;
  if (!apiKey) {
    if (!hasLoggedMissingHFAPIKey) {
      logger.info("HF_API_KEY missing; using fallback summarization");
      hasLoggedMissingHFAPIKey = true;
    }

    return smartFallback(text);
  }

  let response: Response;
  try {
    response = await withRetry(async () => {
      const reply = await fetchWithTimeout(
        HF_URL,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            inputs: text,
            parameters: {
              max_length: 100,
              min_length: 30
            },
            options: {
              wait_for_model: true
            }
          })
        },
        10000
      );

      if (!reply.ok) {
        throw await createHTTPRetryError("HF HTTP error", reply);
      }

      return reply;
    })
  } catch (error: unknown) {
    logger.error("HF request failed after retries", { message: getErrorMessage(error) });
    logger.warn("Using fallback summarization due to HF API request failure");
    return smartFallback(text);
  }

  let json: HFResponse | HFResponse[] | undefined;
  try {
    json = await response.json();
  } catch {
    logger.error("HF returned non-JSON response");
    logger.warn("Using fallback summarization due to HF response parse error");
    return smartFallback(text);
  }

  const jsonArray = Array.isArray(json) ? json : [json as HFResponse];
  const result = jsonArray[0];

  if (result?.error) {
    logger.error("HF error", { error: result.error.message });
    logger.warn("Using fallback summarization due to HF API error");

    return smartFallback(text);
  }

  const summaryText = result?.summary_text;
  if (!summaryText) {
    logger.warn("HF returned no summary text; using fallback summarization");
    return smartFallback(text);
  }

  return summaryText;
}

function chunkText(text: string, size: number): string[] {
  const chunks: string[] = [];

  for (let i = 0; i < text.length; i += size) {
    chunks.push(text.slice(i, i + size));
  }

  return chunks;
}

function cleanText(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .replace(/(Sign in|Subscribe|Cookie Policy).*/gi, "")
    .trim();
}

// 🔥 Better fallback for technical content
function smartFallback(text: string): string {
  const sentences = text.split(". ");

  // prioritize longer sentences (more information)
  const ranked = sentences
    .map(sentence => ({ sentence, score: sentence.length }))
    .sort((a, b) => b.score - a.score);

  return ranked
    .slice(0, 2)
    .map(entry => entry.sentence)
    .join(". ") + ".";
}