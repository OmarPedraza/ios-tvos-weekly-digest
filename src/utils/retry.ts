import { logger } from "./logger.js";

export class RetryError extends Error {
  status?: number

  constructor(
    message: string, 
    status?: number
  ) {
    super(message)

    this.name = "RetryError"
    this.status = status
  }

  static fromHTTP(
    context: string,
    status: number,
    statusText: string,
    body = ""
  ): RetryError {
    const trimmedBody = body.trim()
    const bodyMessage = trimmedBody ? ` body=${trimmedBody}` : ""

    return new RetryError(
      `${context}: HTTP ${status} ${statusText}${bodyMessage}`, 
      status
    )
  }
}

export async function createHTTPRetryError(
  context: string,
  response: Response
): Promise<RetryError> {
  return RetryError.fromHTTP(
    context, 
    response.status, 
    response.statusText, 
    await response.text()
  )  
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  options?: {
    retries?: number
    delayMs?: number
    factor?: number
  }
): Promise<T> {
  const {
    retries = 3,
    delayMs = 500,
    factor = 2
  } = options || {}

  let attempt = 0

  while (attempt <= retries) {
    try {
      return await operation()
    } catch (error: unknown) {
      const retryable = resolveRetryableFromStatus(getErrorStatus(error)) 
      if (retryable === false) {
        throw error
      }

      if (attempt === retries) {
        throw error
      }

      logger.warn("Retrying operation", {
        attempt,
        error: getErrorMessage(error),
        status: getErrorStatus(error)
      })

      const wait = delayMs * Math.pow(factor, attempt)
      await new Promise(resolve => setTimeout(resolve, wait))

      attempt++
    }
  }

  throw new Error("Unreachable")
}

function resolveRetryableFromStatus(status?: number): boolean | undefined {
  if (typeof status !== "number") {
    return undefined
  }

  if (status === 429) return true
  if (status >= 500 && status < 600) return true
  if (status >= 400 && status < 500) return false

  return undefined
}

function getErrorStatus(error: unknown): number | undefined {
  if (error instanceof RetryError) {
    return error.status
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    typeof (error as { status?: unknown }).status === "number"
  ) {
    return (error as { status: number }).status
  }

  return undefined
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === "string") {
    return error
  }

  try {
    return JSON.stringify(error)
  } catch {
    return "Unknown error"
  }
}