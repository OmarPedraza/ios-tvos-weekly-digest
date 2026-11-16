export const logger = {
  /**
   * Writes an informational log entry as structured JSON.
   */
  info: (message: string, meta?: Record<string, unknown>) => {
    console.log(JSON.stringify({
      level: "info",
      message,
      ...meta
    }))
  },

  /**
   * Writes a warning log entry as structured JSON.
   */
  warn: (message: string, meta?: Record<string, unknown>) => {
    console.warn(JSON.stringify({
      level: "warn",
      message,
      ...meta
    }))
  },

  /**
   * Writes an error log entry as structured JSON.
   */
  error: (message: string, meta?: Record<string, unknown>) => {
    console.error(JSON.stringify({
      level: "error",
      message,
      ...meta
    }))
  }
}