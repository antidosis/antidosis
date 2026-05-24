/**
 * Structured logger for production environments.
 *
 * In production (Vercel, Railway, etc.), logs should be JSON so they can be
 * parsed by log aggregators. In development, logs are human-readable.
 */

const isProduction = process.env.NODE_ENV === "production";

interface LogContext {
  [key: string]: unknown;
}

function formatLog(level: string, message: string, context?: LogContext, error?: Error) {
  const timestamp = new Date().toISOString();

  if (isProduction) {
    const logEntry: Record<string, unknown> = {
      timestamp,
      level,
      message,
      ...context,
    };
    if (error) {
      logEntry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }
    return JSON.stringify(logEntry);
  }

  // Development: human-readable
  let output = `[${timestamp}] ${level}: ${message}`;
  if (context && Object.keys(context).length > 0) {
    output += ` | ${JSON.stringify(context)}`;
  }
  if (error) {
    output += `\n  ${error.stack || error.message}`;
  }
  return output;
}

export const logger = {
  info: (message: string, context?: LogContext) => {
    console.log(formatLog("INFO", message, context));
  },

  warn: (message: string, context?: LogContext) => {
    console.warn(formatLog("WARN", message, context));
  },

  error: (message: string, error?: Error, context?: LogContext) => {
    console.error(formatLog("ERROR", message, context, error));
  },

  debug: (message: string, context?: LogContext) => {
    if (!isProduction) {
      console.log(formatLog("DEBUG", message, context));
    }
  },
};
