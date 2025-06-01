// lib/logger.js
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
    
    // TODO: Send to error tracking service in production
    if (!isDevelopment) {
      // Example: Sentry.captureException(args[0]);
    }
  },
  warn: (...args) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },
  info: (...args) => {
    if (isDevelopment) {
      console.info(...args);
    }
  }
};

export default logger;