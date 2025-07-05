// lib/logger.js
const Sentry = require("@sentry/nextjs");

const isDevelopment = process.env.NODE_ENV !== 'production';

const logger = {
  log: (...args) => {
    if (isDevelopment) {
    }
  },
  error: (...args) => {
    // Always log errors, but in production send to monitoring service
    
    // Send to Sentry in production
    if (!isDevelopment && args[0] instanceof Error) {
      Sentry.captureException(args[0]);
    } else if (!isDevelopment) {
      Sentry.captureMessage(args.join(' '), 'error');
    }
  },
  warn: (...args) => {
    if (isDevelopment) {
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