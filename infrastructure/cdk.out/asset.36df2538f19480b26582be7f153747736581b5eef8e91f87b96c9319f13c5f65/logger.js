/**
 * Structured JSON logger for CloudWatch Logs.
 * Outputs one JSON object per log line for easy querying and filtering.
 */

const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 };

function log(level, message, meta = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    service: 'LokKalaService',
    ...meta,
  };
  if (meta.requestId) entry.requestId = meta.requestId;
  console.log(JSON.stringify(entry));
}

export const logger = {
  debug: (msg, meta) => log('debug', msg, meta),
  info: (msg, meta) => log('info', msg, meta),
  warn: (msg, meta) => log('warn', msg, meta),
  error: (msg, meta) => log('error', msg, meta),
};
