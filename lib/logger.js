// lib/logger.js
const Sentry = require("@sentry/nextjs");

const isDevelopment = process.env.NODE_ENV !== 'production';

const logger = {
  log: (...args) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },
  error: (...args) => {
    // Always log errors, but in production send to monitoring service
    console.error(...args);
    
    // Send to Sentry in production
    if (!isDevelopment && args[0] instanceof Error) {
      Sentry.captureException(args[0]);
    } else if (!isDevelopment) {
      Sentry.captureMessage(args.join(' '), 'error');
    }
  },
  warn: (...args) => {
    if (isDevelopment) {
      console.warn(...args);
    } else {
      Sentry.captureMessage(args.join(' '), 'warning');
    }
  },
  info: (...args) => {
    if (isDevelopment) {
      console.info(...args);
    }
  }
};

module.exports = logger;