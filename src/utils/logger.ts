/**
 * Client-side logger for structured console output and future integration
 * with monitoring services (e.g., Sentry, LogRocket).
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogMeta {
  [key: string]: unknown;
}

const isDev = import.meta.env?.DEV ?? false;

function formatEntry(level: LogLevel, message: string, meta?: LogMeta): string {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...meta,
  };
  return JSON.stringify(entry);
}

function log(level: LogLevel, message: string, meta?: LogMeta): void {
  const formatted = formatEntry(level, message, meta);
  switch (level) {
    case 'debug':
      if (isDev) console.debug(formatted);
      break;
    case 'info':
      console.info(formatted);
      break;
    case 'warn':
      console.warn(formatted);
      break;
    case 'error':
      console.error(formatted);
      break;
  }
}

export const logger = {
  debug: (message: string, meta?: LogMeta) => log('debug', message, meta),
  info: (message: string, meta?: LogMeta) => log('info', message, meta),
  warn: (message: string, meta?: LogMeta) => log('warn', message, meta),
  error: (message: string, meta?: LogMeta) => log('error', message, meta),
};
