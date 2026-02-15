'use strict';

/**
 * Structured JSON logger for CloudWatch Logs.
 */

function log(level, message, meta = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    service: 'CQRSFlatten',
    ...meta,
  };
  console.log(JSON.stringify(entry));
}

module.exports = {
  info: (msg, meta) => log('info', msg, meta),
  warn: (msg, meta) => log('warn', msg, meta),
  error: (msg, meta) => log('error', msg, meta),
};
